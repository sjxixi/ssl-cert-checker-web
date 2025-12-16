// 导入必要的API函数
import {GetWatchedDomains} from '../wailsjs/go/main/App';

// ==================== 高级过滤搜索功能 ====================

// 全局过滤配置
let filterConfig = {
    searchKeyword: '',
    statusFilter: 'all', // 'all', 'safe', 'warning', 'danger', 'expired'
    daysRangeFilter: 'all', // 'all', '0-7', '7-30', '30-90', '90+'
    sortBy: 'days-asc'
};

// 初始化过滤器事件监听
window.initFilterListeners = function() {
    const searchInput = document.getElementById('domainSearchInput');
    const sortSelect = document.getElementById('sortSelect');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterConfig.searchKeyword = e.target.value.trim().toLowerCase();
            applyFilters();
        });
    }
    
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            filterConfig.sortBy = e.target.value;
            applyFilters();
        });
    }
};

// 应用过滤器
function applyFilters() {
    if (!currentWatchedDomains || currentWatchedDomains.length === 0) {
        return;
    }
    
    let filteredDomains = [...currentWatchedDomains];
    
    // 搜索关键词过滤
    if (filterConfig.searchKeyword) {
        filteredDomains = filteredDomains.filter(d => {
            const domain = d.domain.toLowerCase();
            const nickname = (d.nickname || '').toLowerCase();
            return domain.includes(filterConfig.searchKeyword) || 
                   nickname.includes(filterConfig.searchKeyword);
        });
    }
    
    // 状态过滤
    if (filterConfig.statusFilter !== 'all') {
        filteredDomains = filteredDomains.filter(d => {
            return d.certInfo && d.certInfo.status === filterConfig.statusFilter;
        });
    }
    
    // 剩余天数范围过滤
    if (filterConfig.daysRangeFilter !== 'all') {
        filteredDomains = filteredDomains.filter(d => {
            if (!d.certInfo) return false;
            const days = d.certInfo.daysRemaining;
            
            switch(filterConfig.daysRangeFilter) {
                case '0-7': return days >= 0 && days <= 7;
                case '7-30': return days > 7 && days <= 30;
                case '30-90': return days > 30 && days <= 90;
                case '90+': return days > 90;
                default: return true;
            }
        });
    }
    
    // 排序
    filteredDomains.sort((a, b) => {
        switch(filterConfig.sortBy) {
            case 'days-asc':
                return (a.certInfo?.daysRemaining || 9999) - (b.certInfo?.daysRemaining || 9999);
            case 'days-desc':
                return (b.certInfo?.daysRemaining || -1) - (a.certInfo?.daysRemaining || -1);
            case 'status':
                const statusOrder = { 'expired': 0, 'danger': 1, 'warning': 2, 'safe': 3 };
                return (statusOrder[a.certInfo?.status] || 99) - (statusOrder[b.certInfo?.status] || 99);
            case 'domain':
                return a.domain.localeCompare(b.domain);
            default:
                return 0;
        }
    });
    
    // 重新渲染
    renderWatchedDomains(filteredDomains);
}

// 重置过滤器
window.resetFilters = function() {
    filterConfig = {
        searchKeyword: '',
        statusFilter: 'all',
        daysRangeFilter: 'all',
        sortBy: 'days-asc'
    };
    
    const searchInput = document.getElementById('domainSearchInput');
    const sortSelect = document.getElementById('sortSelect');
    
    if (searchInput) searchInput.value = '';
    if (sortSelect) sortSelect.value = 'days-asc';
    
    renderWatchedDomains(currentWatchedDomains);
};

// ==================== CSV导出功能 ====================

// 导出所有关注域名为CSV
window.exportAllDomains = function() {
    if (!currentWatchedDomains || currentWatchedDomains.length === 0) {
        showToast('❌ 没有可导出的域名');
        return;
    }
    
    exportDomainsToCSV(currentWatchedDomains, `关注域名_全部_${formatDate(new Date())}.csv`);
};

// 导出选中域名为CSV（批量模式）
window.batchExport = function() {
    if (selectedDomainIds.size === 0) {
        showToast('❌ 请先选择要导出的域名');
        return;
    }
    
    const selectedDomains = currentWatchedDomains.filter(d => selectedDomainIds.has(d.id));
    exportDomainsToCSV(selectedDomains, `关注域名_批量_${selectedDomainIds.size}个_${formatDate(new Date())}.csv`);
};

// 核心CSV导出函数
function exportDomainsToCSV(domains, filename) {
    // CSV标题行
    const headers = [
        '域名',
        '备注',
        '状态',
        '剩余天数',
        '过期时间',
        '生效时间',
        '颁发者',
        '序列号',
        '是否手动',
        '通知已启用',
        '预警阈值(天)',
        '添加时间',
        '最后检测时间'
    ];
    
    // CSV内容行
    const rows = domains.map(d => {
        const cert = d.certInfo || {};
        return [
            `"${d.domain}"`,
            `"${d.nickname || ''}"`,
            `"${getStatusText(cert.status)}"`,
            cert.daysRemaining || '',
            `"${cert.notAfter || ''}"`,
            `"${cert.notBefore || ''}"`,
            `"${cert.issuer || ''}"`,
            `"${cert.serialNumber || ''}"`,
            d.isManual ? '是' : '否',
            d.notifyEnabled ? '是' : '否',
            d.notifyThreshold || 7,
            `"${d.addedTime || ''}"`,
            `"${d.lastCheckTime || ''}"`,
        ].join(',');
    });
    
    // 组合CSV内容
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    
    // 创建Blob并下载
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast(`✅ 已导出 ${domains.length} 个域名`);
}

// 辅助函数：获取状态文本
function getStatusText(status) {
    const statusMap = {
        'safe': '安全',
        'warning': '警告',
        'danger': '危险',
        'expired': '已过期'
    };
    return statusMap[status] || '未知';
}

// 辅助函数：格式化日期
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}_${hour}${minute}${second}`;
}

// ==================== 数据可视化图表功能 ====================

// 加载图表
window.loadCharts = async function() {
    const chartsContent = document.getElementById('chartsContent');
    
    try {
        // 获取关注域名数据
        const result = await GetWatchedDomains();
        
        if (result.success && result.domains && result.domains.length > 0) {
            renderCharts(result.domains);
        } else {
            chartsContent.innerHTML = '<p class="empty-hint">📊 暂无数据<br><small>请先添加关注域名</small></p>';
        }
    } catch (err) {
        chartsContent.innerHTML = `<p class="error-hint">❌ 加载失败：${err.message}</p>`;
        console.error(err);
    }
};

// 渲染图表
function renderCharts(domains) {
    const chartsContent = document.getElementById('chartsContent');
    
    // 统计数据
    const stats = calculateStatistics(domains);
    
    // 生成图表HTML
    chartsContent.innerHTML = `
        <!-- 总览卡片 -->
        <div class="chart-overview">
            <div class="overview-card">
                <div class="overview-icon">📊</div>
                <div class="overview-info">
                    <div class="overview-value">${stats.total}</div>
                    <div class="overview-label">总域名数</div>
                </div>
            </div>
            <div class="overview-card safe">
                <div class="overview-icon">✅</div>
                <div class="overview-info">
                    <div class="overview-value">${stats.safe}</div>
                    <div class="overview-label">安全</div>
                </div>
            </div>
            <div class="overview-card warning">
                <div class="overview-icon">⚠️</div>
                <div class="overview-info">
                    <div class="overview-value">${stats.warning}</div>
                    <div class="overview-label">警告</div>
                </div>
            </div>
            <div class="overview-card danger">
                <div class="overview-icon">🔴</div>
                <div class="overview-info">
                    <div class="overview-value">${stats.danger}</div>
                    <div class="overview-label">危险</div>
                </div>
            </div>
            <div class="overview-card expired">
                <div class="overview-icon">❌</div>
                <div class="overview-info">
                    <div class="overview-value">${stats.expired}</div>
                    <div class="overview-label">已过期</div>
                </div>
            </div>
        </div>
        
        <!-- 状态分布饼图 -->
        <div class="chart-section">
            <h4 class="chart-title">📊 证书状态分布</h4>
            <div class="pie-chart-container">
                ${renderPieChart(stats)}
            </div>
        </div>
        
        <!-- 剩余天数分布柱状图 -->
        <div class="chart-section">
            <h4 class="chart-title">📈 剩余天数分布</h4>
            <div class="bar-chart-container">
                ${renderBarChart(stats)}
            </div>
        </div>
        
        <!-- 颁发者分布 -->
        <div class="chart-section">
            <h4 class="chart-title">🏢 证书颁发者分布</h4>
            <div class="issuer-chart-container">
                ${renderIssuerChart(stats)}
            </div>
        </div>
        
        <!-- 即将过期域名列表 -->
        <div class="chart-section">
            <h4 class="chart-title">⏰ 即将过期域名 (30天内)</h4>
            <div class="expiring-list">
                ${renderExpiringList(domains)}
            </div>
        </div>
    `;
}

// 计算统计数据
function calculateStatistics(domains) {
    const stats = {
        total: domains.length,
        safe: 0,
        warning: 0,
        danger: 0,
        expired: 0,
        daysDistribution: { '0-7': 0, '7-30': 0, '30-90': 0, '90+': 0 },
        issuers: {}
    };
    
    domains.forEach(d => {
        if (d.certInfo) {
            // 状态统计
            stats[d.certInfo.status] = (stats[d.certInfo.status] || 0) + 1;
            
            // 天数分布
            const days = d.certInfo.daysRemaining;
            if (days >= 0 && days <= 7) stats.daysDistribution['0-7']++;
            else if (days > 7 && days <= 30) stats.daysDistribution['7-30']++;
            else if (days > 30 && days <= 90) stats.daysDistribution['30-90']++;
            else if (days > 90) stats.daysDistribution['90+']++;
            
            // 颁发者统计
            const issuer = d.certInfo.issuer || '未知';
            stats.issuers[issuer] = (stats.issuers[issuer] || 0) + 1;
        }
    });
    
    return stats;
}

// 渲染饼图（纯CSS实现）
function renderPieChart(stats) {
    const total = stats.total || 1;
    const safePercent = (stats.safe / total) * 100;
    const warningPercent = (stats.warning / total) * 100;
    const dangerPercent = (stats.danger / total) * 100;
    const expiredPercent = (stats.expired / total) * 100;
    
    // 构建conic-gradient - 只包含数量大于0的部分
    const gradientParts = [];
    let currentDeg = 0;
    
    if (stats.safe > 0) {
        const endDeg = currentDeg + (safePercent * 3.6);
        gradientParts.push(`#10b981 ${currentDeg}deg ${endDeg}deg`);
        currentDeg = endDeg;
    }
    
    if (stats.warning > 0) {
        const endDeg = currentDeg + (warningPercent * 3.6);
        gradientParts.push(`#f59e0b ${currentDeg}deg ${endDeg}deg`);
        currentDeg = endDeg;
    }
    
    if (stats.danger > 0) {
        const endDeg = currentDeg + (dangerPercent * 3.6);
        gradientParts.push(`#ef4444 ${currentDeg}deg ${endDeg}deg`);
        currentDeg = endDeg;
    }
    
    if (stats.expired > 0) {
        const endDeg = currentDeg + (expiredPercent * 3.6);
        gradientParts.push(`#991b1b ${currentDeg}deg ${endDeg}deg`);
        currentDeg = endDeg;
    }
    
    // 如果所有状态都为0，显示灰色
    const gradientStyle = gradientParts.length > 0 
        ? `conic-gradient(${gradientParts.join(', ')})`
        : 'conic-gradient(#cbd5e1 0deg 360deg)';
    
    return `
        <div class="pie-chart">
            <div class="pie-legend">
                <div class="legend-item">
                    <span class="legend-color safe"></span>
                    <span class="legend-text">安全 (${stats.safe}, ${safePercent.toFixed(1)}%)</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color warning"></span>
                    <span class="legend-text">警告 (${stats.warning}, ${warningPercent.toFixed(1)}%)</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color danger"></span>
                    <span class="legend-text">危险 (${stats.danger}, ${dangerPercent.toFixed(1)}%)</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color expired"></span>
                    <span class="legend-text">已过期 (${stats.expired}, ${expiredPercent.toFixed(1)}%)</span>
                </div>
            </div>
            <div class="pie-visual" style="background: ${gradientStyle}">
            </div>
        </div>
    `;
}

// 渲染柱状图
function renderBarChart(stats) {
    const maxValue = Math.max(...Object.values(stats.daysDistribution));
    
    return `
        <div class="bar-chart">
            ${Object.entries(stats.daysDistribution).map(([range, count]) => {
                const percentage = maxValue > 0 ? (count / maxValue) * 100 : 0;
                return `
                    <div class="bar-item">
                        <div class="bar-label">${range} 天</div>
                        <div class="bar-wrapper">
                            <div class="bar-fill" style="width: ${percentage}%">
                                <span class="bar-value">${count}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// 渲染颁发者图表
function renderIssuerChart(stats) {
    const issuersArray = Object.entries(stats.issuers)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10); // 只显示前10个
    
    const maxCount = issuersArray.length > 0 ? issuersArray[0][1] : 1;
    
    if (issuersArray.length === 0) {
        return '<p class="empty-hint">暂无数据</p>';
    }
    
    return `
        <div class="issuer-chart">
            ${issuersArray.map(([issuer, count]) => {
                const percentage = (count / maxCount) * 100;
                return `
                    <div class="issuer-item">
                        <div class="issuer-name" title="${issuer}">${issuer}</div>
                        <div class="issuer-bar-container">
                            <div class="issuer-bar-wrapper">
                                <div class="issuer-bar" style="width: ${percentage}%"></div>
                            </div>
                            <span class="issuer-count">${count}</span>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// 渲染即将过期列表
function renderExpiringList(domains) {
    const expiringDomains = domains
        .filter(d => d.certInfo && d.certInfo.daysRemaining >= 0 && d.certInfo.daysRemaining <= 30)
        .sort((a, b) => a.certInfo.daysRemaining - b.certInfo.daysRemaining);
    
    if (expiringDomains.length === 0) {
        return '<p class="empty-hint">✅ 暂无即将过期的域名</p>';
    }
    
    return `
        <div class="expiring-domains">
            ${expiringDomains.map(d => `
                <div class="expiring-item status-${d.certInfo.status}">
                    <div class="expiring-domain">${d.domain}</div>
                    <div class="expiring-days">${d.certInfo.daysRemaining} 天</div>
                    <div class="expiring-date">过期: ${d.certInfo.notAfter}</div>
                </div>
            `).join('')}
        </div>
    `;
}

// ==================== 系统设置功能 ====================

// 加载设置页面
window.loadSettings = function() {
    const settingsContent = document.getElementById('settingsContent');
    
    // 从localStorage读取当前配置
    const config = {
        queryTimeout: localStorage.getItem('queryTimeout') || '5',
        defaultThreshold: localStorage.getItem('defaultThreshold') || '7',
        autoRefreshInterval: localStorage.getItem('autoRefreshInterval') || '0',
        historyRetentionDays: localStorage.getItem('historyRetentionDays') || '30',
        theme: localStorage.getItem('theme') || 'light'
    };
    
    settingsContent.innerHTML = `
        <div class="settings-container">
            <!-- 查询设置 -->
            <div class="settings-section">
                <h4 class="settings-section-title">🔍 查询设置</h4>
                <div class="setting-item">
                    <label class="setting-label">
                        <span class="label-text">查询超时时间 (秒)</span>
                        <span class="label-desc">SSL证书查询的超时时间</span>
                    </label>
                    <select id="queryTimeout" class="setting-input">
                        <option value="3" ${config.queryTimeout === '3' ? 'selected' : ''}>3 秒</option>
                        <option value="5" ${config.queryTimeout === '5' ? 'selected' : ''}>5 秒</option>
                        <option value="10" ${config.queryTimeout === '10' ? 'selected' : ''}>10 秒</option>
                        <option value="15" ${config.queryTimeout === '15' ? 'selected' : ''}>15 秒</option>
                    </select>
                </div>
            </div>
            
            <!-- 通知设置 -->
            <div class="settings-section">
                <h4 class="settings-section-title">🔔 通知设置</h4>
                <div class="setting-item">
                    <label class="setting-label">
                        <span class="label-text">默认预警阈值 (天)</span>
                        <span class="label-desc">新添加域名的默认预警天数</span>
                    </label>
                    <select id="defaultThreshold" class="setting-input">
                        <option value="3" ${config.defaultThreshold === '3' ? 'selected' : ''}>3 天</option>
                        <option value="7" ${config.defaultThreshold === '7' ? 'selected' : ''}>7 天</option>
                        <option value="14" ${config.defaultThreshold === '14' ? 'selected' : ''}>14 天</option>
                        <option value="30" ${config.defaultThreshold === '30' ? 'selected' : ''}>30 天</option>
                    </select>
                </div>
            </div>
            
            <!-- 自动刷新设置 -->
            <div class="settings-section">
                <h4 class="settings-section-title">⏰ 自动刷新</h4>
                <div class="setting-item">
                    <label class="setting-label">
                        <span class="label-text">刷新间隔</span>
                        <span class="label-desc">关注域名自动刷新的时间间隔</span>
                    </label>
                    <select id="autoRefreshInterval" class="setting-input">
                        <option value="0" ${config.autoRefreshInterval === '0' ? 'selected' : ''}>禁用</option>
                        <option value="300000" ${config.autoRefreshInterval === '300000' ? 'selected' : ''}>每 5 分钟</option>
                        <option value="600000" ${config.autoRefreshInterval === '600000' ? 'selected' : ''}>每 10 分钟</option>
                        <option value="1800000" ${config.autoRefreshInterval === '1800000' ? 'selected' : ''}>每 30 分钟</option>
                        <option value="3600000" ${config.autoRefreshInterval === '3600000' ? 'selected' : ''}>每 1 小时</option>
                        <option value="10800000" ${config.autoRefreshInterval === '10800000' ? 'selected' : ''}>每 3 小时</option>
                        <option value="21600000" ${config.autoRefreshInterval === '21600000' ? 'selected' : ''}>每 6 小时</option>
                    </select>
                </div>
            </div>
            
            <!-- 数据管理 -->
            <div class="settings-section">
                <h4 class="settings-section-title">💾 数据管理</h4>
                <div class="setting-item">
                    <label class="setting-label">
                        <span class="label-text">历史记录保留天数</span>
                        <span class="label-desc">自动清理N天前的历史记录</span>
                    </label>
                    <select id="historyRetentionDays" class="setting-input">
                        <option value="7" ${config.historyRetentionDays === '7' ? 'selected' : ''}>7 天</option>
                        <option value="30" ${config.historyRetentionDays === '30' ? 'selected' : ''}>30 天</option>
                        <option value="90" ${config.historyRetentionDays === '90' ? 'selected' : ''}>90 天</option>
                        <option value="180" ${config.historyRetentionDays === '180' ? 'selected' : ''}>180 天</option>
                        <option value="-1" ${config.historyRetentionDays === '-1' ? 'selected' : ''}>永久保留</option>
                    </select>
                </div>
            </div>
            
            <!-- 界面设置 -->
            <div class="settings-section">
                <h4 class="settings-section-title">🎨 界面设置</h4>
                <div class="setting-item">
                    <label class="setting-label">
                        <span class="label-text">界面主题</span>
                        <span class="label-desc">选择您偏好的界面主题</span>
                    </label>
                    <select id="themeSelect" class="setting-input" onchange="changeTheme(this.value)">
                        <option value="light" ${config.theme === 'light' ? 'selected' : ''}>☀️ 浅色主题</option>
                        <option value="dark" ${config.theme === 'dark' ? 'selected' : ''}>🌙 深色主题</option>
                    </select>
                </div>
            </div>
            
            <!-- 关于信息 -->
            <div class="settings-section">
                <h4 class="settings-section-title">ℹ️ 关于</h4>
                <div class="about-info">
                    <div class="about-item">
                        <span class="about-label">应用名称：</span>
                        <span class="about-value">SSL证书查询工具</span>
                    </div>
                    <div class="about-item">
                        <span class="about-label">版本：</span>
                        <span class="about-value">1.0.0</span>
                    </div>
                    <div class="about-item">
                        <span class="about-label">技术栈：</span>
                        <span class="about-value">Wails v2 + Go + JavaScript</span>
                    </div>
                </div>
            </div>
            
            <!-- 操作按钮 -->
            <div class="settings-actions">
                <button class="btn-primary" onclick="saveSettings()">
                    <span>💾</span> 保存设置
                </button>
                <button class="btn-secondary" onclick="resetSettings()">
                    <span>🔄</span> 恢复默认
                </button>
            </div>
        </div>
    `;
};

// 保存设置
window.saveSettings = function() {
    const config = {
        queryTimeout: document.getElementById('queryTimeout').value,
        defaultThreshold: document.getElementById('defaultThreshold').value,
        autoRefreshInterval: document.getElementById('autoRefreshInterval').value,
        historyRetentionDays: document.getElementById('historyRetentionDays').value,
        theme: document.getElementById('themeSelect').value
    };
    
    // 保存到localStorage
    Object.entries(config).forEach(([key, value]) => {
        localStorage.setItem(key, value);
    });
    
    // 重启自动刷新定时器
    if (typeof startAutoRefreshTimer === 'function') {
        startAutoRefreshTimer();
    }
    
    showToast('✅ 设置已保存');
};

// 恢复默认设置
window.resetSettings = function() {
    if (!confirm('确定要恢复默认设置吗？')) {
        return;
    }
    
    const defaults = {
        queryTimeout: '5',
        defaultThreshold: '7',
        autoRefreshInterval: '0',
        historyRetentionDays: '30',
        theme: 'light'
    };
    
    Object.entries(defaults).forEach(([key, value]) => {
        localStorage.setItem(key, value);
    });
    
    // 重新加载设置页面
    loadSettings();
    
    // 应用主题
    changeTheme('light');
    
    showToast('✅ 已恢复默认设置');
};

// 切换主题
window.changeTheme = function(theme) {
    localStorage.setItem('theme', theme);
    
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
        showToast('🌙 已切换到深色主题');
    } else {
        document.body.classList.remove('dark-theme');
        showToast('☀️ 已切换到浅色主题');
    }
};

// 页面加载时立即应用主题（同步执行）
const savedTheme = localStorage.getItem('theme') || 'light';
if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
}

// DOM加载完成后再次确保主题应用
document.addEventListener('DOMContentLoaded', () => {
    const theme = localStorage.getItem('theme') || 'light';
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
    }
});

// ==================== 初始化 ====================

// 页面加载完成后初始化过滤器
window.addEventListener('load', () => {
    setTimeout(() => {
        initFilterListeners();
    }, 500);
});
