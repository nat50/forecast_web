"""
Mock data generator for charts and tables.
Replace these with real data from your AI models later.
"""

import random
from datetime import datetime, timedelta


def get_sales_records():
    """Sample sales records for the Data Warehouse page."""
    regions = ["North America", "South America", "Europe", "Asia", "Africa"]
    sources = ["CSV Import", "Database Sync", "Excel Upload", "API Integration"]
    statuses = ["Clean", "Clean", "Clean", "Needs Review"]  # 75% clean
    
    records = []
    base_date = datetime(2024, 1, 1)
    
    for i in range(12):
        start_date = base_date + timedelta(days=i * 90)
        end_date = start_date + timedelta(days=89)
        
        records.append({
            "id": i + 1,
            "dateRange": f"{start_date.strftime('%b %Y')} - {end_date.strftime('%b %Y')}",
            "salesVolume": random.randint(150000, 350000),
            "records": random.randint(800, 2000),
            "status": random.choice(statuses),
            "source": random.choice(sources),
            "region": random.choice(regions),
            "lastUpdated": (datetime.now() - timedelta(days=random.randint(1, 90))).strftime("%Y-%m-%d")
        })
    
    return records


def get_data_health():
    """Data health metrics for the warehouse overview."""
    return {
        "score": random.randint(82, 95),
        "totalRecords": random.randint(5000, 8000),
        "totalRevenue": round(random.uniform(10, 15), 1)  # in millions
    }


def get_forecast_data():
    """Generate mock forecast data for charts."""
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    
    # Historical data (first 6 months)
    historical = []
    base_value = 250000
    for i in range(6):
        value = base_value + random.randint(-30000, 50000) + (i * 15000)
        historical.append({
            "month": months[i],
            "value": value,
            "type": "historical"
        })
    
    # Forecast data (next 6 months)
    forecast = []
    last_value = historical[-1]["value"]
    for i in range(6, 12):
        value = last_value + random.randint(10000, 40000)
        last_value = value
        forecast.append({
            "month": months[i],
            "value": value,
            "lower": value - random.randint(20000, 40000),
            "upper": value + random.randint(20000, 40000),
            "type": "forecast"
        })
    
    return {
        "historical": historical,
        "forecast": forecast,
        "accuracy": round(random.uniform(91, 97), 1),
        "confidence": random.randint(85, 95),
        "period": "6 months"
    }


def get_dashboard_widgets():
    """Default widgets for the dashboard builder."""
    return [
        {
            "id": "revenue",
            "type": "bar",
            "title": "Revenue Overview",
            "data": [
                {"label": "Jan", "value": 45000},
                {"label": "Feb", "value": 52000},
                {"label": "Mar", "value": 48000},
                {"label": "Apr", "value": 61000},
                {"label": "May", "value": 55000},
                {"label": "Jun", "value": 67000},
            ]
        },
        {
            "id": "products",
            "type": "pie",
            "title": "Top Products",
            "data": [
                {"label": "Product A", "value": 35},
                {"label": "Product B", "value": 28},
                {"label": "Product C", "value": 22},
                {"label": "Product D", "value": 15},
            ]
        },
        {
            "id": "trends",
            "type": "line",
            "title": "Sales Trends",
            "data": [
                {"label": "Week 1", "value": 12000},
                {"label": "Week 2", "value": 15000},
                {"label": "Week 3", "value": 13500},
                {"label": "Week 4", "value": 18000},
            ]
        }
    ]


def get_chart_data(chart_type="bar"):
    """Generate data for different chart types."""
    labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    
    return {
        "labels": labels,
        "datasets": [{
            "label": "Sales",
            "data": [random.randint(1000, 5000) for _ in labels],
            "type": chart_type
        }]
    }
