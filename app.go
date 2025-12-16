package main

import (
	"context"
	"crypto/tls"
	"database/sql"
	"fmt"
	"net"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	_ "modernc.org/sqlite"
)

// App struct
type App struct {
	ctx context.Context
	db  *sql.DB
}

// CertificateInfo 证书信息结构
type CertificateInfo struct {
	ID            int64    `json:"id,omitempty"`
	Domain        string   `json:"domain"`
	Issuer        string   `json:"issuer"`
	Subject       string   `json:"subject"`
	NotBefore     string   `json:"notBefore"`
	NotAfter      string   `json:"notAfter"`
	DaysRemaining int      `json:"daysRemaining"`
	IsValid       bool     `json:"isValid"`
	Status        string   `json:"status"` // "safe", "warning", "danger", "expired"
	SerialNumber  string   `json:"serialNumber"`
	Version       int      `json:"version"`
	QueryTime     string   `json:"queryTime,omitempty"`  // 查询时间
	SANDomains    []string `json:"sanDomains,omitempty"` // SAN域名列表（Subject Alternative Names）
}

// QueryResult 查询结果
type QueryResult struct {
	Success bool             `json:"success"`
	Message string           `json:"message"`
	Data    *CertificateInfo `json:"data,omitempty"`
	Error   string           `json:"error,omitempty"`
}

// BatchQueryResult 批量查询结果
type BatchQueryResult struct {
	Success bool              `json:"success"`
	Message string            `json:"message"`
	Total   int               `json:"total"`
	Results []CertificateInfo `json:"results"`
	Errors  []string          `json:"errors,omitempty"`
}

// HistoryQueryResult 历史记录查询结果
type HistoryQueryResult struct {
	Success bool              `json:"success"`
	Message string            `json:"message"`
	Total   int               `json:"total"`
	Records []CertificateInfo `json:"records"`
	Error   string            `json:"error,omitempty"`
}

// WatchedDomain 关注的域名结构
type WatchedDomain struct {
	ID               int64            `json:"id"`
	Domain           string           `json:"domain"`
	Nickname         string           `json:"nickname,omitempty"`
	AddedTime        string           `json:"addedTime"`
	LastCheckTime    string           `json:"lastCheckTime,omitempty"`
	CertInfo         *CertificateInfo `json:"certInfo,omitempty"`         // 最新证书信息
	NotifyEnabled    bool             `json:"notifyEnabled"`              // 是否启用通知
	NotifyThreshold  int              `json:"notifyThreshold"`            // 预警阈值（天数）
	IsManual         bool             `json:"isManual"`                   // 是否手动录入
	ManualExpireDate string           `json:"manualExpireDate,omitempty"` // 手动录入的过期时间
	ManualStartDate  string           `json:"manualStartDate,omitempty"`  // 手动录入的生效时间
}

// WatchedDomainsResult 关注域名查询结果
type WatchedDomainsResult struct {
	Success bool            `json:"success"`
	Message string          `json:"message"`
	Total   int             `json:"total"`
	Domains []WatchedDomain `json:"domains"`
	Error   string          `json:"error,omitempty"`
}

// WatchDomainRequest 添加关注域名请求
type WatchDomainRequest struct {
	Domain   string `json:"domain"`
	Nickname string `json:"nickname,omitempty"`
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	// 初始化数据库
	a.initDB()
}

// CheckCertificate 检查SSL证书（用户主动查询，保存历史记录）
func (a *App) CheckCertificate(domain string) QueryResult {
	result := a.checkCertificateInternal(domain)

	// 用户主动查询时保存到历史记录
	if result.Success {
		if err := a.saveCertificate(result.Data); err != nil {
			// 记录详细错误信息
			fmt.Printf("❌ 保存证书到历史记录失败 %s: %v\n", domain, err)
			// 可以选择将错误信息附加到结果中（但不影响查询成功状态）
			if result.Message != "" {
				result.Message += fmt.Sprintf(" (保存历史记录失败: %v)", err)
			}
		} else {
			fmt.Printf("✅ 证书查询成功并已保存到历史记录: %s\n", domain)
		}
	}

	return result
}

// checkCertificateInternal 内部证书查询方法（不保存历史记录）
func (a *App) checkCertificateInternal(domain string) QueryResult {
	if domain == "" {
		return QueryResult{
			Success: false,
			Error:   "请输入有效的域名",
			Message: "域名不能为空",
		}
	}

	// 连接超时设置为5秒
	dialer := &net.Dialer{
		Timeout: 5 * time.Second,
	}

	// 建立TLS连接
	conn, err := tls.DialWithDialer(dialer, "tcp", domain+":443", &tls.Config{
		InsecureSkipVerify: true, // 跳过证书验证，因为我们只关心获取证书信息
	})

	if err != nil {
		return QueryResult{
			Success: false,
			Error:   err.Error(),
			Message: fmt.Sprintf("无法连接到 %s：%v", domain, err),
		}
	}
	defer conn.Close()

	// 获取证书链
	certs := conn.ConnectionState().PeerCertificates
	if len(certs) == 0 {
		return QueryResult{
			Success: false,
			Error:   "未获取到证书信息",
			Message: "服务器未返回证书",
		}
	}

	// 获取第一个证书（服务器证书）
	cert := certs[0]

	// 获取SAN域名列表
	var sanDomains []string
	if len(cert.DNSNames) > 0 {
		sanDomains = cert.DNSNames
	}

	// 计算过期时间
	expiryDate := cert.NotAfter
	startDate := cert.NotBefore
	daysRemaining := int(expiryDate.Sub(time.Now()).Hours() / 24)

	// 判断证书状态
	var status string
	if daysRemaining < 0 {
		status = "expired"
	} else if daysRemaining <= 7 {
		status = "danger"
	} else if daysRemaining <= 30 {
		status = "warning"
	} else {
		status = "safe"
	}

	// 构建证书信息
	certInfo := &CertificateInfo{
		Domain:        domain,
		Issuer:        cert.Issuer.CommonName,
		Subject:       cert.Subject.CommonName,
		NotBefore:     startDate.Format("2006-01-02 15:04:05"),
		NotAfter:      expiryDate.Format("2006-01-02 15:04:05"),
		DaysRemaining: daysRemaining,
		IsValid:       daysRemaining > 0,
		Status:        status,
		SerialNumber:  cert.SerialNumber.String(),
		Version:       cert.Version,
		SANDomains:    sanDomains,
	}

	return QueryResult{
		Success: true,
		Message: "证书查询成功",
		Data:    certInfo,
	}
}

// initDB 初始化SQLite数据库
func (a *App) initDB() {
	var err error

	// 获取应用数据目录
	// Windows: C:\Users\用户名\AppData\Roaming\SSL-Cert-Checker
	appDataDir, err := os.UserConfigDir()
	if err != nil {
		fmt.Printf("获取应用数据目录失败: %v\n", err)
		return
	}

	// 创建应用专属目录
	dbDir := filepath.Join(appDataDir, "SSL-Cert-Checker")
	err = os.MkdirAll(dbDir, 0755)
	if err != nil {
		fmt.Printf("创建数据目录失败: %v\n", err)
		return
	}

	// 数据库文件路径
	dbPath := filepath.Join(dbDir, "data.db")
	fmt.Printf("数据库文件路径: %s\n", dbPath)

	// 连接SQLite数据库
	a.db, err = sql.Open("sqlite", dbPath)
	if err != nil {
		fmt.Printf("连接SQLite数据库失败: %v\n", err)
		return
	}

	// 测试数据库连接
	err = a.db.Ping()
	if err != nil {
		fmt.Printf("数据库连接测试失败: %v\n", err)
		return
	}

	// 设置连接池参数
	a.db.SetMaxOpenConns(1) // SQLite建议单连接
	a.db.SetMaxIdleConns(1)
	a.db.SetConnMaxLifetime(0)

	// 创建表结构
	err = a.createTables()
	if err != nil {
		fmt.Printf("创建数据表失败: %v\n", err)
		return
	}

	fmt.Println("✅ SQLite数据库连接成功")
}

// createTables 创建数据表
func (a *App) createTables() error {
	// 创建证书历史记录表
	certificatesTable := `
	CREATE TABLE IF NOT EXISTS certificates (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		domain TEXT NOT NULL,
		issuer TEXT,
		subject TEXT,
		not_before DATETIME,
		not_after DATETIME,
		days_remaining INTEGER,
		is_valid BOOLEAN,
		status TEXT,
		serial_number TEXT,
		version INTEGER,
		query_time DATETIME DEFAULT (datetime('now', 'localtime'))
	);
	`

	_, err := a.db.Exec(certificatesTable)
	if err != nil {
		return fmt.Errorf("创建certificates表失败: %v", err)
	}

	// 创建关注域名表
	watchedDomainsTable := `
	CREATE TABLE IF NOT EXISTS watched_domains (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		domain TEXT NOT NULL UNIQUE,
		nickname TEXT,
		added_time DATETIME DEFAULT (datetime('now', 'localtime')),
		last_check_time DATETIME,
		notify_enabled BOOLEAN DEFAULT 0,
		notify_threshold INTEGER DEFAULT 7,
		is_manual BOOLEAN DEFAULT 0,
		manual_expire_date DATETIME,
		manual_start_date DATETIME
	);
	`

	_, err = a.db.Exec(watchedDomainsTable)
	if err != nil {
		return fmt.Errorf("创建watched_domains表失败: %v", err)
	}

	// 为旧数据添加新字段（如果不存在）
	a.db.Exec("ALTER TABLE watched_domains ADD COLUMN notify_enabled BOOLEAN DEFAULT 0")
	a.db.Exec("ALTER TABLE watched_domains ADD COLUMN notify_threshold INTEGER DEFAULT 7")
	a.db.Exec("ALTER TABLE watched_domains ADD COLUMN is_manual BOOLEAN DEFAULT 0")
	a.db.Exec("ALTER TABLE watched_domains ADD COLUMN manual_expire_date DATETIME")
	a.db.Exec("ALTER TABLE watched_domains ADD COLUMN manual_start_date DATETIME")

	return nil
}

// saveCertificate 保存证书信息到数据库
func (a *App) saveCertificate(cert *CertificateInfo) error {
	if a.db == nil {
		return fmt.Errorf("数据库未初始化")
	}

	// SQLite可以直接存储字符串格式的日期时间
	insertSQL := `
	INSERT INTO certificates (
		domain, issuer, subject, not_before, not_after, 
		days_remaining, is_valid, status, serial_number, version
	) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	result, err := a.db.Exec(insertSQL,
		cert.Domain,
		cert.Issuer,
		cert.Subject,
		cert.NotBefore,
		cert.NotAfter,
		cert.DaysRemaining,
		cert.IsValid,
		cert.Status,
		cert.SerialNumber,
		cert.Version,
	)

	if err != nil {
		return fmt.Errorf("插入数据失败: %v", err)
	}

	// 记录日志（仅用于调试）
	rowsAffected, _ := result.RowsAffected()
	fmt.Printf("✅ 保存证书到历史记录: %s (影响行数: %d)\n", cert.Domain, rowsAffected)

	return nil
}

// BatchCheckCertificates 批量查询SSL证书
func (a *App) BatchCheckCertificates(domains string) BatchQueryResult {
	if domains == "" {
		return BatchQueryResult{
			Success: false,
			Message: "请输入域名列表",
		}
	}

	// 按行分割域名
	domainList := strings.Split(strings.TrimSpace(domains), "\n")
	var validDomains []string
	for _, domain := range domainList {
		domain = strings.TrimSpace(domain)
		if domain != "" {
			validDomains = append(validDomains, domain)
		}
	}

	if len(validDomains) == 0 {
		return BatchQueryResult{
			Success: false,
			Message: "没有有效的域名",
		}
	}

	// 并发查询
	var wg sync.WaitGroup
	var mu sync.Mutex
	var results []CertificateInfo
	var errors []string

	for _, domain := range validDomains {
		wg.Add(1)
		go func(d string) {
			defer wg.Done()

			result := a.CheckCertificate(d)
			mu.Lock()
			defer mu.Unlock()

			if result.Success {
				results = append(results, *result.Data)
				// 注意：CheckCertificate已经自动保存到历史记录，无需重复保存
			} else {
				errors = append(errors, fmt.Sprintf("%s: %s", d, result.Error))
			}
		}(domain)
	}

	wg.Wait()

	return BatchQueryResult{
		Success: len(results) > 0,
		Message: fmt.Sprintf("共查询 %d 个域名，成功 %d 个", len(validDomains), len(results)),
		Total:   len(validDomains),
		Results: results,
		Errors:  errors,
	}
}

// GetHistory 获取历史记录
func (a *App) GetHistory(limit int) HistoryQueryResult {
	if a.db == nil {
		return HistoryQueryResult{
			Success: false,
			Error:   "数据库未初始化",
		}
	}

	if limit <= 0 {
		limit = 50 // 默认查询50条
	}

	querySQL := `
	SELECT id, domain, issuer, subject, 
	       strftime('%Y-%m-%d %H:%M:%S', not_before) as not_before,
	       strftime('%Y-%m-%d %H:%M:%S', not_after) as not_after,
	       days_remaining, is_valid, status, serial_number, version, 
	       strftime('%Y-%m-%d %H:%M:%S', query_time) as query_time
	FROM certificates
	ORDER BY query_time DESC
	LIMIT ?
	`

	rows, err := a.db.Query(querySQL, limit)
	if err != nil {
		return HistoryQueryResult{
			Success: false,
			Error:   fmt.Sprintf("查询失败: %v", err),
		}
	}
	defer rows.Close()

	var records []CertificateInfo
	for rows.Next() {
		var cert CertificateInfo
		err := rows.Scan(
			&cert.ID,
			&cert.Domain,
			&cert.Issuer,
			&cert.Subject,
			&cert.NotBefore,
			&cert.NotAfter,
			&cert.DaysRemaining,
			&cert.IsValid,
			&cert.Status,
			&cert.SerialNumber,
			&cert.Version,
			&cert.QueryTime,
		)
		if err != nil {
			continue
		}
		records = append(records, cert)
	}

	return HistoryQueryResult{
		Success: true,
		Message: fmt.Sprintf("查询到 %d 条历史记录", len(records)),
		Total:   len(records),
		Records: records,
	}
}

// ClearHistory 清空历史记录
func (a *App) ClearHistory() error {
	if a.db == nil {
		return fmt.Errorf("数据库未初始化")
	}

	_, err := a.db.Exec("DELETE FROM certificates")
	return err
}

// ==================== 关注域名功能 ====================

// AddWatchedDomain 添加关注域名
func (a *App) AddWatchedDomain(domain, nickname string) QueryResult {
	if a.db == nil {
		return QueryResult{
			Success: false,
			Error:   "数据库未初始化",
		}
	}

	if domain == "" {
		return QueryResult{
			Success: false,
			Error:   "域名不能为空",
		}
	}

	// 检查是否已经关注
	var count int
	err := a.db.QueryRow("SELECT COUNT(*) FROM watched_domains WHERE domain = ?", domain).Scan(&count)
	if err != nil {
		return QueryResult{
			Success: false,
			Error:   fmt.Sprintf("查询失败: %v", err),
		}
	}

	if count > 0 {
		return QueryResult{
			Success: false,
			Error:   "该域名已经在关注列表中",
		}
	}

	// 插入关注域名
	insertSQL := "INSERT INTO watched_domains (domain, nickname) VALUES (?, ?)"
	_, err = a.db.Exec(insertSQL, domain, nickname)
	if err != nil {
		return QueryResult{
			Success: false,
			Error:   fmt.Sprintf("添加失败: %v", err),
		}
	}

	return QueryResult{
		Success: true,
		Message: "添加关注成功",
	}
}

// GetWatchedDomains 获取关注域名列表（并自动查询最新证书信息）
func (a *App) GetWatchedDomains() WatchedDomainsResult {
	if a.db == nil {
		return WatchedDomainsResult{
			Success: false,
			Error:   "数据库未初始化",
		}
	}

	// 查询所有关注的域名
	querySQL := `
	SELECT id, domain, nickname, 
	       strftime('%Y-%m-%d %H:%M:%S', added_time) as added_time,
	       strftime('%Y-%m-%d %H:%M:%S', last_check_time) as last_check_time,
	       notify_enabled, notify_threshold, is_manual,
	       strftime('%Y-%m-%d %H:%M:%S', manual_expire_date) as manual_expire_date,
	       strftime('%Y-%m-%d %H:%M:%S', manual_start_date) as manual_start_date
	FROM watched_domains
	ORDER BY added_time DESC
	`

	rows, err := a.db.Query(querySQL)
	if err != nil {
		return WatchedDomainsResult{
			Success: false,
			Error:   fmt.Sprintf("查询失败: %v", err),
		}
	}
	defer rows.Close()

	// 先收集所有域名
	var domains []WatchedDomain
	for rows.Next() {
		var wd WatchedDomain
		var lastCheckTime sql.NullString
		var nickname sql.NullString
		var manualExpireDate sql.NullString
		var manualStartDate sql.NullString

		err := rows.Scan(&wd.ID, &wd.Domain, &nickname, &wd.AddedTime, &lastCheckTime,
			&wd.NotifyEnabled, &wd.NotifyThreshold, &wd.IsManual, &manualExpireDate, &manualStartDate)
		if err != nil {
			continue
		}

		if nickname.Valid {
			wd.Nickname = nickname.String
		}
		if lastCheckTime.Valid {
			wd.LastCheckTime = lastCheckTime.String
		}
		if manualExpireDate.Valid {
			wd.ManualExpireDate = manualExpireDate.String
		}
		if manualStartDate.Valid {
			wd.ManualStartDate = manualStartDate.String
		}

		domains = append(domains, wd)
	}

	// 使用并发查询证书信息，提高性能
	if len(domains) > 0 {
		var wg sync.WaitGroup
		var mu sync.Mutex // 保护对domains的并发访问

		for i := range domains {
			wg.Add(1)
			go func(index int) {
				defer wg.Done()

				mu.Lock()
				// 如果是手动录入的域名，使用手动数据
				if domains[index].IsManual && domains[index].ManualExpireDate != "" {
					// 构造手动证书信息
					expireTime, err := time.Parse("2006-01-02 15:04:05", domains[index].ManualExpireDate)
					if err == nil {
						daysRemaining := int(expireTime.Sub(time.Now()).Hours() / 24)
						var status string
						if daysRemaining < 0 {
							status = "expired"
						} else if daysRemaining <= 7 {
							status = "danger"
						} else if daysRemaining <= 30 {
							status = "warning"
						} else {
							status = "safe"
						}

						// 生效时间：优先使用手动录入的，否则显示"-"
						notBefore := "-"
						if domains[index].ManualStartDate != "" {
							notBefore = domains[index].ManualStartDate
						}

						domains[index].CertInfo = &CertificateInfo{
							Domain:        domains[index].Domain,
							Issuer:        "手动录入",
							Subject:       domains[index].Domain,
							NotBefore:     notBefore,
							NotAfter:      domains[index].ManualExpireDate,
							DaysRemaining: daysRemaining,
							IsValid:       daysRemaining > 0,
							Status:        status,
							SerialNumber:  "-",
							Version:       0,
						}
					}
					mu.Unlock()
				} else {
					mu.Unlock()
					// 自动查询最新证书信息（不保存到历史记录）
					certResult := a.checkCertificateInternal(domains[index].Domain)

					mu.Lock()
					if certResult.Success {
						domains[index].CertInfo = certResult.Data

						// 更新last_check_time
						a.db.Exec("UPDATE watched_domains SET last_check_time = datetime('now', 'localtime') WHERE id = ?", domains[index].ID)
					}
					mu.Unlock()
				}
			}(i)
		}

		// 等待所有查询完成
		wg.Wait()
	}

	return WatchedDomainsResult{
		Success: true,
		Message: fmt.Sprintf("查询到 %d 个关注域名", len(domains)),
		Total:   len(domains),
		Domains: domains,
	}
}

// RemoveWatchedDomain 移除关注域名
func (a *App) RemoveWatchedDomain(id int64) error {
	if a.db == nil {
		return fmt.Errorf("数据库未初始化")
	}

	_, err := a.db.Exec("DELETE FROM watched_domains WHERE id = ?", id)
	return err
}

// UpdateWatchedDomainNickname 更新域名备注
func (a *App) UpdateWatchedDomainNickname(id int64, nickname string) error {
	if a.db == nil {
		return fmt.Errorf("数据库未初始化")
	}

	_, err := a.db.Exec("UPDATE watched_domains SET nickname = ? WHERE id = ?", nickname, id)
	return err
}

// RefreshWatchedDomain 刷新单个关注域名的证书信息（不保存历史记录）
func (a *App) RefreshWatchedDomain(domain string) QueryResult {
	if a.db == nil {
		return QueryResult{
			Success: false,
			Error:   "数据库未初始化",
		}
	}

	// 查询证书信息（不保存到历史记录）
	result := a.checkCertificateInternal(domain)
	if result.Success {
		// 更新最后检查时间
		a.db.Exec("UPDATE watched_domains SET last_check_time = datetime('now', 'localtime') WHERE domain = ?", domain)
	}

	return result
}

// UpdateNotifySettings 更新通知设置
func (a *App) UpdateNotifySettings(id int64, enabled bool, threshold int) error {
	if a.db == nil {
		return fmt.Errorf("数据库未初始化")
	}

	// 阈值校验：1-365天
	if threshold < 1 || threshold > 365 {
		return fmt.Errorf("预警阈值必须在1-365天之间")
	}

	updateSQL := "UPDATE watched_domains SET notify_enabled = ?, notify_threshold = ? WHERE id = ?"
	_, err := a.db.Exec(updateSQL, enabled, threshold, id)
	if err != nil {
		return fmt.Errorf("更新通知设置失败: %v", err)
	}

	fmt.Printf("✅ 更新通知设置成功: ID=%d, 启用=%v, 阈值=%d天\n", id, enabled, threshold)
	return nil
}

// UpdateManualCertInfo 更新手动证书信息
func (a *App) UpdateManualCertInfo(id int64, startDate string, expireDate string) error {
	if a.db == nil {
		return fmt.Errorf("数据库未初始化")
	}

	// 验证过期时间
	if expireDate == "" {
		return fmt.Errorf("过期时间不能为空")
	}

	// 解析并格式化过期时间
	expireDateTime, err := parseDateTime(expireDate)
	if err != nil {
		return err
	}

	// 解析并格式化生效时间（可选）
	var startDateTime string
	if startDate != "" {
		startDateTime, err = parseDateTime(startDate)
		if err != nil {
			return fmt.Errorf("生效时间格式错误: %v", err)
		}

		// 验证生效时间必须早于过期时间
		startTime, _ := time.Parse("2006-01-02 15:04:05", startDateTime)
		endTime, _ := time.Parse("2006-01-02 15:04:05", expireDateTime)
		if startTime.After(endTime) || startTime.Equal(endTime) {
			return fmt.Errorf("生效时间必须早于过期时间")
		}
	}

	updateSQL := "UPDATE watched_domains SET is_manual = 1, manual_start_date = ?, manual_expire_date = ? WHERE id = ?"
	_, err = a.db.Exec(updateSQL, startDateTime, expireDateTime, id)
	if err != nil {
		return fmt.Errorf("更新手动证书信息失败: %v", err)
	}

	fmt.Printf("✅ 更新手动证书信息成功: ID=%d, 生效时间=%s, 过期时间=%s\n", id, startDateTime, expireDateTime)
	return nil
}

// parseDateTime 解析并格式化日期时间
func parseDateTime(dateStr string) (string, error) {
	if dateStr == "" {
		return "", nil
	}

	// 尝试解析完整日期时间格式
	_, err := time.Parse("2006-01-02 15:04:05", dateStr)
	if err == nil {
		return dateStr, nil
	}

	// 尝试解析仅日期格式
	_, err = time.Parse("2006-01-02", dateStr)
	if err == nil {
		// 补充时间部分：生效时间为 00:00:00，过期时间为 23:59:59
		return dateStr + " 00:00:00", nil
	}

	return "", fmt.Errorf("日期格式错误，请使用 YYYY-MM-DD 或 YYYY-MM-DD HH:MM:SS 格式")
}

// DisableManualMode 禁用手动模式，恢复自动查询
func (a *App) DisableManualMode(id int64) error {
	if a.db == nil {
		return fmt.Errorf("数据库未初始化")
	}

	updateSQL := "UPDATE watched_domains SET is_manual = 0, manual_expire_date = NULL, manual_start_date = NULL WHERE id = ?"
	_, err := a.db.Exec(updateSQL, id)
	if err != nil {
		return fmt.Errorf("禁用手动模式失败: %v", err)
	}

	fmt.Printf("✅ 禁用手动模式成功: ID=%d\n", id)
	return nil
}

// NotificationItem 通知项
type NotificationItem struct {
	ID            int64  `json:"id"`
	Domain        string `json:"domain"`
	Nickname      string `json:"nickname,omitempty"`
	DaysRemaining int    `json:"daysRemaining"`
	NotAfter      string `json:"notAfter"`
	Threshold     int    `json:"threshold"`
	Status        string `json:"status"`
}

// NotificationResult 通知检查结果
type NotificationResult struct {
	Success bool               `json:"success"`
	Message string             `json:"message"`
	Total   int                `json:"total"`
	Items   []NotificationItem `json:"items"`
}

// CheckNotifications 检查需要通知的域名
func (a *App) CheckNotifications() NotificationResult {
	if a.db == nil {
		return NotificationResult{
			Success: false,
			Message: "数据库未初始化",
		}
	}

	// 获取所有启用通知的域名
	domainsResult := a.GetWatchedDomains()
	if !domainsResult.Success {
		return NotificationResult{
			Success: false,
			Message: "查询域名失败",
		}
	}

	var notifications []NotificationItem

	// 筛选需要通知的域名
	for _, domain := range domainsResult.Domains {
		// 必须启用通知
		if !domain.NotifyEnabled {
			continue
		}

		// 必须有证书信息
		if domain.CertInfo == nil {
			continue
		}

		// 跳过已过期的（单独处理）
		if domain.CertInfo.DaysRemaining < 0 {
			continue
		}

		// 检查是否满足预警阈值
		if domain.CertInfo.DaysRemaining <= domain.NotifyThreshold {
			notifications = append(notifications, NotificationItem{
				ID:            domain.ID,
				Domain:        domain.Domain,
				Nickname:      domain.Nickname,
				DaysRemaining: domain.CertInfo.DaysRemaining,
				NotAfter:      domain.CertInfo.NotAfter,
				Threshold:     domain.NotifyThreshold,
				Status:        domain.CertInfo.Status,
			})
		}
	}

	if len(notifications) == 0 {
		return NotificationResult{
			Success: true,
			Message: "没有需要通知的域名",
			Total:   0,
			Items:   []NotificationItem{},
		}
	}

	return NotificationResult{
		Success: true,
		Message: fmt.Sprintf("发现 %d 个域名需要关注", len(notifications)),
		Total:   len(notifications),
		Items:   notifications,
	}
}

// RefreshAllWatchedDomains 刷新所有关注域名的证书信息（供定时器调用）
func (a *App) RefreshAllWatchedDomains() WatchedDomainsResult {
	fmt.Println("🔄 开始自动刷新所有关注域名...")

	// 调用GetWatchedDomains会自动查询最新证书信息
	result := a.GetWatchedDomains()

	if result.Success {
		fmt.Printf("✅ 自动刷新完成：共 %d 个域名\n", result.Total)
	} else {
		fmt.Printf("❌ 自动刷新失败：%s\n", result.Error)
	}

	return result
}

// ImportDomainItem 导入域名项
type ImportDomainItem struct {
	Domain   string `json:"domain"`
	Nickname string `json:"nickname,omitempty"`
}

// ImportDomainsResult 批量导入结果
type ImportDomainsResult struct {
	Success       bool     `json:"success"`
	Message       string   `json:"message"`
	Total         int      `json:"total"`         // 总数
	SuccessCount  int      `json:"successCount"`  // 成功数
	SkippedCount  int      `json:"skippedCount"`  // 跳过数（已存在）
	FailedCount   int      `json:"failedCount"`   // 失败数
	FailedDomains []string `json:"failedDomains"` // 失败的域名列表
}

// ImportDomainsFromText 从文本批量导入域名（支持CSV/TXT格式）
func (a *App) ImportDomainsFromText(text string) ImportDomainsResult {
	if a.db == nil {
		return ImportDomainsResult{
			Success: false,
			Message: "数据库未初始化",
		}
	}

	if text == "" {
		return ImportDomainsResult{
			Success: false,
			Message: "导入内容不能为空",
		}
	}

	// 按行分割
	lines := strings.Split(strings.TrimSpace(text), "\n")
	var domains []ImportDomainItem

	// 解析每一行
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			// 跳过空行和注释行
			continue
		}

		// 支持CSV格式：域名,备注
		parts := strings.Split(line, ",")
		domain := strings.TrimSpace(parts[0])
		var nickname string
		if len(parts) > 1 {
			nickname = strings.TrimSpace(parts[1])
		}

		if domain != "" {
			domains = append(domains, ImportDomainItem{
				Domain:   domain,
				Nickname: nickname,
			})
		}
	}

	if len(domains) == 0 {
		return ImportDomainsResult{
			Success: false,
			Message: "没有有效的域名",
		}
	}

	// 批量导入
	var successCount, skippedCount, failedCount int
	var failedDomains []string

	for _, item := range domains {
		// 检查是否已存在
		var count int
		err := a.db.QueryRow("SELECT COUNT(*) FROM watched_domains WHERE domain = ?", item.Domain).Scan(&count)
		if err != nil {
			failedCount++
			failedDomains = append(failedDomains, fmt.Sprintf("%s (查询失败)", item.Domain))
			continue
		}

		if count > 0 {
			// 已存在，跳过
			skippedCount++
			continue
		}

		// 插入域名
		insertSQL := "INSERT INTO watched_domains (domain, nickname) VALUES (?, ?)"
		_, err = a.db.Exec(insertSQL, item.Domain, item.Nickname)
		if err != nil {
			failedCount++
			failedDomains = append(failedDomains, fmt.Sprintf("%s (插入失败)", item.Domain))
			continue
		}

		successCount++
	}

	message := fmt.Sprintf("导入完成：共 %d 个，成功 %d 个，跳过 %d 个，失败 %d 个",
		len(domains), successCount, skippedCount, failedCount)

	fmt.Printf("✅ %s\n", message)

	return ImportDomainsResult{
		Success:       successCount > 0,
		Message:       message,
		Total:         len(domains),
		SuccessCount:  successCount,
		SkippedCount:  skippedCount,
		FailedCount:   failedCount,
		FailedDomains: failedDomains,
	}
}
