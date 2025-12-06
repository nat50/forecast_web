# ForecastPro - Business Analytics & Forecasting Platform

A professional web platform for data analysis, demand forecasting, and visualization.

![Preview](static/preview.png)

## Features

- 📊 **Data Warehouse** - Manage and explore your historical data
- 🔮 **AI Forecasting** - Generate predictions (plug in your own models)
- 📈 **Visualizations** - Bar, line, and area charts
- 🎨 **Dashboard Builder** - Drag-and-drop custom dashboards

## Quick Start

### 1. Install Dependencies

```bash
cd e:\forecast_web
pip install -r requirements.txt
```

### 2. Run the Server

```bash
python server.py --server-ip 0.0.0.0 --server-port 9000
```

### 3. Access the Platform

Open in browser: `http://<your-pc-ip>:9000`

For example: `http://192.168.1.100:9000`

## Command Line Options

| Option | Default | Description |
|--------|---------|-------------|
| `--server-ip` | `0.0.0.0` | Server IP (0.0.0.0 = all interfaces) |
| `--server-port` | `9000` | Server port |

## Project Structure

```
forecast_web/
├── server.py          # Python server (HTTP + WebSocket)
├── mock_data.py       # Sample data for charts
├── requirements.txt   # Python dependencies
├── README.md          # This file
└── static/            # Frontend files
    ├── index.html     # Main HTML page
    ├── css/style.css  # Styles (pastel cute theme)
    └── js/app.js      # JavaScript application
```

## AI Model Integration

To add your own forecasting models:

1. Open `server.py`
2. Find the `handle_websocket()` function
3. Replace `get_forecast_data()` with your model:

```python
elif action == "get_forecast":
    # Replace this with your AI model
    params = data.get("params", {})
    prediction = your_ai_model.predict(params)
    response = {
        "action": "forecast",
        "data": prediction
    }
```

## Tech Stack

- **Backend**: Python + aiohttp + websockets
- **Frontend**: Vanilla HTML/CSS/JS + Chart.js
- **Theme**: Pastel cute (sky blue & light pink)

## License

MIT
