# Healthcatchers - Health Assessment Platform

Web application for comprehensive health assessment including dry eye disease prediction, BMI analysis, blood pressure monitoring, sleep quality, and lifestyle evaluation.

## Features

- **Multi-health Assessment**: One form, multiple health reports
- **AI-powered Dry Eye Prediction**: XGBoost model trained on 20,000+ samples
- **BMI Analysis**: Body mass index calculation and classification
- **Blood Pressure Monitoring**: Hypertension risk detection
- **Sleep Health Evaluation**: Sleep duration and quality assessment
- **Lifestyle Analysis**: Activity, habits, and risk factor scoring
- **Real-time Results**: WebSocket-based instant feedback

## Project Structure

```
forecast_web/
├── server.py                    # Main web server
├── requirements.txt             # Python dependencies
├── services/
│   ├── __init__.py
│   └── health_analyzer.py       # Multi-health analysis service
├── model/
│   ├── predict_explain.py       # Dry eye prediction API
│   ├── xgboost_dry_eye_model.joblib
│   └── Dry Eye Disease/         # Training dataset
└── static/
    ├── index.html               # Main SPA
    ├── css/style.css            # Styles
    └── js/app.js                # Frontend logic
```

## Quick Start

**Install dependencies:**
```bash
pip install -r requirements.txt
```

**Run the application:**
```bash
python server.py
```

**With virtual environment:**
```bash
.\venv\Scripts\python.exe server.py
```

Open browser: `http://127.0.0.1:9000`

## Health Reports

### Basic Reports (Required Fields)
- **BMI**: Weight status classification
- **Sleep**: Duration and quality assessment
- **Stress**: Mental health indicator
- **Dry Eye**: AI prediction with probability

### Advanced Reports (Optional Fields)
- **Blood Pressure**: Hypertension risk levels
- **Cardiovascular**: Heart rate analysis
- **Advanced Sleep**: Sleep disorders detection
- **Lifestyle**: Activity and habits scoring

## Technology Stack

- **Backend**: Python, aiohttp, WebSocket
- **ML Model**: XGBoost, scikit-learn, SHAP
- **Frontend**: HTML5, CSS3, JavaScript

## Medical Disclaimer

This AI-powered assessment is for **reference purposes only** and should not be used as a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for any health concerns.

## License

MIT License - Free for educational and research purposes
