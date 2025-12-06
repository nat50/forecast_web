"""
Business Analytics & Forecasting Platform
Single Python server serving static files + WebSocket API.

Usage:
    python server.py --server-ip 0.0.0.0 --server-port 8765

AI Integration:
    Replace the mock handlers in handle_websocket() with your models.
"""

import argparse
import asyncio
import json
import os
from pathlib import Path

from aiohttp import web
import aiofiles

# Import mock data (replace with your AI models later)
from mock_data import (
    get_sales_records,
    get_data_health,
    get_forecast_data,
    get_dashboard_widgets,
    get_chart_data
)


# Get the directory where this script is located
BASE_DIR = Path(__file__).parent
STATIC_DIR = BASE_DIR / "static"


async def handle_index(request):
    """Serve the main index.html page."""
    return web.FileResponse(STATIC_DIR / "index.html")


async def handle_static(request):
    """Serve static files (CSS, JS, images)."""
    file_path = STATIC_DIR / request.match_info["path"]
    
    if file_path.exists() and file_path.is_file():
        return web.FileResponse(file_path)
    
    return web.Response(status=404, text="File not found")


async def handle_websocket(request):
    """
    WebSocket handler for real-time data communication.
    
    AI Integration Point:
    Replace the mock data calls below with your actual AI model predictions.
    """
    ws = web.WebSocketResponse()
    await ws.prepare(request)
    
    print("WebSocket client connected")
    
    async for msg in ws:
        if msg.type == web.WSMsgType.TEXT:
            try:
                data = json.loads(msg.data)
                action = data.get("action", "")
                
                # Handle different actions
                if action == "get_sales_records":
                    response = {
                        "action": "sales_records",
                        "data": get_sales_records()
                    }
                
                elif action == "get_data_health":
                    response = {
                        "action": "data_health",
                        "data": get_data_health()
                    }
                
                elif action == "get_forecast":
                    # AI Integration: Replace get_forecast_data() with your model
                    params = data.get("params", {})
                    response = {
                        "action": "forecast",
                        "data": get_forecast_data()
                    }
                
                elif action == "get_dashboard_widgets":
                    response = {
                        "action": "dashboard_widgets",
                        "data": get_dashboard_widgets()
                    }
                
                elif action == "get_chart_data":
                    chart_type = data.get("chartType", "bar")
                    response = {
                        "action": "chart_data",
                        "data": get_chart_data(chart_type)
                    }
                
                elif action == "upload_data":
                    # Handle file upload data
                    file_data = data.get("fileData", "")
                    response = {
                        "action": "upload_complete",
                        "data": {"success": True, "message": "Data received"}
                    }
                
                else:
                    response = {
                        "action": "error",
                        "data": {"message": f"Unknown action: {action}"}
                    }
                
                await ws.send_json(response)
                
            except json.JSONDecodeError:
                await ws.send_json({
                    "action": "error",
                    "data": {"message": "Invalid JSON"}
                })
        
        elif msg.type == web.WSMsgType.ERROR:
            print(f"WebSocket error: {ws.exception()}")
    
    print("WebSocket client disconnected")
    return ws


def create_app():
    """Create and configure the aiohttp application."""
    app = web.Application()
    
    # Routes
    app.router.add_get("/", handle_index)
    app.router.add_get("/ws", handle_websocket)
    app.router.add_get("/{path:.*}", handle_static)
    
    return app


def main():
    """Main entry point with CLI argument parsing."""
    parser = argparse.ArgumentParser(
        description="Business Analytics & Forecasting Platform Server"
    )
    parser.add_argument(
        "--server-ip",
        default="0.0.0.0",
        help="Server IP address (default: 0.0.0.0 for all interfaces)"
    )
    parser.add_argument(
        "--server-port",
        type=int,
        default=9000,
        help="Server port (default: 9000)"
    )
    
    args = parser.parse_args()
    
    # Ensure static directory exists
    if not STATIC_DIR.exists():
        print(f"Warning: Static directory not found at {STATIC_DIR}")
        print("Creating static directory...")
        STATIC_DIR.mkdir(parents=True, exist_ok=True)
    
    app = create_app()
    
    print(f"\n{'='*50}")
    print("  Business Analytics & Forecasting Platform")
    print(f"{'='*50}")
    print(f"  Server: http://{args.server_ip}:{args.server_port}")
    print(f"  WebSocket: ws://{args.server_ip}:{args.server_port}/ws")
    print(f"  Static files: {STATIC_DIR}")
    print(f"{'='*50}\n")
    
    web.run_app(app, host=args.server_ip, port=args.server_port)


if __name__ == "__main__":
    main()
