/**
 * DryEye Predict - AI-Powered Eye Health Assessment
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

    ws.onopen = () => {
        console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
        const response = JSON.parse(event.data);
        handleWebSocketMessage(response);
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
        console.log('WebSocket disconnected, reconnecting...');
        setTimeout(connectWebSocket, 3000);
    };
}

function sendMessage(action, data = {}) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action, data }));
    } else {
        console.error('WebSocket not connected');
        showError('Connection error. Please refresh the page.');
    }
}

function handleWebSocketMessage(response) {
    switch (response.action) {
        case 'prediction_result':
            displayResults(response.data);
            break;
        case 'error':
            showError(response.data.message);
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
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== Form Handling =====
function collectFormData() {
    const form = document.getElementById('assessment-form');
    const formData = new FormData(form);
    const data = {};
    
    // Collect all form fields
    formData.forEach((value, key) => {
        // Skip empty values - they will be filled with defaults in the model
        if (value === '' || value === null) {
            return;
        }
        
        // Convert numeric fields
        if (['Age', 'Height', 'Weight', 'Heart rate', 'Sleep duration', 
             'Sleep quality', 'Stress level', 'Daily steps', 'Physical activity',
             'Average screen time'].includes(key)) {
            data[key] = parseFloat(value);
        } else {
            data[key] = value;
        }
    });
    
    // Create Blood pressure string from systolic/diastolic if provided
    const systolic = document.getElementById('bp-systolic').value;
    const diastolic = document.getElementById('bp-diastolic').value;
    
    if (systolic && diastolic) {
        data['Blood pressure'] = `${systolic}/${diastolic}`;
    } else if (systolic || diastolic) {
        // If only one is provided, use default for the other
        data['Blood pressure'] = `${systolic || '120'}/${diastolic || '80'}`;
    }
    // If neither provided, don't include - model will use default
    
    // Remove the separate BP fields (not needed for model)
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
    
    // Show loading state
    const submitBtn = document.querySelector('.form-actions .btn-primary');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Analyzing...';
    submitBtn.disabled = true;
    
    // Send prediction request
    sendMessage('predict_dry_eye', data);
    
    // Reset button after timeout (in case of error)
    setTimeout(() => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }, 10000);
}

// ===== Results Display =====
function displayResults(data) {
    // Reset button
    const submitBtn = document.querySelector('.form-actions .btn-primary');
    submitBtn.textContent = 'Get My Risk Assessment';
    submitBtn.disabled = false;
    
    // Update result values
    document.getElementById('result-prediction').textContent = data.prediction;
    document.getElementById('result-risk').textContent = data.risk_level;
    
    // Update probability
    const probability = (data.probability * 100).toFixed(1);
    document.getElementById('result-probability').textContent = `${probability}%`;
    
    // Animate probability bar
    const probabilityFill = document.getElementById('probability-fill');
    probabilityFill.style.width = '0%';
    setTimeout(() => {
        probabilityFill.style.width = `${probability}%`;
    }, 100);
    
    // Set risk level color
    const riskBadge = document.getElementById('result-risk');
    riskBadge.className = 'result-value risk-badge';
    
    if (data.risk_level === 'Low Risk') {
        riskBadge.classList.add('risk-low');
        probabilityFill.className = 'probability-fill risk-low';
    } else if (data.risk_level === 'Moderate Risk') {
        riskBadge.classList.add('risk-moderate');
        probabilityFill.className = 'probability-fill risk-moderate';
    } else if (data.risk_level === 'High Risk') {
        riskBadge.classList.add('risk-high');
        probabilityFill.className = 'probability-fill risk-high';
    } else {
        riskBadge.classList.add('risk-very-high');
        probabilityFill.className = 'probability-fill risk-very-high';
    }
    
    // Hide form and show results
    document.getElementById('assessment-form').classList.add('hidden');
    document.getElementById('results-section').classList.remove('hidden');
    
    // Scroll to results
    document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
}

function resetAssessment() {
    // Show form and hide results
    document.getElementById('assessment-form').classList.remove('hidden');
    document.getElementById('results-section').classList.add('hidden');
    
    // Reset form
    document.getElementById('assessment-form').reset();
    
    // Scroll to top of form
    document.querySelector('.assessment-section').scrollIntoView({ behavior: 'smooth' });
}

function showError(message) {
    // Reset button
    const submitBtn = document.querySelector('.form-actions .btn-primary');
    if (submitBtn) {
        submitBtn.textContent = 'Get My Risk Assessment';
        submitBtn.disabled = false;
    }
    
    alert(`Error: ${message}`);
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    connectWebSocket();
    
    // Setup form submission
    const form = document.getElementById('assessment-form');
    if (form) {
        form.addEventListener('submit', submitAssessment);
    }
});
