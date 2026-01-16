/**
 * Healthcatchers - Health Assessment Platform
 * Dashboard JavaScript Application
 */

// ===== Configuration =====
const WS_URL = `ws://${window.location.host}/ws`;

// ===== State =====
let ws = null;
let currentPage = 'home';

// ===== WebSocket Connection =====
function connectWebSocket() {
    ws = new WebSocket(WS_URL);

    ws.onopen = function () {
        // Connection established
    };

    ws.onmessage = function (event) {
        const response = JSON.parse(event.data);
        handleWebSocketMessage(response);
    };

    ws.onerror = function () {
        // Connection error
    };

    ws.onclose = function () {
        setTimeout(connectWebSocket, 3000);
    };
}

function sendMessage(action, data) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: action, data: data }));
    } else {
        showError('Connection error. Please reload the page.');
    }
}

function handleWebSocketMessage(response) {
    switch (response.action) {
        case 'health_result':
            displayDashboard(response.data);
            break;
        case 'prediction_result':
            displayDashboard({ dry_eye: response.data, health_analysis: null, user_data: {} });
            break;
        case 'error':
            showError(response.data.message);
            break;
    }
}

// ===== Page Navigation =====
function showPage(pageName) {
    document.querySelectorAll('.page').forEach(function (page) {
        page.classList.remove('active');
    });

    const page = document.getElementById('page-' + pageName);
    if (page) {
        page.classList.add('active');
    }

    document.querySelectorAll('.nav-link').forEach(function (link) {
        link.classList.remove('active');
        if (link.dataset.page === pageName) {
            link.classList.add('active');
        }
    });

    currentPage = pageName;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== Optional Section Toggle =====
function toggleOptional() {
    const content = document.getElementById('optional-content');
    const icon = document.getElementById('expand-icon');

    if (content.classList.contains('show')) {
        content.classList.remove('show');
        icon.classList.remove('expanded');
    } else {
        content.classList.add('show');
        icon.classList.add('expanded');
    }
}

// ===== Form Handling =====
function collectFormData() {
    const form = document.getElementById('assessment-form');
    const formData = new FormData(form);
    const data = {};

    formData.forEach(function (value, key) {
        if (value === '' || value === null) {
            return;
        }

        const numericFields = [
            'Age', 'Height', 'Weight', 'Heart rate',
            'Sleep duration', 'Sleep quality', 'Stress level',
            'Daily steps', 'Physical activity', 'Average screen time'
        ];

        if (numericFields.indexOf(key) !== -1) {
            data[key] = parseFloat(value);
        } else {
            data[key] = value;
        }
    });

    return data;
}

function validateForm() {
    const form = document.getElementById('assessment-form');
    if (!form.checkValidity()) {
        form.reportValidity();
        return false;
    }
    return true;
}

function submitAssessment(event) {
    event.preventDefault();

    if (!validateForm()) {
        return;
    }

    const data = collectFormData();

    const submitBtn = document.querySelector('.form-actions .btn-primary');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Analyzing...';
    submitBtn.disabled = true;

    sendMessage('health_check', data);

    setTimeout(function () {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }, 15000);
}

// ===== Dashboard Display =====
function displayDashboard(data) {
    resetButton();

    const dryEye = data.dry_eye;
    const healthAnalysis = data.health_analysis;
    const userData = data.user_data || {};

    // Update patient info
    if (userData.age) {
        document.getElementById('patient-age').textContent = 'Age: ' + userData.age;
    }

    // Update risk gauge
    updateRiskGauge(dryEye.probability, dryEye.risk_level);

    // Draw distribution chart
    drawDistributionChart(dryEye.probability, dryEye.percentile || Math.round(dryEye.probability * 100));

    // Update percentile text
    const percentile = dryEye.percentile || Math.round(dryEye.probability * 100);
    document.getElementById('percentile-value').textContent = percentile;

    // Display risk drivers
    displayRiskDrivers(dryEye.risk_factors || []);

    // Display symptoms comparison
    displaySymptoms(userData, dryEye.probability);

    // Display action plan
    displayActionPlan(healthAnalysis ? healthAnalysis.summary.top_recommendations : [], dryEye.risk_level);

    // Display health cards
    if (healthAnalysis) {
        displayHealthCards(healthAnalysis.basic_reports, healthAnalysis.advanced_reports || []);
    }

    // Show dashboard
    document.getElementById('assessment-form').classList.add('hidden');
    document.getElementById('results-section').classList.remove('hidden');
    document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
}

// ===== Risk Gauge =====
function updateRiskGauge(probability, riskLevel) {
    const percentage = Math.round(probability * 100);

    // Update percentage display
    document.getElementById('gauge-percentage').textContent = percentage + '%';
    document.getElementById('gauge-label').textContent = riskLevel;

    // Animate needle
    const needle = document.getElementById('gauge-needle');
    const angle = -90 + (probability * 180);

    setTimeout(function () {
        needle.style.transform = 'rotate(' + angle + 'deg)';
    }, 100);

    // Animate arc
    const arc = document.getElementById('gauge-arc');
    const arcLength = 251.2;
    const dashOffset = arcLength * (1 - probability);

    setTimeout(function () {
        arc.style.strokeDashoffset = dashOffset;
    }, 100);
}

// ===== Distribution Chart =====
function drawDistributionChart(probability, percentile) {
    const canvas = document.getElementById('distribution-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw bell curve
    ctx.beginPath();
    ctx.moveTo(0, height - 10);

    const points = [];
    for (let x = 0; x <= width; x++) {
        const normalX = (x / width) * 6 - 3;
        const y = Math.exp(-0.5 * normalX * normalX) / Math.sqrt(2 * Math.PI);
        const scaledY = height - 10 - (y * (height - 30) * 2.5);
        points.push({ x: x, y: scaledY });
    }

    // Fill area under curve
    ctx.beginPath();
    ctx.moveTo(0, height - 10);
    points.forEach(function (point) {
        ctx.lineTo(point.x, point.y);
    });
    ctx.lineTo(width, height - 10);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(61, 90, 128, 0.3)');
    gradient.addColorStop(1, 'rgba(61, 90, 128, 0.05)');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw curve line
    ctx.beginPath();
    points.forEach(function (point, index) {
        if (index === 0) {
            ctx.moveTo(point.x, point.y);
        } else {
            ctx.lineTo(point.x, point.y);
        }
    });
    ctx.strokeStyle = '#3d5a80';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw user position marker
    const userX = (probability * width);
    const userNormalX = (userX / width) * 6 - 3;
    const userY = Math.exp(-0.5 * userNormalX * userNormalX) / Math.sqrt(2 * Math.PI);
    const userScaledY = height - 10 - (userY * (height - 30) * 2.5);

    // Vertical line
    ctx.beginPath();
    ctx.moveTo(userX, height - 10);
    ctx.lineTo(userX, userScaledY);
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // User marker circle
    ctx.beginPath();
    ctx.arc(userX, userScaledY, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#dc2626';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label "You"
    ctx.font = '600 11px Inter, sans-serif';
    ctx.fillStyle = '#dc2626';
    ctx.textAlign = 'center';
    ctx.fillText('You', userX, userScaledY - 12);

    // X-axis labels
    ctx.font = '500 10px Inter, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText('0', 20, height - 2);
    ctx.fillText('Risk Score', width / 2, height - 2);
    ctx.fillText('100', width - 20, height - 2);
}

// ===== Risk Drivers =====
function displayRiskDrivers(riskFactors) {
    const container = document.getElementById('risk-drivers-list');
    container.innerHTML = '';

    const factors = riskFactors.length > 0 ? riskFactors.slice(0, 4) : [
        { name: 'Screen Time', impact: 'medium' },
        { name: 'Sleep Quality', impact: 'low' },
        { name: 'Stress Level', impact: 'low' }
    ];

    factors.forEach(function (factor) {
        const item = document.createElement('div');
        item.className = 'risk-driver-item';

        item.innerHTML =
            '<span class="risk-driver-name">' + factor.name + '</span>' +
            '<div class="risk-driver-bar-container">' +
            '<div class="risk-driver-bar ' + factor.impact + '"></div>' +
            '</div>' +
            '<span class="risk-driver-level ' + factor.impact + '">' +
            factor.impact.charAt(0).toUpperCase() + factor.impact.slice(1) +
            '</span>';

        container.appendChild(item);
    });

    // Update main factor
    if (factors.length > 0) {
        document.getElementById('main-factor-value').textContent =
            factors[0].name + ' is the main contributing factor';
    }
}

// ===== Symptoms Comparison =====
function displaySymptoms(userData, probability) {
    const basePercentages = {
        strain: Math.round(40 + probability * 50),
        dryness: Math.round(30 + probability * 40),
        redness: Math.round(20 + probability * 35)
    };

    // Update strain
    setTimeout(function () {
        document.getElementById('symptom-strain').style.width = basePercentages.strain + '%';
        document.getElementById('symptom-strain-value').textContent = basePercentages.strain + '%';
        if (userData.has_eye_strain) {
            document.getElementById('symptom-strain-you').textContent = 'You';
        }
    }, 200);

    // Update dryness
    setTimeout(function () {
        document.getElementById('symptom-dryness').style.width = basePercentages.dryness + '%';
        document.getElementById('symptom-dryness-value').textContent = basePercentages.dryness + '%';
        if (userData.has_dryness) {
            document.getElementById('symptom-dryness-you').textContent = 'You';
        }
    }, 400);

    // Update redness
    setTimeout(function () {
        document.getElementById('symptom-redness').style.width = basePercentages.redness + '%';
        document.getElementById('symptom-redness-value').textContent = basePercentages.redness + '%';
        if (userData.has_redness) {
            document.getElementById('symptom-redness-you').textContent = 'You';
        }
    }, 600);
}

// ===== Action Plan =====
function displayActionPlan(recommendations, riskLevel) {
    const container = document.getElementById('action-list');
    container.innerHTML = '';

    let actions = recommendations && recommendations.length > 0
        ? recommendations
        : getDefaultActions(riskLevel);

    actions.slice(0, 5).forEach(function (action, index) {
        const item = document.createElement('div');
        item.className = 'action-item';

        item.innerHTML =
            '<span class="action-number">' + (index + 1) + '</span>' +
            '<span class="action-text">' + action + '</span>';

        container.appendChild(item);
    });
}

function getDefaultActions(riskLevel) {
    const highRiskActions = [
        'Schedule an eye examination with an ophthalmologist',
        'Reduce screen time to less than 6 hours per day',
        'Use artificial tears or lubricating eye drops',
        'Practice the 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds',
        'Ensure adequate hydration by drinking 8 glasses of water daily'
    ];

    const moderateRiskActions = [
        'Consider using a humidifier in your workspace',
        'Take regular breaks from screen use every 30 minutes',
        'Adjust screen brightness and position to reduce eye strain',
        'Improve sleep quality by maintaining a consistent sleep schedule',
        'Increase intake of omega-3 fatty acids through diet or supplements'
    ];

    const lowRiskActions = [
        'Maintain your current healthy eye care habits',
        'Continue regular eye check-ups annually',
        'Keep screen distance at arm\'s length',
        'Ensure proper lighting when using devices',
        'Stay hydrated throughout the day'
    ];

    if (riskLevel === 'Very High Risk' || riskLevel === 'High Risk') {
        return highRiskActions;
    } else if (riskLevel === 'Moderate Risk') {
        return moderateRiskActions;
    }
    return lowRiskActions;
}

// ===== Health Cards =====
function displayHealthCards(basicReports, advancedReports) {
    const container = document.getElementById('health-cards');
    container.innerHTML = '';

    const allReports = basicReports.concat(advancedReports);

    allReports.forEach(function (report) {
        const card = createHealthCard(report);
        container.appendChild(card);
    });
}

function createHealthCard(report) {
    const card = document.createElement('div');
    card.className = 'health-card';

    const statusText = getStatusText(report.status);

    card.innerHTML =
        '<div class="health-card-header">' +
        '<span class="health-card-name">' + report.name + '</span>' +
        '<span class="health-card-status ' + report.status + '">' + statusText + '</span>' +
        '</div>' +
        '<div class="health-card-value">' + report.value + '</div>' +
        '<div class="health-card-message">' + report.message + '</div>';

    return card;
}

function getStatusText(status) {
    switch (status) {
        case 'good': return 'Good';
        case 'warning': return 'Warning';
        case 'danger': return 'Danger';
        default: return 'Unknown';
    }
}

// ===== Utility Functions =====
function resetButton() {
    const submitBtn = document.querySelector('.form-actions .btn-primary');
    if (submitBtn) {
        submitBtn.textContent = 'Check My Health';
        submitBtn.disabled = false;
    }
}

function resetAssessment() {
    document.getElementById('assessment-form').classList.remove('hidden');
    document.getElementById('results-section').classList.add('hidden');
    document.getElementById('assessment-form').reset();

    const content = document.getElementById('optional-content');
    const icon = document.getElementById('expand-icon');
    if (content) content.classList.remove('show');
    if (icon) icon.classList.remove('expanded');

    // Reset gauge
    const needle = document.getElementById('gauge-needle');
    if (needle) needle.style.transform = 'rotate(-90deg)';

    const arc = document.getElementById('gauge-arc');
    if (arc) arc.style.strokeDashoffset = '251.2';

    // Reset symptom bars
    document.getElementById('symptom-strain').style.width = '0%';
    document.getElementById('symptom-dryness').style.width = '0%';
    document.getElementById('symptom-redness').style.width = '0%';

    document.querySelector('.assessment-section').scrollIntoView({ behavior: 'smooth' });
}

function showError(message) {
    resetButton();
    alert('Error: ' + message);
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', function () {
    connectWebSocket();

    const form = document.getElementById('assessment-form');
    if (form) {
        form.addEventListener('submit', submitAssessment);
    }
});
