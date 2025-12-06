/**
 * Business Analytics & Forecasting Platform
 * Main JavaScript Application
 * 
 * AI Integration: WebSocket handlers receive mock data.
 * Replace server handlers to use your AI models.
 */

// ===== Configuration =====
const WS_URL = `ws://${window.location.host}/ws`;

// ===== State =====
let ws = null;
let charts = {};
let currentPage = 'home';

// ===== WebSocket Connection =====
function connectWebSocket() {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
        console.log('✅ WebSocket connected');
        loadPageData();
    };

    ws.onmessage = (event) => {
        const response = JSON.parse(event.data);
        handleWebSocketMessage(response);
    };

    ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
    };

    ws.onclose = () => {
        console.log('🔄 WebSocket disconnected, reconnecting...');
        setTimeout(connectWebSocket, 3000);
    };
}

function sendMessage(action, params = {}) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action, ...params }));
    }
}

function handleWebSocketMessage(response) {
    switch (response.action) {
        case 'sales_records':
            renderSalesTable(response.data);
            break;
        case 'data_health':
            updateDataHealth(response.data);
            break;
        case 'forecast':
            updateForecast(response.data);
            break;
        case 'dashboard_widgets':
            renderDashboard(response.data);
            break;
        case 'chart_data':
            updateChart(response.data);
            break;
        case 'error':
            console.error('Server error:', response.data.message);
            break;
    }
}

// ===== Page Navigation =====
function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    const page = document.getElementById(`page-${pageName}`);
    if (page) {
        page.classList.add('active');
    }

    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === pageName) {
            link.classList.add('active');
        }
    });

    currentPage = pageName;
    loadPageData();
}

function loadPageData() {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    switch (currentPage) {
        case 'data':
            sendMessage('get_sales_records');
            sendMessage('get_data_health');
            break;
        case 'forecast':
            sendMessage('get_forecast');
            break;
        case 'dashboard':
            sendMessage('get_dashboard_widgets');
            initDashboardCharts();
            break;
    }
}

// ===== Data Warehouse Page =====
function renderSalesTable(records) {
    const tbody = document.getElementById('table-body');
    if (!tbody) return;

    tbody.innerHTML = records.map(record => `
        <tr>
            <td>📅 ${record.dateRange}</td>
            <td style="color: var(--primary-dark); font-weight: 600;">$${record.salesVolume.toLocaleString()}</td>
            <td>${record.records.toLocaleString()}</td>
            <td>
                <span class="badge ${record.status === 'Clean' ? 'badge-success' : 'badge-warning'}">
                    ${record.status === 'Clean' ? '✓' : '⚠️'} ${record.status}
                </span>
            </td>
            <td>${record.source}</td>
            <td>
                <span class="badge badge-blue">📍 ${record.region}</span>
            </td>
            <td style="color: var(--text-muted);">${record.lastUpdated}</td>
        </tr>
    `).join('');
}

function updateDataHealth(data) {
    const scoreEl = document.getElementById('health-score');
    const progressEl = document.getElementById('health-progress');
    const recordsEl = document.getElementById('total-records');
    const revenueEl = document.getElementById('total-revenue');

    if (scoreEl) scoreEl.innerHTML = `${data.score}<span style="font-size: 1rem; color: var(--text-muted);">/100</span>`;
    if (progressEl) progressEl.style.width = `${data.score}%`;
    if (recordsEl) recordsEl.textContent = data.totalRecords.toLocaleString();
    if (revenueEl) revenueEl.textContent = `$${data.totalRevenue}M`;
}

// ===== Forecast Page =====
function updateForecast(data) {
    const accuracyEl = document.getElementById('accuracy');
    const confidenceEl = document.getElementById('confidence');

    if (accuracyEl) accuracyEl.textContent = `${data.accuracy}%`;
    if (confidenceEl) confidenceEl.textContent = `${data.confidence}%`;

    renderForecastChart(data);
}

function renderForecastChart(data) {
    const ctx = document.getElementById('forecast-chart');
    if (!ctx) return;

    // Destroy existing chart
    if (charts.forecast) {
        charts.forecast.destroy();
    }

    const allData = [...data.historical, ...data.forecast];
    const labels = allData.map(d => d.month);
    const values = allData.map(d => d.value / 1000); // Convert to thousands

    // Split colors: historical vs forecast
    const backgroundColors = allData.map(d =>
        d.type === 'historical'
            ? 'rgba(135, 206, 235, 0.7)'
            : 'rgba(255, 182, 193, 0.7)'
    );

    charts.forecast = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sales (thousands $)',
                data: values,
                backgroundColor: backgroundColors,
                borderRadius: 6,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#2D3748',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    cornerRadius: 8,
                    callbacks: {
                        label: (context) => `$${context.raw.toFixed(0)}k`
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    },
                    ticks: {
                        callback: (value) => `$${value}k`
                    }
                }
            }
        }
    });
}

function generateForecast() {
    const horizon = document.getElementById('time-horizon')?.value || 180;
    sendMessage('get_forecast', { params: { horizon } });
}

// ===== Dashboard Page =====
function initDashboardCharts() {
    // Revenue Bar Chart
    const revenueCtx = document.getElementById('revenue-chart');
    if (revenueCtx && !charts.revenue) {
        charts.revenue = new Chart(revenueCtx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Revenue',
                    data: [45, 52, 48, 61, 55, 67],
                    backgroundColor: [
                        'rgba(135, 206, 235, 0.7)',
                        'rgba(135, 206, 235, 0.8)',
                        'rgba(135, 206, 235, 0.7)',
                        'rgba(135, 206, 235, 0.9)',
                        'rgba(135, 206, 235, 0.75)',
                        'rgba(135, 206, 235, 1)',
                    ],
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { grid: { display: false } },
                    y: {
                        grid: { color: 'rgba(0,0,0,0.05)' },
                        ticks: { callback: (v) => `$${v}k` }
                    }
                }
            }
        });
    }

    // Products Donut Chart
    const productsCtx = document.getElementById('products-chart');
    if (productsCtx && !charts.products) {
        charts.products = new Chart(productsCtx, {
            type: 'doughnut',
            data: {
                labels: ['Product A', 'Product B', 'Product C', 'Product D'],
                datasets: [{
                    data: [35, 28, 22, 15],
                    backgroundColor: [
                        '#87CEEB',
                        '#FFB6C1',
                        '#E6E6FA',
                        '#98FB98'
                    ],
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 16,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    }
                }
            }
        });
    }
}

function renderDashboard(widgets) {
    // Could dynamically render widgets here
    initDashboardCharts();
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    connectWebSocket();

    // Load demo data if WebSocket fails
    setTimeout(() => {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            loadDemoData();
        }
    }, 2000);
});

// ===== Demo Data (fallback if no WebSocket) =====
function loadDemoData() {
    console.log('📊 Loading demo data...');

    // Demo sales records
    const demoRecords = [
        { dateRange: 'Jan 2024 - Mar 2024', salesVolume: 245000, records: 1250, status: 'Clean', source: 'CSV Import', region: 'North America', lastUpdated: '2024-03-15' },
        { dateRange: 'Oct 2023 - Dec 2023', salesVolume: 312500, records: 1580, status: 'Clean', source: 'Database Sync', region: 'South America', lastUpdated: '2023-12-31' },
        { dateRange: 'Jul 2023 - Sep 2023', salesVolume: 189000, records: 980, status: 'Needs Review', source: 'Excel Upload', region: 'Europe', lastUpdated: '2023-09-30' },
        { dateRange: 'Apr 2023 - Jun 2023', salesVolume: 267800, records: 1340, status: 'Clean', source: 'API Integration', region: 'Asia', lastUpdated: '2023-06-30' },
    ];
    renderSalesTable(demoRecords);

    // Demo health data
    updateDataHealth({ score: 87, totalRecords: 6270, totalRevenue: 12.4 });

    // Demo forecast
    const demoForecast = {
        historical: [
            { month: 'Jan', value: 280000, type: 'historical' },
            { month: 'Feb', value: 295000, type: 'historical' },
            { month: 'Mar', value: 310000, type: 'historical' },
            { month: 'Apr', value: 340000, type: 'historical' },
            { month: 'May', value: 360000, type: 'historical' },
            { month: 'Jun', value: 385000, type: 'historical' },
        ],
        forecast: [
            { month: 'Jul', value: 410000, type: 'forecast' },
            { month: 'Aug', value: 435000, type: 'forecast' },
            { month: 'Sep', value: 455000, type: 'forecast' },
            { month: 'Oct', value: 480000, type: 'forecast' },
            { month: 'Nov', value: 510000, type: 'forecast' },
            { month: 'Dec', value: 545000, type: 'forecast' },
        ],
        accuracy: 94.2,
        confidence: 89
    };

    if (currentPage === 'forecast') {
        updateForecast(demoForecast);
    }

    if (currentPage === 'dashboard') {
        initDashboardCharts();
    }
}
