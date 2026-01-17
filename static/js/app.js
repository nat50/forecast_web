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
        case 'recommendation_details':
            handleRecommendationDetails(response.data);
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

    // Initialize feedback stars
    initFeedbackRating();


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

    // Update explanation text
    const explanationEl = document.getElementById('gauge-explanation');
    if (explanationEl) {
        let explanation = 'This result shows a ' + percentage + '% risk of dry eye, ';
        if (percentage > 40) {
            explanation += 'indicating that your eyes may be under strain.';
        } else {
            explanation += 'indicating that your eyes are in a healthy condition.';
        }
        explanationEl.textContent = explanation;
        console.log('Updated explanation:', explanation);
    } else {
        console.error('Explanation element not found!');
    }

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
        document.getElementById('main-factor-value').textContent = 'Based on the current assessment, ' +
            factors[0].name + ' is associated with increased risk.';
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

        // Add explanation text
        const explanationContainer = document.getElementById('symptoms-explanation');
        explanationContainer.innerHTML = '';
        
        const parts = [];
        if (userData.has_eye_strain) {
            parts.push(basePercentages.strain + '% of people suffering from Eye Strain');
        }
        if (userData.has_dryness) {
            parts.push(basePercentages.dryness + '% of people suffering from Dryness');
        }
        if (userData.has_redness) {
            parts.push(basePercentages.redness + '% of people suffering from Redness');
        }

        if (parts.length > 0) {
            let text = 'You belong to the ';
            if (parts.length === 1) {
                text += parts[0] + '.';
            } else if (parts.length === 2) {
                text += parts[0] + ' and the ' + parts[1] + '.';
            } else {
                // 3 items
                text += parts[0] + ', the ' + parts[1] + ', and the ' + parts[2] + '.';
            }
            
            const p = document.createElement('p');
            p.textContent = text;
            explanationContainer.appendChild(p);
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
        item.onclick = function() { showRecommendationDetails(action); };
        item.title = "Click for detailed plan";

        item.innerHTML =
            '<span class="action-number">' + (index + 1) + '</span>' +
            '<span class="action-text">' + action + '</span>' +
            '<span style="margin-left:auto; color:var(--primary); font-size:0.8em;">Details &rarr;</span>';

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


// ===== Detailed Recommendations =====
function showRecommendationDetails(text) {
    const modal = document.getElementById('detail-modal');
    const title = document.getElementById('modal-title');
    const content = document.getElementById('modal-content-text');
    const resources = document.getElementById('modal-resources');
    
    // Show loading state
    modal.classList.add('show');
    title.textContent = 'Generating Plan...';
    content.textContent = 'Consulting AI for detailed instructions...';
    resources.innerHTML = '';
    
    // Send request
    const formData = collectFormData();
    sendMessage('get_recommendation_details', {
        recommendation: text,
        user_data: {
            age: formData.Age,
            screen_time: formData['Average screen time'],
            has_eye_strain: formData['Discomfort Eye-strain'] === 'Y',
            has_redness: formData['Redness in eye'] === 'Y',
            has_dryness: formData['Itchiness/Irritation in eye'] === 'Y'
        }
    });
}

function formatMarkdown(text) {
    if (!text) return '';
    
    // Escape HTML first to prevent XSS
    let html = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // Headers (### Header)
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold (**text**)
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    
    // Italic (*text*)
    html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

    // Bullet points (* Item)
    // First, handle unordered lists properly
    // We replace lines starting with * or - with <li>
    html = html.replace(/^[\*\-] (.*$)/gim, '<li>$1</li>');
    
    // Wrap consecutive <li> in <ul> (simple approximation)
    // A more robust way is to just let them be, but wrapping them looks better.
    // For simplicity, we can just replace newlines with <br> for non-list items.
    
    // Paragraphs / Line breaks
    html = html.replace(/\n\n/gim, '<br><br>');
    html = html.replace(/\n/gim, '<br>'); // Simple newline
    
    // Cleanup: </ul><ul> if we had proper list wrapping, but for now 
    // let's simple-list style it by adding a class to the container that handles bullets if they are <li>
    // Actually, just replacing * with &#8226; (bullet) and <br> might be safer if we don't fully parse ULs.
    // But let's try the <li> approach and wrap the whole content in a div that handles it? 
    // No, let's keep it simple:
    
    return html;
}

function handleRecommendationDetails(data) {
    const title = document.getElementById('modal-title');
    const content = document.getElementById('modal-content-text');
    const resources = document.getElementById('modal-resources');
    
    title.textContent = data.title;
    
    // Format content
    let formattedHTML = formatMarkdown(data.content);
    
    // Wrap lists if any (rough heuristic)
    // If we have <li>, we should ideally wrap them. 
    // Browser might handle orphan <li> but it's not valid.
    // Let's rely on standard list styling or just use bullet symbols.
    // Let's redo the list part to be safer:
    
    // Alternative List Strategy:
    // Replace * point with • point and <br>
    // formattedHTML = formattedHTML.replace(/<li>(.*?)<\/li>/gim, '• $1<br>');
    
    content.innerHTML = formattedHTML;
    
    // Add resources if available
    resources.innerHTML = '';
    if (data.resources && data.resources.length > 0) {
        const header = document.createElement('h4');
        header.textContent = 'Recommended Searches:';
        header.style.marginBottom = '10px';
        resources.appendChild(header);
        
        data.resources.forEach(function(query) {
            const link = document.createElement('a');
            link.href = 'https://www.google.com/search?q=' + encodeURIComponent(query);
            link.target = '_blank';
            link.className = 'resource-link';
            link.textContent = query;
            resources.appendChild(link);
        });
    }
}

// ===== Feedback Rating =====
function initFeedbackRating() {
    const stars = document.querySelectorAll(".star");
    const message = document.getElementById("feedback-message");

    if (!stars.length || !message) return;

    let selectedRating = 0;

    const feedbackTexts = {
        1: "😞 Sorry for the poor experience. Could you tell us what went wrong?",
        2: "😕 We appreciate your honesty. What can we improve?",
        3: "🙂 Thanks! The assessment was okay, but there's room to improve.",
        4: "😊 Great! We're glad you found this helpful.",
        5: "🌟 Awesome! Thank you for your support and trust."
    };

    stars.forEach(star => {
        star.addEventListener("mouseenter", () => {
            highlightStars(star.dataset.value);
            message.textContent = feedbackTexts[star.dataset.value];
        });

        star.addEventListener("mouseleave", () => {
            highlightStars(selectedRating);
            message.textContent = selectedRating
                ? feedbackTexts[selectedRating]
                : "Hover or click a star to rate";
        });

        star.addEventListener("click", () => {
            selectedRating = star.dataset.value;
            highlightStars(selectedRating);
            message.textContent = feedbackTexts[selectedRating];
        });
    });

    function highlightStars(rating) {
        stars.forEach(star => {
            star.classList.toggle("selected", star.dataset.value <= rating);
        });
    }
}

function closeModal() {
    document.getElementById('detail-modal').classList.remove('show');
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('detail-modal');
    if (event.target == modal) {
        closeModal();
    }
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', function () {
    connectWebSocket();

    const form = document.getElementById('assessment-form');
    if (form) {
        form.addEventListener('submit', submitAssessment);
    }
});


