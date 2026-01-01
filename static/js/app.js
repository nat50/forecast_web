/**
 * Healthcatchers - Health Assessment Platform
 * Main JavaScript Application
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
        console.log('Connected to Healthcatchers');
    };

    ws.onmessage = function (event) {
        const response = JSON.parse(event.data);
        handleWebSocketMessage(response);
    };

    ws.onerror = function (error) {
        console.error('WebSocket error:', error);
    };

    ws.onclose = function () {
        console.log('Disconnected, reconnecting...');
        setTimeout(connectWebSocket, 3000);
    };
}

function sendMessage(action, data) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: action, data: data }));
    } else {
        console.error('WebSocket not connected');
        showError('Connection error. Please reload the page.');
    }
}

function handleWebSocketMessage(response) {
    switch (response.action) {
        case 'health_result':
            displayHealthResults(response.data);
            break;
        case 'prediction_result':
            displayDryEyeOnly(response.data);
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

    const systolic = document.getElementById('bp-systolic');
    const diastolic = document.getElementById('bp-diastolic');

    // Only process if the old separate fields exist (backwards compatibility)
    if (systolic && diastolic && systolic.value && diastolic.value) {
        data['Blood pressure'] = systolic.value + '/' + diastolic.value;
    }

    delete data['BP_Systolic'];
    delete data['BP_Diastolic'];

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

// ===== Results Display =====
function displayHealthResults(data) {
    resetButton();

    const healthAnalysis = data.health_analysis;
    const dryEye = data.dry_eye;

    displaySummary(healthAnalysis.summary);
    displayHealthCards(healthAnalysis.basic_reports, healthAnalysis.advanced_reports);
    displayDryEye(dryEye);
    displayRecommendations(healthAnalysis.summary.top_recommendations);

    document.getElementById('assessment-form').classList.add('hidden');
    document.getElementById('results-section').classList.remove('hidden');
    document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
}

function displaySummary(summary) {
    const summaryMessage = document.getElementById('summary-message');
    summaryMessage.textContent = summary.overall_message;
    summaryMessage.className = 'summary-value ' + summary.overall_status;
}

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

function displayDryEye(dryEye) {
    document.getElementById('dry-eye-prediction').textContent =
        dryEye.prediction === 'Dry Eye Disease' ? 'Dry Eye Risk Detected' : 'No Dry Eye Risk';

    const riskBadge = document.getElementById('dry-eye-risk');
    riskBadge.textContent = dryEye.risk_level;
    riskBadge.className = 'result-value risk-badge ' + getRiskClass(dryEye.risk_level);

    const probability = (dryEye.probability * 100).toFixed(1);
    document.getElementById('dry-eye-probability').textContent = probability + '%';

    const probabilityFill = document.getElementById('probability-fill');
    probabilityFill.style.width = '0%';
    probabilityFill.className = 'probability-fill ' + getRiskClass(dryEye.risk_level);

    setTimeout(function () {
        probabilityFill.style.width = probability + '%';
    }, 100);
}

function getRiskClass(level) {
    switch (level) {
        case 'Low Risk': return 'risk-low';
        case 'Moderate Risk': return 'risk-moderate';
        case 'High Risk': return 'risk-high';
        case 'Very High Risk': return 'risk-very-high';
        default: return '';
    }
}

function displayRecommendations(recommendations) {
    const list = document.getElementById('recommendations-list');
    list.innerHTML = '';

    if (!recommendations || recommendations.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'Maintain your current healthy lifestyle.';
        list.appendChild(li);
        return;
    }

    recommendations.forEach(function (rec) {
        const li = document.createElement('li');
        li.textContent = rec;
        list.appendChild(li);
    });
}

function displayDryEyeOnly(dryEye) {
    resetButton();
    displayDryEye(dryEye);

    document.getElementById('assessment-form').classList.add('hidden');
    document.getElementById('results-section').classList.remove('hidden');
    document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
}

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
