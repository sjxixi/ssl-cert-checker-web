import './style.css';
import './app.css';
import './features.css'; // 引入新功能样式
import './features.js'; // 引入新功能模块

import {CheckCertificate, BatchCheckCertificates, GetHistory, ClearHistory, AddWatchedDomain, GetWatchedDomains, RemoveWatchedDomain, UpdateWatchedDomainNickname, RefreshWatchedDomain, UpdateNotifySettings, UpdateManualCertInfo, DisableManualMode, CheckNotifications, RefreshAllWatchedDomains, ImportDomainsFromText} from '../wailsjs/go/main/App';

// 渲染HTML结构
document.querySelector('#app').innerHTML = `
    <div class="app-layout">
        <!-- 左侧边栏 -->
        <aside class="sidebar">
            <div class="sidebar-header">
                <div class="sidebar-logo" onclick="goToHome()" title="点击返回首页">
                    <div class="logo-icon">🔒</div>
                    <div class="logo-text">
                        <div class="logo-title">SSL证书</div>
                        <div class="logo-subtitle">查询工具</div>
                    </div>
                </div>
            </div>
            
            <nav class="sidebar-nav">
                <button class="nav-item active" data-tab="single">
                    <span class="nav-icon">🔍</span>
                    <span class="nav-label">单个查询</span>
                </button>
                <button class="nav-item" data-tab="batch">
                    <span class="nav-icon">📝</span>
                    <span class="nav-label">批量查询</span>
                </button>
                <button class="nav-item" data-tab="watched">
                    <span class="nav-icon">⭐</span>
                    <span class="nav-label">关注域名</span>
                </button>
                <button class="nav-item" data-tab="history">
                    <span class="nav-icon">📊</span>
                    <span class="nav-label">历史记录</span>
                </button>
                <button class="nav-item" data-tab="charts">
                    <span class="nav-icon">📈</span>
                    <span class="nav-label">数据图表</span>
                </button>
                <button class="nav-item" data-tab="settings">
                    <span class="nav-icon">⚙️</span>
                    <span class="nav-label">系统设置</span>
                </button>
            </nav>
            
            <div class="sidebar-footer">
                <div class="footer-info">
                    <span class="footer-icon">💡</span>
                    <span class="footer-text">实时监控证书状态</span>
                </div>
            </div>
        </aside>
        
        <!-- 右侧主内容区 -->
        <main class="main-content">
            <div class="container">
        <!-- 头部区域 -->
        <header class="header">
            <div class="header-icon">🔒</div>
            <h1 class="header-title">SSL 证书有效期查询工具</h1>
            <p class="header-subtitle">快速检测SSL/TLS证书到期时间</p>
        </header>

        <!-- 单个查询面板 -->
        <div class="tab-panel active" id="singlePanel">
            <div class="input-section">
                <label class="input-label">域名地址</label>
                <div class="input-group">
                    <input 
                        type="text" 
                        id="domainInput" 
                        class="domain-input" 
                        placeholder="例如: www.baidu.com 或 github.com"
                        autocomplete="off"
                    />
                    <button id="queryBtn" class="query-btn" onclick="checkCert()">
                        <span id="btnIcon" class="btn-icon">🔍</span>
                        <span id="btnText">查询</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- 批量查询面板 -->
        <div class="tab-panel" id="batchPanel">
            <div class="input-section">
                <label class="input-label">域名列表（每行一个）</label>
                <textarea 
                    id="batchInput" 
                    class="batch-input" 
                    placeholder="请输入域名，每行一个：\nwww.baidu.com\ngithub.com\nwww.google.com"
                    rows="8"
                ></textarea>
                <button id="batchQueryBtn" class="query-btn full-width" onclick="batchCheckCerts()">
                    <span class="btn-icon">🚀</span>
                    <span id="batchBtnText">开始批量查询</span>
                </button>
            </div>
        </div>

        <!-- 历史记录面板 -->
        <div class="tab-panel" id="historyPanel">
            <div class="input-section">
                <div class="history-header">
                    <h3 class="history-title">📊 查询历史</h3>
                    <div class="history-actions">
                        <button class="btn-secondary" onclick="loadHistory()">
                            <span>🔄</span> 刷新
                        </button>
                        <button class="btn-danger" onclick="clearHistoryConfirm()">
                            <span>🗑️</span> 清空
                        </button>
                    </div>
                </div>
                <div id="historyContent" class="history-content">
                    <p class="empty-hint">正在加载...</p>
                </div>
            </div>
        </div>

        <!-- 关注域名面板 -->
        <div class="tab-panel" id="watchedPanel">
            <div class="input-section">
                <div class="watched-header">
                    <h3 class="watched-title">⭐ 我的关注</h3>
                    <div class="watched-actions">
                        <button class="btn-secondary" onclick="loadWatchedDomains()">
                            <span>🔄</span> 刷新全部
                        </button>
                        <button class="btn-secondary" onclick="showAutoRefreshSettings()">
                            <span>⏰</span> 自动刷新
                        </button>
                        <button class="btn-secondary" onclick="showBatchImportDialog()">
                            <span>📥</span> 批量导入
                        </button>
                        <button class="btn-primary" onclick="showAddWatchDialog()">
                            <span>➕</span> 添加关注
                        </button>
                    </div>
                </div>
                
                <!-- 批量操作栏 -->
                <div class="batch-operation-bar" id="batchOperationBar" style="display: none;">
                    <div class="batch-info">
                        <label class="checkbox-container">
                            <input type="checkbox" id="selectAllCheckbox" onchange="toggleSelectAll()">
                            <span class="checkbox-label">全选</span>
                        </label>
                        <span class="selected-count" id="selectedCount">已选择 0 个</span>
                    </div>
                    <div class="batch-actions">
                        <button class="batch-btn batch-btn-refresh" onclick="batchRefresh()">
                            <span>🔄</span> 批量刷新
                        </button>
                        <button class="batch-btn batch-btn-export" onclick="batchExport()">
                            <span>💾</span> 批量导出
                        </button>
                        <button class="batch-btn batch-btn-delete" onclick="batchDelete()">
                            <span>🗑️</span> 批量删除
                        </button>
                        <button class="batch-btn batch-btn-cancel" onclick="cancelBatchMode()">
                            <span>❌</span> 取消
                        </button>
                    </div>
                </div>
                
                <!-- 快捷操作和筛选控制栏（合并） -->
                <div class="control-bar-container">
                    <!-- 左侧：快捷操作按钮 -->
                    <div class="quick-actions-section">
                        <button class="quick-action-btn" onclick="enterBatchMode()">
                            <span>☑️</span> 批量管理
                        </button>
                        <button class="quick-action-btn" onclick="exportAllDomains()">
                            <span>📊</span> 导出全部
                        </button>
                    </div>
                    
                    <!-- 右侧：筛选和排序控制 -->
                    <div class="filter-section">
                        <div class="filter-item">
                            <label class="filter-label">🔍 搜索</label>
                            <input type="text" id="domainSearchInput" class="filter-input" placeholder="输入域名关键词..." />
                        </div>
                        <div class="filter-item">
                            <label class="filter-label">📊 排序</label>
                            <select id="sortSelect" class="filter-select">
                                <option value="days-asc">剩余天数 ↑</option>
                                <option value="days-desc">剩余天数 ↓</option>
                                <option value="status">安全状态</option>
                                <option value="domain">域名字母</option>
                            </select>
                        </div>
                        <button class="filter-reset-btn" onclick="resetFilters()">
                            <span>🔄</span> 重置
                        </button>
                    </div>
                </div>
                
                <div id="watchedContent" class="watched-content">
                    <p class="empty-hint">正在加载...</p>
                </div>
            </div>
        </div>

        <!-- 数据图表面板 -->
        <div class="tab-panel" id="chartsPanel">
            <div class="input-section">
                <div class="charts-header">
                    <h3 class="charts-title">📈 数据统计</h3>
                    <button class="btn-secondary" onclick="loadCharts()">
                        <span>🔄</span> 刷新
                    </button>
                </div>
                <div id="chartsContent" class="charts-content">
                    <p class="empty-hint">正在加载数据...</p>
                </div>
            </div>
        </div>

        <!-- 系统设置面板 -->
        <div class="tab-panel" id="settingsPanel">
            <div class="input-section">
                <div class="settings-header">
                    <h3 class="settings-title">⚙️ 系统设置</h3>
                </div>
                <div id="settingsContent" class="settings-content">
                    <p class="empty-hint">正在加载...</p>
                </div>
            </div>
        </div>

        <!-- 结果区域 -->
        <div class="result-card" id="resultCard" style="display: none;">
            <div class="result-header">
                <span class="result-icon">📊</span>
                <span class="result-title">查询结果</span>
            </div>
            <div id="resultContent" class="result-content"></div>
        </div>

        <!-- 加载动画 -->
        <div class="loading" id="loading" style="display: none;">
            <div class="spinner"></div>
            <p id="loadingText">正在查询证书信息...</p>
        </div>
            </div>
        </main>
    </div>
`;

const domainInput = document.getElementById('domainInput');
const queryBtn = document.getElementById('queryBtn');
const resultCard = document.getElementById('resultCard');
const resultContent = document.getElementById('resultContent');
const loading = document.getElementById('loading');
const loadingText = document.getElementById('loadingText');
const btnIcon = document.getElementById('btnIcon');
const btnText = document.getElementById('btnText');
const batchInput = document.getElementById('batchInput');
const batchQueryBtn = document.getElementById('batchQueryBtn');

// 返回首页功能
window.goToHome = function() {
    // 切换到单个查询面板
    const singleTabBtn = document.querySelector('[data-tab="single"]');
    if (singleTabBtn) {
        singleTabBtn.click();
    }
    
    // 隐藏结果卡片
    resultCard.style.display = 'none';
    
    // 清空输入框
    domainInput.value = '';
    
    // 聚焦输入框
    domainInput.focus();
    
    // 显示提示
    showToast('🏠 已返回首页');
};

// 导航切换功能
const navItems = document.querySelectorAll('.nav-item');
const tabPanels = document.querySelectorAll('.tab-panel');

navItems.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        // 切换按钮状态
        navItems.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // 切换面板
        tabPanels.forEach(panel => panel.classList.remove('active'));
        document.getElementById(tabName + 'Panel').classList.add('active');
        
        // 隐藏结果
        resultCard.style.display = 'none';
        
        // 如果切换到历史记录，加载数据
        if (tabName === 'history') {
            loadHistory();
        }
        // 如果切换到关注域名，加载数据
        if (tabName === 'watched') {
            loadWatchedDomains();
        }
        // 如果切换到数据图表，加载图表
        if (tabName === 'charts') {
            loadCharts();
        }
        // 如果切换到系统设置，加载设置
        if (tabName === 'settings') {
            loadSettings();
        }
    });
});

// 自动聚焦输入框
domainInput.focus();

// Enter键查询
domainInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        checkCert();
    }
});

// 检查证书函数
window.checkCert = async function() {
    const domain = domainInput.value.trim();
    
    if (!domain) {
        showError('请输入有效的域名');
        return;
    }

    // 显示加载状态
    setLoading(true);
    resultCard.style.display = 'none';

    try {
        const result = await CheckCertificate(domain);
        
        if (result.success) {
            showSuccess(result.data);
        } else {
            showError(result.error || result.message);
        }
    } catch (err) {
        showError('查询失败：' + err.message);
        console.error(err);
    } finally {
        setLoading(false);
    }
};

// 设置加载状态
function setLoading(isLoading, text = '正在查询证书信息...') {
    loading.style.display = isLoading ? 'flex' : 'none';
    loadingText.textContent = text;
    queryBtn.disabled = isLoading;
    if (batchQueryBtn) batchQueryBtn.disabled = isLoading;
    
    if (isLoading) {
        btnIcon.textContent = '⏳';
        btnText.textContent = '查询中...';
        queryBtn.classList.add('loading');
    } else {
        btnIcon.textContent = '🔍';
        btnText.textContent = '查询';
        queryBtn.classList.remove('loading');
    }
}

// 显示成功结果
function showSuccess(data) {
    const statusClass = `status-${data.status}`;
    const statusText = {
        'safe': '安全',
        'warning': '即将过期',
        'danger': '即将过期',
        'expired': '已过期'
    };

    const statusIcon = {
        'safe': '✅',
        'warning': '⚠️',
        'danger': '⚠️',
        'expired': '❌'
    };

    resultContent.innerHTML = `
        <div class="cert-info ${statusClass}">
            <div class="status-badge ${statusClass}">
                <span class="status-icon">${statusIcon[data.status]}</span>
                <span class="status-text">${statusText[data.status]}</span>
            </div>
            
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">域名</div>
                    <div class="info-value domain-value">${data.domain}</div>
                </div>
                
                <div class="info-item highlight">
                    <div class="info-label">剩余天数</div>
                    <div class="info-value days-value ${statusClass}">
                        ${data.daysRemaining} 天
                    </div>
                </div>
                
                <div class="info-item">
                    <div class="info-label">颁发者</div>
                    <div class="info-value">${data.issuer || 'N/A'}</div>
                </div>
                
                <div class="info-item">
                    <div class="info-label">主体</div>
                    <div class="info-value">${data.subject || 'N/A'}</div>
                </div>
                
                <div class="info-item">
                    <div class="info-label">生效时间</div>
                    <div class="info-value">${data.notBefore}</div>
                </div>
                
                <div class="info-item">
                    <div class="info-label">过期时间</div>
                    <div class="info-value expiry-value">${data.notAfter}</div>
                </div>
                
                <div class="info-item">
                    <div class="info-label">序列号</div>
                    <div class="info-value serial-value">${data.serialNumber}</div>
                </div>
                
                <div class="info-item">
                    <div class="info-label">版本</div>
                    <div class="info-value">v${data.version}</div>
                </div>
            </div>
            
            ${data.sanDomains && data.sanDomains.length > 0 ? `
                <div class="san-section">
                    <div class="san-header">
                        <span class="san-icon">🌐</span>
                        <span class="san-title">SAN域名列表（该证书支持的所有域名）</span>
                        <span class="san-count">共 ${data.sanDomains.length} 个</span>
                    </div>
                    <div class="san-list">
                        ${data.sanDomains.map(domain => `
                            <span class="san-item">${domain}</span>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
    
    resultCard.style.display = 'block';
    resultCard.classList.add('fade-in');
}

// 显示错误信息
function showError(message) {
    resultContent.innerHTML = `
        <div class="error-message">
            <div class="error-icon">❌</div>
            <div class="error-text">${message}</div>
        </div>
    `;
    
    resultCard.style.display = 'block';
    resultCard.classList.add('fade-in');
}

// 批量查询证书
window.batchCheckCerts = async function() {
    const domains = batchInput.value.trim();
    
    if (!domains) {
        showError('请输入域名列表');
        return;
    }

    setLoading(true, '正在批量查询证书...');
    resultCard.style.display = 'none';

    try {
        const result = await BatchCheckCertificates(domains);
        
        if (result.success) {
            showBatchResults(result);
        } else {
            showError(result.message || '批量查询失败');
        }
    } catch (err) {
        showError('查询失败：' + err.message);
        console.error(err);
    } finally {
        setLoading(false);
    }
};

// 显示批量查询结果
function showBatchResults(result) {
    const { total, results, errors } = result;
    
    let html = `
        <div class="batch-summary">
            <div class="summary-item">
                <span class="summary-label">总计</span>
                <span class="summary-value">${total}</span>
            </div>
            <div class="summary-item success">
                <span class="summary-label">成功</span>
                <span class="summary-value">${results.length}</span>
            </div>
            <div class="summary-item error">
                <span class="summary-label">失败</span>
                <span class="summary-value">${errors ? errors.length : 0}</span>
            </div>
        </div>
    `;
    
    if (results.length > 0) {
        html += '<div class="batch-results">';
        results.forEach((cert, index) => {
            const statusClass = `status-${cert.status}`;
            const statusText = {
                'safe': '安全',
                'warning': '即将过期',
                'danger': '即将过期',
                'expired': '已过期'
            };
            const statusIcon = {
                'safe': '✅',
                'warning': '⚠️',
                'danger': '⚠️',
                'expired': '❌'
            };
            
            html += `
                <div class="batch-item ${statusClass}">
                    <div class="batch-item-header">
                        <span class="batch-domain">${cert.domain}</span>
                        <span class="batch-status ${statusClass}">
                            ${statusIcon[cert.status]} ${statusText[cert.status]}
                        </span>
                    </div>
                    <div class="batch-item-info">
                        <span>📅 过期时间：${cert.notAfter}</span>
                        <span class="days-badge ${statusClass}">⭐ 剩余 ${cert.daysRemaining} 天</span>
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }
    
    if (errors && errors.length > 0) {
        html += '<div class="batch-errors">';
        html += '<h4 class="error-title">⚠️ 查询失败的域名</h4>';
        errors.forEach(error => {
            html += `<div class="error-item">${error}</div>`;
        });
        html += '</div>';
    }
    
    resultContent.innerHTML = html;
    resultCard.style.display = 'block';
    resultCard.classList.add('fade-in');
}

// 加载历史记录
window.loadHistory = async function() {
    const historyContent = document.getElementById('historyContent');
    historyContent.innerHTML = '<p class="empty-hint">正在加载...</p>';
    
    try {
        const result = await GetHistory(100);
        
        if (result.success && result.records && result.records.length > 0) {
            let html = '<div class="history-list">';
            result.records.forEach(cert => {
                const statusClass = `status-${cert.status}`;
                const statusText = {
                    'safe': '安全',
                    'warning': '即将过期',
                    'danger': '即将过期',
                    'expired': '已过期'
                };
                
                html += `
                    <div class="history-item">
                        <div class="history-item-header">
                            <span class="history-domain">${cert.domain}</span>
                            <span class="history-status ${statusClass}">${statusText[cert.status]}</span>
                        </div>
                        <div class="history-item-details">
                            <span>📅 查询时间：${cert.queryTime || '未知'}</span>
                            <span>⏰ 过期时间：${cert.notAfter}</span>
                            <span class="days-info ${statusClass}">⭐ 剩余 ${cert.daysRemaining} 天</span>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            historyContent.innerHTML = html;
        } else {
            historyContent.innerHTML = '<p class="empty-hint">📂 暂无查询历史</p>';
        }
    } catch (err) {
        historyContent.innerHTML = `<p class="error-hint">❌ 加载失败：${err.message}</p>`;
        console.error(err);
    }
};

// 清空历史记录确认
window.clearHistoryConfirm = function() {
    if (confirm('确定要清空所有历史记录吗？此操作不可恢复！')) {
        clearHistoryData();
    }
};

// 清空历史数据
async function clearHistoryData() {
    try {
        await ClearHistory();
        alert('✅ 历史记录已清空');
        loadHistory();
    } catch (err) {
        alert('❌ 清空失败：' + err.message);
        console.error(err);
    }
}

// ==================== 关注域名功能 ====================

// 全局变量存储当前的关注域名数据
let currentWatchedDomains = [];

// 批量管理状态
let batchMode = false;
let selectedDomainIds = new Set();

// 加载关注域名列表
window.loadWatchedDomains = async function() {
    const watchedContent = document.getElementById('watchedContent');
    watchedContent.innerHTML = '<p class="empty-hint">正在加载并查询最新证书信息...</p>';
    
    try {
        const result = await GetWatchedDomains();
        
        if (result.success && result.domains && result.domains.length > 0) {
            currentWatchedDomains = result.domains;
            renderWatchedDomains(currentWatchedDomains);
        } else {
            watchedContent.innerHTML = '<p class="empty-hint">📌 还没有关注任何域名<br><small>点击右上角“添加关注”按钮添加域名</small></p>';
        }
    } catch (err) {
        watchedContent.innerHTML = `<p class="error-hint">❌ 加载失败：${err.message}</p>`;
        console.error(err);
    }
};

// 渲染关注域名列表
function renderWatchedDomains(domains) {
    const watchedContent = document.getElementById('watchedContent');
    
    // 统计信息
    const stats = {
        total: domains.length,
        safe: 0,
        warning: 0,
        danger: 0,
        expired: 0
    };
    
    domains.forEach(d => {
        if (d.certInfo) {
            stats[d.certInfo.status] = (stats[d.certInfo.status] || 0) + 1;
        }
    });
    
    // 添加统计栏
    let html = `
        <div class="watched-stats">
            <div class="stat-item stat-total">
                <span class="stat-icon">📊</span>
                <span class="stat-label">总计</span>
                <span class="stat-value">${stats.total}</span>
            </div>
            <div class="stat-item stat-safe">
                <span class="stat-icon">✅</span>
                <span class="stat-label">安全</span>
                <span class="stat-value">${stats.safe}</span>
            </div>
            <div class="stat-item stat-warning">
                <span class="stat-icon">⚠️</span>
                <span class="stat-label">警告</span>
                <span class="stat-value">${stats.warning}</span>
            </div>
            <div class="stat-item stat-danger">
                <span class="stat-icon">🔴</span>
                <span class="stat-label">危险</span>
                <span class="stat-value">${stats.danger}</span>
            </div>
            <div class="stat-item stat-expired">
                <span class="stat-icon">❌</span>
                <span class="stat-label">过期</span>
                <span class="stat-value">${stats.expired}</span>
            </div>
        </div>
        <div class="watched-list">
    `;
    
    domains.forEach(watched => {
        const cert = watched.certInfo;
        if (cert) {
            const statusClass = `status-${cert.status}`;
            const statusText = {
                'safe': '安全',
                'warning': '即将过期',
                'danger': '即将过期',
                'expired': '已过期'
            };
            const statusIcon = {
                'safe': '✅',
                'warning': '⚠️',
                'danger': '⚠️',
                'expired': '❌'
            };
            
            // 计算证书总有效期和进度条百分比
            const notBefore = new Date(cert.notBefore);
            const notAfter = new Date(cert.notAfter);
            const now = new Date();
            
            // 总有效期（天数）
            const totalDays = Math.ceil((notAfter - notBefore) / (1000 * 60 * 60 * 24));
            
            // 已经经过的天数
            const elapsedDays = Math.ceil((now - notBefore) / (1000 * 60 * 60 * 24));
            
            // 进度条百分比（代表剩余比例）
            let progressPercent;
            if (cert.daysRemaining <= 0) {
                // 已过期，进度条为0%
                progressPercent = 0;
            } else if (totalDays > 0) {
                // 正常情况：剩余天数/总天数
                progressPercent = Math.max(0, Math.min(100, (cert.daysRemaining / totalDays) * 100));
            } else {
                // 异常情况
                progressPercent = 0;
            }
            
            // 格式化显示文字
            let progressText;
            if (cert.daysRemaining <= 0) {
                progressText = `已过期 ${Math.abs(cert.daysRemaining)} 天`;
            } else {
                progressText = `剩余 ${cert.daysRemaining} 天 / 总计 ${totalDays} 天`;
            }
            
            html += `
                <div class="watched-item ${statusClass}" data-domain="${watched.domain}" data-id="${watched.id}">
                    <!-- 批量选择复选框 -->
                    <div class="batch-checkbox" style="display: ${batchMode ? 'block' : 'none'};">
                        <input type="checkbox" class="domain-checkbox" data-id="${watched.id}" onchange="toggleDomainSelection(${watched.id})">
                    </div>
                    
                    <div class="watched-item-header">
                        <div class="watched-domain-info">
                            <span class="watched-domain">${watched.domain}</span>
                            ${watched.nickname ? `<span class="watched-nickname">${watched.nickname}</span>` : ''}
                        </div>
                        <div class="watched-actions-inline">
                            <button class="btn-icon btn-detect" onclick="quickCheckDomain('${watched.domain}')" title="立即检测">
                                <span>🔍</span>
                            </button>
                            <button class="btn-icon ${watched.notifyEnabled ? 'btn-notify-active' : ''}" onclick="showNotifySettings(${watched.id}, '${watched.domain}', ${watched.notifyEnabled}, ${watched.notifyThreshold})" title="通知设置">
                                <span>🔔</span>
                            </button>
                            <button class="btn-icon ${watched.isManual ? 'btn-manual-active' : ''}" onclick="showManualCertEdit(${watched.id}, '${watched.domain}', ${watched.isManual}, '${watched.manualExpireDate || ''}')" title="${watched.isManual ? '手动模式' : '手动录入'}">
                                <span>✍️</span>
                            </button>
                            <button class="btn-icon btn-detail" onclick="toggleDetails('${watched.domain}')" title="查看详情" data-domain="${watched.domain}">
                                <span class="detail-icon">🔽</span>
                            </button>
                            <button class="btn-icon" onclick="editWatchedNickname(${watched.id}, '${watched.domain}', '${watched.nickname || ''}')" title="编辑备注">
                                <span>✏️</span>
                            </button>
                            <button class="btn-icon btn-icon-danger" onclick="removeWatchedConfirm(${watched.id}, '${watched.domain}')" title="移除关注">
                                <span>🗑️</span>
                            </button>
                        </div>
                    </div>
                    
                    <div class="watched-cert-status">
                        <span class="watched-status ${statusClass}">
                            ${statusIcon[cert.status]} ${statusText[cert.status]}
                        </span>
                        <span class="watched-days ${statusClass}">⭐ 剩余 ${cert.daysRemaining} 天</span>
                    </div>
                    
                    <!-- 进度条 -->
                    <div class="progress-container">
                        <div class="progress-bar ${statusClass}" style="width: ${progressPercent}%"></div>
                        <div class="progress-text">${progressText}</div>
                    </div>
                    
                    <div class="watched-cert-details">
                        <div class="watched-detail-item">
                            <span class="detail-label">📅 过期时间</span>
                            <span class="detail-value">${cert.notAfter}</span>
                        </div>
                        <div class="watched-detail-item">
                            <span class="detail-label">⏰ 最后检查</span>
                            <span class="detail-value">${watched.lastCheckTime || '未检查'}</span>
                        </div>
                    </div>
                    
                    <!-- 详细信息卡片（默认隐藏） -->
                    <div class="cert-detail-card" id="detail-${watched.domain}" style="display: none;">
                        <div class="detail-card-header">
                            <span class="detail-card-title">📜 证书详细信息</span>
                        </div>
                        <div class="detail-card-content">
                            <div class="detail-row">
                                <span class="detail-row-label">颁发者 (Issuer)</span>
                                <span class="detail-row-value">${cert.issuer || 'N/A'}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-row-label">主体 (Subject)</span>
                                <span class="detail-row-value">${cert.subject || 'N/A'}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-row-label">生效时间</span>
                                <span class="detail-row-value">${cert.notBefore}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-row-label">过期时间</span>
                                <span class="detail-row-value">${cert.notAfter}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-row-label">序列号</span>
                                <span class="detail-row-value cert-serial">${cert.serialNumber}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-row-label">版本</span>
                                <span class="detail-row-value">v${cert.version}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-row-label">状态</span>
                                <span class="detail-row-value ${statusClass}">${cert.isValid ? '有效' : '无效'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="watched-item error" data-domain="${watched.domain}" data-id="${watched.id}">
                    <!-- 批量选择复选框 -->
                    <div class="batch-checkbox" style="display: ${batchMode ? 'block' : 'none'};">
                        <input type="checkbox" class="domain-checkbox" data-id="${watched.id}" onchange="toggleDomainSelection(${watched.id})">
                    </div>
                    
                    <div class="watched-item-header">
                        <div class="watched-domain-info">
                            <span class="watched-domain">${watched.domain}</span>
                            ${watched.nickname ? `<span class="watched-nickname">${watched.nickname}</span>` : ''}
                        </div>
                        <div class="watched-actions-inline">
                            <button class="btn-icon btn-detect" onclick="quickCheckDomain('${watched.domain}')" title="立即检测">
                                <span>🔍</span>
                            </button>
                            <button class="btn-icon ${watched.isManual ? 'btn-manual-active' : ''}" onclick="showManualCertEdit(${watched.id}, '${watched.domain}', ${watched.isManual}, '${watched.manualExpireDate || ''}')" title="${watched.isManual ? '手动模式' : '手动录入'}">
                                <span>✍️</span>
                            </button>
                            <button class="btn-icon btn-icon-danger" onclick="removeWatchedConfirm(${watched.id}, '${watched.domain}')" title="移除关注">
                                <span>🗑️</span>
                            </button>
                        </div>
                    </div>
                    <div class="watched-error">
                        <span>❌ 无法获取证书信息</span>
                    </div>
                </div>
            `;
        }
    });
    
    html += '</div>';
    
    // 如果没有域名，显示空状态
    if (domains.length === 0) {
        watchedContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📌</div>
                <div class="empty-title">还没有关注任何域名</div>
                <div class="empty-description">点击右上角“➕ 添加关注”按钮开始监控域名证书</div>
                <button class="btn-primary" onclick="showAddWatchDialog()" style="margin-top: 16px;">
                    <span>➕</span> 立即添加
                </button>
            </div>
        `;
    } else {
        watchedContent.innerHTML = html;
    }
    
    // 绑定筛选事件
    bindFilterEvents();
}

// 显示添加关注对话框
window.showAddWatchDialog = function() {
    showCustomDialog(
        '添加关注域名',
        [
            {
                type: 'text',
                id: 'dialogDomain',
                label: '域名',
                placeholder: '例如：www.baidu.com',
                required: true
            },
            {
                type: 'text',
                id: 'dialogNickname',
                label: '备注名称（可选）',
                placeholder: '输入备注信息',
                required: false
            }
        ],
        (values) => {
            const domain = values.dialogDomain.trim();
            const nickname = values.dialogNickname ? values.dialogNickname.trim() : '';
            addWatchedDomain(domain, nickname);
        }
    );
};

// 添加关注域名
async function addWatchedDomain(domain, nickname) {
    try {
        const result = await AddWatchedDomain(domain, nickname);
        
        if (result.success) {
            alert('✅ 添加关注成功！');
            loadWatchedDomains();
        } else {
            alert('❌ ' + (result.error || result.message));
        }
    } catch (err) {
        alert('❌ 添加失败：' + err.message);
        console.error(err);
    }
}

// 移除关注确认
window.removeWatchedConfirm = function(id, domain) {
    if (confirm(`确定要移除关注的域名 "${domain}" 吗？`)) {
        removeWatchedDomain(id);
    }
};

// 移除关注域名
async function removeWatchedDomain(id) {
    try {
        await RemoveWatchedDomain(id);
        alert('✅ 已移除关注');
        loadWatchedDomains();
    } catch (err) {
        alert('❌ 移除失败：' + err.message);
        console.error(err);
    }
}

// 编辑备注
window.editWatchedNickname = function(id, domain, currentNickname) {
    showCustomDialog(
        '编辑备注',
        [
            {
                type: 'text',
                id: 'dialogNickname',
                label: `域名: ${domain}`,
                placeholder: '输入备注信息',
                value: currentNickname,
                required: false
            }
        ],
        (values) => {
            const nickname = values.dialogNickname ? values.dialogNickname.trim() : '';
            updateNickname(id, nickname);
        }
    );
};

// 更新备注
async function updateNickname(id, nickname) {
    try {
        await UpdateWatchedDomainNickname(id, nickname);
        alert('✅ 备注已更新');
        loadWatchedDomains();
    } catch (err) {
        alert('❌ 更新失败：' + err.message);
        console.error(err);
    }
}

// 刷新单个关注域名
window.refreshSingleWatched = async function(domain) {
    try {
        const result = await RefreshWatchedDomain(domain);
        if (result.success) {
            alert(`✅ "${domain}" 证书信息已刷新`);
            loadWatchedDomains();
        } else {
            alert('❌ ' + (result.error || result.message));
        }
    } catch (err) {
        alert('❌ 刷新失败：' + err.message);
        console.error(err);
    }
};

// ==================== 新增功能 ====================

// 快速检测单个域名
window.quickCheckDomain = async function(domain) {
    try {
        // 显示加载状态
        const domainItem = document.querySelector(`.watched-item[data-domain="${domain}"]`);
        if (domainItem) {
            const originalContent = domainItem.innerHTML;
            domainItem.innerHTML = '<div class="checking-status"><div class="spinner-small"></div><p>正在检测中...</p></div>';
            
            const result = await RefreshWatchedDomain(domain);
            
            if (result.success) {
                // 重新加载列表
                await loadWatchedDomains();
            } else {
                domainItem.innerHTML = originalContent;
                alert('❌ 检测失败：' + (result.error || result.message));
            }
        }
    } catch (err) {
        alert('❌ 检测失败：' + err.message);
        console.error(err);
    }
};

// 切换详情卡片显示/隐藏
window.toggleDetails = function(domain) {
    const detailCard = document.getElementById(`detail-${domain}`);
    const button = document.querySelector(`.btn-detail[data-domain="${domain}"]`);
    const icon = button ? button.querySelector('.detail-icon') : null;
    
    if (detailCard) {
        if (detailCard.style.display === 'none' || !detailCard.style.display) {
            // 展开
            detailCard.style.display = 'block';
            detailCard.classList.add('slide-down');
            if (icon) icon.textContent = '🔼'; // 改为向上箭头
            if (button) button.title = '收起详情';
        } else {
            // 收起
            detailCard.style.display = 'none';
            if (icon) icon.textContent = '🔽'; // 改为向下箭头
            if (button) button.title = '查看详情';
        }
    }
};

// 绑定筛选事件
function bindFilterEvents() {
    const searchInput = document.getElementById('domainSearchInput');
    const sortSelect = document.getElementById('sortSelect');
    
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }
    
    if (sortSelect) {
        sortSelect.addEventListener('change', applyFilters);
    }
}

// 应用筛选和排序
function applyFilters() {
    const searchInput = document.getElementById('domainSearchInput');
    const sortSelect = document.getElementById('sortSelect');
    
    if (!searchInput || !sortSelect) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const sortType = sortSelect.value;
    
    // 筛选
    let filteredDomains = currentWatchedDomains.filter(watched => {
        if (!searchTerm) return true;
        return watched.domain.toLowerCase().includes(searchTerm) || 
               (watched.nickname && watched.nickname.toLowerCase().includes(searchTerm));
    });
    
    // 排序
    filteredDomains.sort((a, b) => {
        switch(sortType) {
            case 'days-asc':
                return (a.certInfo?.daysRemaining || 0) - (b.certInfo?.daysRemaining || 0);
            case 'days-desc':
                return (b.certInfo?.daysRemaining || 0) - (a.certInfo?.daysRemaining || 0);
            case 'status':
                const statusOrder = {'expired': 0, 'danger': 1, 'warning': 2, 'safe': 3};
                return (statusOrder[a.certInfo?.status] || 4) - (statusOrder[b.certInfo?.status] || 4);
            case 'domain':
                return a.domain.localeCompare(b.domain);
            default:
                return 0;
        }
    });
    
    renderWatchedDomains(filteredDomains);
}

// 重置筛选
window.resetFilters = function() {
    const searchInput = document.getElementById('domainSearchInput');
    const sortSelect = document.getElementById('sortSelect');
    
    if (searchInput) searchInput.value = '';
    if (sortSelect) sortSelect.value = 'days-asc';
    
    renderWatchedDomains(currentWatchedDomains);
};

// ==================== 自定义对话框 ====================

/**
 * 显示自定义对话框
 * @param {string} title - 对话框标题
 * @param {Array} fields - 输入字段数组
 * @param {Function} onConfirm - 确认回调函数
 */
function showCustomDialog(title, fields, onConfirm, extraHtml = '') {
    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    
    // 创建对话框
    const dialog = document.createElement('div');
    dialog.className = 'custom-dialog';
    
    // 对话框标题
    const dialogTitle = document.createElement('div');
    dialogTitle.className = 'dialog-title';
    dialogTitle.textContent = title;
    dialog.appendChild(dialogTitle);
    
    // 对话框内容
    const dialogContent = document.createElement('div');
    dialogContent.className = 'dialog-content';
    
    // 创建输入字段
    fields.forEach(field => {
        const fieldGroup = document.createElement('div');
        fieldGroup.className = 'dialog-field-group';
        
        const label = document.createElement('label');
        label.className = 'dialog-label';
        label.textContent = field.label;
        if (field.required) {
            const required = document.createElement('span');
            required.className = 'required-mark';
            required.textContent = ' *';
            label.appendChild(required);
        }
        fieldGroup.appendChild(label);
        
        // 根据类型创建不同的输入元素
        if (field.type === 'checkbox') {
            const checkboxContainer = document.createElement('div');
            checkboxContainer.className = 'dialog-checkbox-container';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = field.id;
            checkbox.className = 'dialog-checkbox';
            checkbox.checked = field.value || false;
            checkboxContainer.appendChild(checkbox);
            
            const checkboxLabel = document.createElement('label');
            checkboxLabel.htmlFor = field.id;
            checkboxLabel.textContent = field.checkboxLabel || '启用';
            checkboxLabel.style.marginLeft = '8px';
            checkboxLabel.style.cursor = 'pointer';
            checkboxContainer.appendChild(checkboxLabel);
            
            fieldGroup.appendChild(checkboxContainer);
        } else {
            const input = document.createElement('input');
            input.type = field.type || 'text';
            input.id = field.id;
            input.className = 'dialog-input';
            input.placeholder = field.placeholder || '';
            if (field.value !== undefined) input.value = field.value;
            if (field.required) input.required = true;
            if (field.readOnly) input.readOnly = true;
            if (field.min !== undefined) input.min = field.min;
            if (field.max !== undefined) input.max = field.max;
            fieldGroup.appendChild(input);
        }
        
        // 错误提示
        const errorMsg = document.createElement('div');
        errorMsg.className = 'dialog-error-msg';
        errorMsg.id = `error-${field.id}`;
        fieldGroup.appendChild(errorMsg);
        
        dialogContent.appendChild(fieldGroup);
    });
    
    // 添加额外HTML内容
    if (extraHtml) {
        const extraDiv = document.createElement('div');
        extraDiv.innerHTML = extraHtml;
        dialogContent.appendChild(extraDiv);
    }
    
    dialog.appendChild(dialogContent);
    
    // 对话框按钮
    const dialogButtons = document.createElement('div');
    dialogButtons.className = 'dialog-buttons';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'dialog-btn dialog-btn-cancel';
    cancelBtn.textContent = '取消';
    cancelBtn.onclick = () => {
        closeDialog();
    };
    dialogButtons.appendChild(cancelBtn);
    
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'dialog-btn dialog-btn-confirm';
    confirmBtn.textContent = '确定';
    confirmBtn.onclick = () => {
        // 验证输入
        let isValid = true;
        const values = {};
        
        fields.forEach(field => {
            const input = document.getElementById(field.id);
            const errorMsg = document.getElementById(`error-${field.id}`);
            
            // 清除之前的错误状态
            input.classList.remove('input-error');
            errorMsg.textContent = '';
            
            if (field.type === 'checkbox') {
                values[field.id] = input.checked;
            } else {
                const value = input.value.trim();
                
                if (field.required && !value) {
                    isValid = false;
                    input.classList.add('input-error');
                    errorMsg.textContent = '请输入' + field.label;
                }
                
                // 数字类型验证
                if (field.type === 'number' && value) {
                    const numValue = parseInt(value);
                    if (isNaN(numValue)) {
                        isValid = false;
                        input.classList.add('input-error');
                        errorMsg.textContent = '请输入有效数字';
                    } else if (field.min !== undefined && numValue < field.min) {
                        isValid = false;
                        input.classList.add('input-error');
                        errorMsg.textContent = `最小值为 ${field.min}`;
                    } else if (field.max !== undefined && numValue > field.max) {
                        isValid = false;
                        input.classList.add('input-error');
                        errorMsg.textContent = `最大值为 ${field.max}`;
                    }
                }
                
                values[field.id] = value;
            }
        });
        
        if (isValid) {
            closeDialog();
            onConfirm(values);
        }
    };
    dialogButtons.appendChild(confirmBtn);
    
    dialog.appendChild(dialogButtons);
    
    // 添加到页面
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    // 添加显示动画
    setTimeout(() => {
        overlay.classList.add('show');
    }, 10);
    
    // 第一个输入框自动获取焦点（除非是只读或复选框）
    setTimeout(() => {
        const firstEditableField = fields.find(f => !f.readOnly && f.type !== 'checkbox');
        if (firstEditableField) {
            const firstInput = document.getElementById(firstEditableField.id);
            if (firstInput) firstInput.focus();
        }
    }, 200);
    
    // 点击遮罩层关闭
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeDialog();
        }
    });
    
    // ESC键关闭
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeDialog();
        }
    };
    document.addEventListener('keydown', escHandler);
    
    // Enter键提交
    const enterHandler = (e) => {
        if (e.key === 'Enter' && e.target.type !== 'checkbox') {
            confirmBtn.click();
        }
    };
    dialog.addEventListener('keydown', enterHandler);
    
    // 关闭对话框
    function closeDialog() {
        overlay.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(overlay);
            document.removeEventListener('keydown', escHandler);
        }, 300);
    }
}

// ==================== 批量操作功能 ====================

// 进入批量管理模式
window.enterBatchMode = function() {
    batchMode = true;
    selectedDomainIds.clear();
    
    // 显示批量操作栏
    document.getElementById('batchOperationBar').style.display = 'flex';
    
    // 显示所有复选框并为域名项添加类
    document.querySelectorAll('.batch-checkbox').forEach(el => {
        el.style.display = 'block';
    });
    
    // 为所有域名项添加batch-mode-active类
    document.querySelectorAll('.watched-item').forEach(item => {
        item.classList.add('batch-mode-active');
    });
    
    // 更新已选择数量
    updateSelectedCount();
};

// 取消批量管理模式
window.cancelBatchMode = function() {
    batchMode = false;
    selectedDomainIds.clear();
    
    // 隐藏批量操作栏
    document.getElementById('batchOperationBar').style.display = 'none';
    
    // 隐藏所有复选框
    document.querySelectorAll('.batch-checkbox').forEach(el => {
        el.style.display = 'none';
    });
    
    // 移除所有域名项的batch-mode-active类
    document.querySelectorAll('.watched-item').forEach(item => {
        item.classList.remove('batch-mode-active');
    });
    
    // 取消所有选中状态
    document.querySelectorAll('.domain-checkbox').forEach(cb => {
        cb.checked = false;
    });
    document.getElementById('selectAllCheckbox').checked = false;
};

// 切换全选
window.toggleSelectAll = function() {
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const isChecked = selectAllCheckbox.checked;
    
    document.querySelectorAll('.domain-checkbox').forEach(cb => {
        cb.checked = isChecked;
        const id = parseInt(cb.dataset.id);
        if (isChecked) {
            selectedDomainIds.add(id);
        } else {
            selectedDomainIds.delete(id);
        }
    });
    
    updateSelectedCount();
};

// 切换单个域名选择
window.toggleDomainSelection = function(id) {
    if (selectedDomainIds.has(id)) {
        selectedDomainIds.delete(id);
    } else {
        selectedDomainIds.add(id);
    }
    
    updateSelectedCount();
    
    // 更新全选框状态
    const allCheckboxes = document.querySelectorAll('.domain-checkbox');
    const checkedCount = document.querySelectorAll('.domain-checkbox:checked').length;
    document.getElementById('selectAllCheckbox').checked = checkedCount === allCheckboxes.length && allCheckboxes.length > 0;
};

// 更新已选择数量显示
function updateSelectedCount() {
    document.getElementById('selectedCount').textContent = `已选择 ${selectedDomainIds.size} 个`;
}

// 批量刷新
window.batchRefresh = async function() {
    if (selectedDomainIds.size === 0) {
        alert('请先选择要刷新的域名');
        return;
    }
    
    if (!confirm(`确定要刷新选中的 ${selectedDomainIds.size} 个域名吗？`)) {
        return;
    }
    
    const selectedDomains = currentWatchedDomains.filter(d => selectedDomainIds.has(d.id));
    let successCount = 0;
    let failCount = 0;
    
    for (const domain of selectedDomains) {
        try {
            const result = await RefreshWatchedDomain(domain.domain);
            if (result.success) {
                successCount++;
            } else {
                failCount++;
            }
        } catch (err) {
            failCount++;
        }
    }
    
    alert(`批量刷新完成！\n成功：${successCount} 个\n失败：${failCount} 个`);
    loadWatchedDomains();
};

// 批量导出
window.batchExport = function() {
    if (selectedDomainIds.size === 0) {
        alert('请先选择要导出的域名');
        return;
    }
    
    const selectedDomains = currentWatchedDomains.filter(d => selectedDomainIds.has(d.id));
    exportDomainsToCSV(selectedDomains, `批量导出_${selectedDomainIds.size}个域名.csv`);
};

// 批量删除
window.batchDelete = async function() {
    if (selectedDomainIds.size === 0) {
        alert('请先选择要删除的域名');
        return;
    }
    
    if (!confirm(`确定要删除选中的 ${selectedDomainIds.size} 个域名吗？\n此操作不可撤销！`)) {
        return;
    }
    
    const idsToDelete = Array.from(selectedDomainIds);
    let successCount = 0;
    let failCount = 0;
    
    for (const id of idsToDelete) {
        try {
            await RemoveWatchedDomain(id);
            successCount++;
        } catch (err) {
            failCount++;
        }
    }
    
    alert(`批量删除完成！\n成功：${successCount} 个\n失败：${failCount} 个`);
    selectedDomainIds.clear();
    loadWatchedDomains();
};

// 导出全部域名
window.exportAllDomains = function() {
    if (currentWatchedDomains.length === 0) {
        alert('没有可导出的域名');
        return;
    }
    
    exportDomainsToCSV(currentWatchedDomains, `全部域名_${currentWatchedDomains.length}个.csv`);
};

// 导出域名到CSV
function exportDomainsToCSV(domains, filename) {
    // CSV标题
    const headers = ['域名', '备注', '状态', '剩余天数', '过期时间', '颁发者', '最后检查时间'];
    
    // CSV数据行
    const rows = domains.map(d => {
        const cert = d.certInfo;
        if (cert) {
            const statusText = {
                'safe': '安全',
                'warning': '警告',
                'danger': '危险',
                'expired': '已过期'
            };
            return [
                d.domain,
                d.nickname || '',
                statusText[cert.status] || cert.status,
                cert.daysRemaining,
                cert.notAfter,
                cert.issuer || '',
                d.lastCheckTime || ''
            ];
        } else {
            return [
                d.domain,
                d.nickname || '',
                '错误',
                'N/A',
                'N/A',
                'N/A',
                d.lastCheckTime || ''
            ];
        }
    });
    
    // 构建CSV内容
    let csvContent = '\uFEFF'; // BOM for UTF-8
    csvContent += headers.join(',') + '\n';
    rows.forEach(row => {
        csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
    });
    
    // 创建下载链接
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
    
    alert(`✅ 成功导出 ${domains.length} 个域名`);
}

// ==================== 通知设置功能 ====================

// 显示通知设置对话框
window.showNotifySettings = function(id, domain, enabled, threshold) {
    showCustomDialog(
        '🔔 通知设置',
        [
            {
                type: 'text',
                id: 'dialogDomain',
                label: '域名',
                value: domain,
                readOnly: true
            },
            {
                type: 'checkbox',
                id: 'dialogNotifyEnabled',
                label: '启用过期提醒',
                value: enabled
            },
            {
                type: 'number',
                id: 'dialogNotifyThreshold',
                label: '预警阈值（天）',
                placeholder: '输入1-365',
                value: threshold || 7,
                min: 1,
                max: 365,
                required: true
            }
        ],
        async (values) => {
            const notifyEnabled = values.dialogNotifyEnabled || false;
            const notifyThreshold = parseInt(values.dialogNotifyThreshold) || 7;
            
            try {
                await UpdateNotifySettings(id, notifyEnabled, notifyThreshold);
                alert('✅ 通知设置更新成功！');
                loadWatchedDomains();
            } catch (err) {
                alert('❌ 更新失败：' + err.message);
                console.error(err);
            }
        },
        `
        <div style="margin-top: 12px; padding: 12px; background: #fef3c7; border-radius: 8px; font-size: 13px; color: #92400e;">
            <div style="margin-bottom: 8px;">ℹ️ <strong>说明：</strong></div>
            <div style="line-height: 1.6;">
                • 启用通知后，当证书剩余天数 ≤ 预警阈值时，会显示提醒<br>
                • 预警阈值范围：1-365天<br>
                • 建议设置：7天（一周）成30天（一个月）
            </div>
        </div>
        `
    );
};

// ==================== 手动证书信息功能 ====================

// 显示手动编辑证书信息对话框
window.showManualCertEdit = function(id, domain, isManual, currentExpireDate) {
    // 如果当前是手动模式，提供切换选项
    if (isManual) {
        showCustomDialog(
            '✍️ 手动证书信息',
            [
                {
                    type: 'text',
                    id: 'dialogDomain',
                    label: '域名',
                    value: domain,
                    readOnly: true
                },
                {
                    type: 'text',
                    id: 'dialogCurrentExpire',
                    label: '当前过期时间',
                    value: currentExpireDate || '未设置',
                    readOnly: true
                },
                {
                    type: 'text',
                    id: 'dialogStartDate',
                    label: '生效时间（可选）',
                    placeholder: '格式：2025-12-05 或 2025-12-05 00:00:00',
                    required: false
                },
                {
                    type: 'text',
                    id: 'dialogExpireDate',
                    label: '过期时间',
                    placeholder: '格式：2026-03-04 或 2026-03-04 23:59:59',
                    required: false
                }
            ],
            async (values) => {
                const startDate = values.dialogStartDate ? values.dialogStartDate.trim() : '';
                const newExpireDate = values.dialogExpireDate ? values.dialogExpireDate.trim() : '';
                
                // 如果没有输入新时间，询问是否禁用手动模式
                if (!newExpireDate) {
                    if (confirm('未输入新过期时间，是否切换回自动查询模式？')) {
                        try {
                            await DisableManualMode(id);
                            alert('✅ 已切换回自动查询模式！');
                            loadWatchedDomains();
                        } catch (err) {
                            alert('❌ 操作失败：' + err.message);
                            console.error(err);
                        }
                    }
                    return;
                }
                
                try {
                    await UpdateManualCertInfo(id, startDate, newExpireDate);
                    alert('✅ 手动证书信息更新成功！');
                    loadWatchedDomains();
                } catch (err) {
                    alert('❌ 更新失败：' + err.message);
                    console.error(err);
                }
            },
            `
            <div style="margin-top: 12px; padding: 12px; background: #dbeafe; border-radius: 8px; font-size: 13px; color: #1e40af;">
                <div style="margin-bottom: 8px;">💡 <strong>提示：</strong></div>
                <div style="line-height: 1.6;">
                    • 当前为<strong>手动模式</strong>，证书信息不会自动查询<br>
                    • 可以修改过期时间，生效时间可选填写<br>
                    • 留空过期时间后确认可切换回自动模式<br>
                    • 支持的日期格式：YYYY-MM-DD 或 YYYY-MM-DD HH:MM:SS
                </div>
            </div>
            `
        );
    } else {
        // 首次启用手动模式
        showCustomDialog(
            '✍️ 手动录入证书信息',
            [
                {
                    type: 'text',
                    id: 'dialogDomain',
                    label: '域名',
                    value: domain,
                    readOnly: true
                },
                {
                    type: 'text',
                    id: 'dialogStartDate',
                    label: '证书生效时间（可选）',
                    placeholder: '格式：2025-12-05 或 2025-12-05 00:00:00',
                    required: false
                },
                {
                    type: 'text',
                    id: 'dialogExpireDate',
                    label: '证书过期时间',
                    placeholder: '格式：2026-03-04 或 2026-03-04 23:59:59',
                    required: true
                }
            ],
            async (values) => {
                const startDate = values.dialogStartDate ? values.dialogStartDate.trim() : '';
                const expireDate = values.dialogExpireDate.trim();
                
                try {
                    await UpdateManualCertInfo(id, startDate, expireDate);
                    alert('✅ 手动证书信息录入成功！');
                    loadWatchedDomains();
                } catch (err) {
                    alert('❌ 录入失败：' + err.message);
                    console.error(err);
                }
            },
            `
            <div style="margin-top: 12px; padding: 12px; background: #fef3c7; border-radius: 8px; font-size: 13px; color: #92400e;">
                <div style="margin-bottom: 8px;">⚠️ <strong>何时使用手动模式：</strong></div>
                <div style="line-height: 1.6;">
                    • 域名仅在<strong>内网</strong>可访问，无法从公网查询<br>
                    • 证书查询被<strong>防火墙阻止</strong><br>
                    • 需要临时监控<strong>特定日期</strong>的证书<br>
                    • 生效时间可选，用于计算证书总计时长<br>
                    • 支持的日期格式：YYYY-MM-DD 或 YYYY-MM-DD HH:MM:SS
                </div>
            </div>
            `
        );
    }
};

// ==================== 通知功能 ====================

// 启动时检查通知
window.checkNotificationsOnStartup = async function() {
    try {
        const result = await CheckNotifications();
        
        if (result.success && result.total > 0) {
            showNotificationDialog(result.items);
        }
    } catch (err) {
        console.error('检查通知失败:', err);
    }
};

// 显示通知对话框
function showNotificationDialog(items) {
    const statusIcon = {
        'safe': '✅',
        'warning': '⚠️',
        'danger': '🔴',
        'expired': '❌'
    };
    
    const statusText = {
        'safe': '安全',
        'warning': '警告',
        'danger': '危险',
        'expired': '已过期'
    };
    
    // 构建通知列表HTML
    let notificationListHtml = items.map(item => {
        const displayName = item.nickname ? `${item.nickname} (${item.domain})` : item.domain;
        const statusClass = `status-${item.status}`;
        
        return `
            <div class="notification-item ${statusClass}">
                <div class="notification-header">
                    <span class="notification-icon">${statusIcon[item.status]}</span>
                    <span class="notification-domain">${displayName}</span>
                    <span class="notification-badge ${statusClass}">
                        ${item.daysRemaining} 天
                    </span>
                </div>
                <div class="notification-info">
                    <span class="notification-label">过期时间：</span>
                    <span class="notification-value">${item.notAfter}</span>
                </div>
                <div class="notification-info">
                    <span class="notification-label">预警阈值：</span>
                    <span class="notification-value">${item.threshold} 天</span>
                </div>
            </div>
        `;
    }).join('');
    
    // 创建自定义通知对话框
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay show';
    
    const dialog = document.createElement('div');
    dialog.className = 'custom-dialog notification-dialog';
    dialog.style.maxWidth = '600px';
    
    dialog.innerHTML = `
        <div class="dialog-title">
            <span class="notification-title-icon">🔔</span>
            证书过期提醒
        </div>
        <div class="dialog-content">
            <div class="notification-summary">
                <strong>发现 ${items.length} 个域名需要关注！</strong>
            </div>
            <div class="notification-list">
                ${notificationListHtml}
            </div>
        </div>
        <div class="dialog-buttons">
            <button class="dialog-btn dialog-btn-cancel" onclick="closeNotificationDialog()">
                关闭
            </button>
            <button class="dialog-btn dialog-btn-confirm" onclick="closeNotificationDialog(); switchToWatchedTab()">
                查看详情
            </button>
        </div>
    `;
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    // 延迟显示动画
    setTimeout(() => {
        overlay.classList.add('show');
    }, 10);
    
    // 存储overlay以便关闭
    window.currentNotificationOverlay = overlay;
}

// 关闭通知对话框
window.closeNotificationDialog = function() {
    if (window.currentNotificationOverlay) {
        window.currentNotificationOverlay.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(window.currentNotificationOverlay);
            window.currentNotificationOverlay = null;
        }, 300);
    }
};

// 切换到关注域名页面
window.switchToWatchedTab = function() {
    // 点击关注域名标签
    const watchedTabBtn = document.querySelector('[data-tab="watched"]');
    if (watchedTabBtn) {
        watchedTabBtn.click();
    }
};

// 页面加载完成后检查通知
window.addEventListener('load', () => {
    // 延迟1秒检查，等待数据加载
    setTimeout(() => {
        checkNotificationsOnStartup();
    }, 1000);
});

// ==================== 自动刷新功能 ====================

// 自动刷新定时器ID
let autoRefreshTimer = null;

// 自动刷新配置对话框
window.showAutoRefreshSettings = function() {
    const currentInterval = localStorage.getItem('autoRefreshInterval') || '0';
    const isEnabled = currentInterval !== '0';
    
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    
    const dialog = document.createElement('div');
    dialog.className = 'custom-dialog';
    dialog.style.maxWidth = '450px';
    
    dialog.innerHTML = `
        <div class="dialog-title">
            <span>⏰</span> 自动刷新设置
        </div>
        <div class="dialog-content">
            <div class="setting-item">
                <label class="setting-label">
                    <input type="checkbox" id="autoRefreshEnabled" ${isEnabled ? 'checked' : ''}>
                    <span>启用自动刷新</span>
                </label>
            </div>
            <div class="setting-item" id="intervalSetting" style="${isEnabled ? '' : 'opacity: 0.5; pointer-events: none;'}">
                <label class="setting-label">刷新间隔：</label>
                <select id="refreshIntervalSelect" class="setting-select">
                    <option value="300000" ${currentInterval === '300000' ? 'selected' : ''}>每 5 分钟</option>
                    <option value="600000" ${currentInterval === '600000' ? 'selected' : ''}>每 10 分钟</option>
                    <option value="1800000" ${currentInterval === '1800000' ? 'selected' : ''}>每 30 分钟</option>
                    <option value="3600000" ${currentInterval === '3600000' ? 'selected' : ''}>每 1 小时</option>
                    <option value="10800000" ${currentInterval === '10800000' ? 'selected' : ''}>每 3 小时</option>
                    <option value="21600000" ${currentInterval === '21600000' ? 'selected' : ''}>每 6 小时</option>
                    <option value="43200000" ${currentInterval === '43200000' ? 'selected' : ''}>每 12 小时</option>
                </select>
            </div>
            <div class="setting-info">
                <span>💡</span> 启用后将在后台定期刷新关注域名的证书信息
            </div>
        </div>
        <div class="dialog-buttons">
            <button class="dialog-btn dialog-btn-cancel" onclick="closeAutoRefreshDialog()">取消</button>
            <button class="dialog-btn dialog-btn-confirm" onclick="saveAutoRefreshSettings()">保存</button>
        </div>
    `;
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    // 启用/禁用间隔选择
    const checkbox = dialog.querySelector('#autoRefreshEnabled');
    const intervalSetting = dialog.querySelector('#intervalSetting');
    checkbox.addEventListener('change', () => {
        intervalSetting.style.opacity = checkbox.checked ? '1' : '0.5';
        intervalSetting.style.pointerEvents = checkbox.checked ? 'auto' : 'none';
    });
    
    setTimeout(() => overlay.classList.add('show'), 10);
    window.currentAutoRefreshOverlay = overlay;
};

// 关闭自动刷新对话框
window.closeAutoRefreshDialog = function() {
    if (window.currentAutoRefreshOverlay) {
        window.currentAutoRefreshOverlay.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(window.currentAutoRefreshOverlay);
            window.currentAutoRefreshOverlay = null;
        }, 300);
    }
};

// 保存自动刷新设置
window.saveAutoRefreshSettings = async function() {
    const enabled = document.getElementById('autoRefreshEnabled').checked;
    const interval = enabled ? document.getElementById('refreshIntervalSelect').value : '0';
    
    // 保存设置
    localStorage.setItem('autoRefreshInterval', interval);
    
    // 重启定时器
    startAutoRefreshTimer();
    
    // 关闭对话框
    closeAutoRefreshDialog();
    
    // 提示
    const intervalText = {
        '0': '已禁用',
        '300000': '每 5 分钟',
        '600000': '每 10 分钟',
        '1800000': '每 30 分钟',
        '3600000': '每 1 小时',
        '10800000': '每 3 小时',
        '21600000': '每 6 小时',
        '43200000': '每 12 小时'
    };
    
    showToast(`✅ 自动刷新已设置为：${intervalText[interval]}`);
};

// 启动自动刷新定时器
function startAutoRefreshTimer() {
    // 清除旧定时器
    if (autoRefreshTimer) {
        clearInterval(autoRefreshTimer);
        autoRefreshTimer = null;
    }
    
    const interval = parseInt(localStorage.getItem('autoRefreshInterval') || '0');
    
    if (interval > 0) {
        console.log(`✅ 启动自动刷新，间隔：${interval}ms`);
        autoRefreshTimer = setInterval(async () => {
            try {
                console.log('🔄 执行自动刷新...');
                await RefreshAllWatchedDomains();
                console.log('✅ 自动刷新完成');
            } catch (err) {
                console.error('❌ 自动刷新失败：', err);
            }
        }, interval);
    } else {
        console.log('❌ 自动刷新已禁用');
    }
}

// 页面加载时启动自动刷新
startAutoRefreshTimer();

// ==================== 批量导入功能 ====================

// 显示批量导入对话框
window.showBatchImportDialog = function() {
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    
    const dialog = document.createElement('div');
    dialog.className = 'custom-dialog';
    dialog.style.maxWidth = '600px';
    
    dialog.innerHTML = `
        <div class="dialog-title">
            <span>📥</span> 批量导入域名
        </div>
        <div class="dialog-content">
            <div class="import-hint">
                <strong>💡 支持格式：</strong>
                <ul>
                    <li>每行一个域名：<code>www.example.com</code></li>
                    <li>CSV格式（域名,备注）：<code>www.example.com,公司网站</code></li>
                    <li>以 <code>#</code> 开头的行为注释，将被忽略</li>
                </ul>
            </div>
            <textarea 
                id="importTextarea" 
                class="import-textarea" 
                placeholder="请输入或粘贴域名列表：
# 示例：
www.baidu.com,百度
github.com,GitHub
www.google.com"
                rows="12"
            ></textarea>
            <div class="import-actions">
                <label class="file-upload-btn">
                    <span>📁</span> 选择文件
                    <input type="file" id="importFileInput" accept=".txt,.csv" style="display: none;" onchange="handleImportFile(event)">
                </label>
                <span class="import-tip">支持 TXT/CSV 文件</span>
            </div>
        </div>
        <div class="dialog-buttons">
            <button class="dialog-btn dialog-btn-cancel" onclick="closeBatchImportDialog()">取消</button>
            <button class="dialog-btn dialog-btn-confirm" onclick="executeBatchImport()">
                <span>🚀</span> 开始导入
            </button>
        </div>
    `;
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    setTimeout(() => overlay.classList.add('show'), 10);
    window.currentBatchImportOverlay = overlay;
};

// 关闭批量导入对话框
window.closeBatchImportDialog = function() {
    if (window.currentBatchImportOverlay) {
        window.currentBatchImportOverlay.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(window.currentBatchImportOverlay);
            window.currentBatchImportOverlay = null;
        }, 300);
    }
};

// 处理文件导入
window.handleImportFile = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        document.getElementById('importTextarea').value = content;
    };
    reader.readAsText(file);
};

// 执行批量导入
window.executeBatchImport = async function() {
    const textarea = document.getElementById('importTextarea');
    const text = textarea.value.trim();
    
    if (!text) {
        showToast('⚠️ 请输入要导入的域名');
        return;
    }
    
    try {
        // 显示加载状态
        const confirmBtn = event.target;
        const originalText = confirmBtn.innerHTML;
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<span>⏳</span> 导入中...';
        
        // 调用后端导入接口
        const result = await ImportDomainsFromText(text);
        
        // 恢复按钮
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = originalText;
        
        if (result.success) {
            showToast(`✅ ${result.message}`);
            closeBatchImportDialog();
            // 刷新关注列表
            loadWatchedDomains();
        } else {
            showToast(`❌ ${result.message}`);
        }
    } catch (err) {
        showToast('❌ 导入失败：' + err.message);
        console.error(err);
    }
};

// Toast提示功能
function showToast(message, duration = 3000) {
    // 移除旧的toast
    const oldToast = document.querySelector('.toast-message');
    if (oldToast) {
        oldToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}
