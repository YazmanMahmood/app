"""
Drone Control System
Provides both web-based control interface and autonomous operation capabilities.
"""

import threading
import time
import subprocess
import os
import webbrowser
import requests
import socket
import logging
import asyncio
import websockets
import json
import random
from typing import Optional
from flask import Flask

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('drone.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Global state variables
DRONE_STATE = {
    'Battery': 100,
    'Status': 'Connected',
    'Altitude': 0,
    'Signal': 100,
    'Speed': 0,
    'Heading': 0,
    'Location': {'lat': 0, 'lng': 0}  # Drone's current location
}

class InternetMonitor:
    """Monitors internet connectivity."""
    @staticmethod
    def check_connection() -> bool:
        """Check internet connectivity by pinging Google's DNS."""
        try:
            result = subprocess.run(
                ['ping', '-c', '1', '8.8.8.8'],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=3
            )
            return result.returncode == 0
        except (subprocess.TimeoutExpired, subprocess.SubprocessError):
            return False

async def update_drone_state():
    """Update drone state with random values"""
    while True:
        DRONE_STATE['Battery'] = max(0, min(100, DRONE_STATE['Battery'] + random.randint(-5, 3)))
        DRONE_STATE['Altitude'] = max(0, min(100, DRONE_STATE['Altitude'] + random.randint(-2, 2)))
        DRONE_STATE['Signal'] = max(0, min(100, DRONE_STATE['Signal'] + random.randint(-10, 10)))
        DRONE_STATE['Speed'] = max(0, min(30, DRONE_STATE['Speed'] + random.randint(-3, 3)))
        DRONE_STATE['Heading'] = (DRONE_STATE['Heading'] + random.randint(-10, 10)) % 360
        DRONE_STATE['Location']['lat'] += random.uniform(-0.0001, 0.0001)
        DRONE_STATE['Location']['lng'] += random.uniform(-0.0001, 0.0001)
        await asyncio.sleep(1)

async def websocket_handler(websocket):
    """Handle WebSocket connections"""
    try:
        logger.info(f"New client connected from {websocket.remote_address}")
        while True:
            # Send current drone state
            await websocket.send(json.dumps(DRONE_STATE))
            await asyncio.sleep(1)
    except websockets.exceptions.ConnectionClosed:
        logger.info(f"Client disconnected: {websocket.remote_address}")
    except Exception as e:
        logger.error(f"Error in handler: {e}")

class DroneSystem:
    """Main system to manage drone operations."""
    def __init__(self):
        self.internet_monitor = InternetMonitor()
        self._shutdown_flag = False
        self.web_app_process = None
        self.port = 5173  # Correct port for Vite
        self.websocket_ports = [8765, 8766, 8767, 8768]  # List of potential WebSocket ports
        self.websocket_port = None
        self.web_app_dir = os.path.join(os.getcwd(), 'project')
        self.update_interval = 1  # seconds
        self.logger = logging.getLogger(__name__)

    def start_web_app(self) -> bool:
        """Start the React web application."""
        try:
            if not os.path.exists(self.web_app_dir):
                logger.error(f"Project directory not found: {self.web_app_dir}")
                return False

            os.chdir(self.web_app_dir)
            logger.info(f"Changed to directory: {self.web_app_dir}")

            self.web_app_process = subprocess.Popen(
                'npm run dev',
                shell=True,
                cwd=self.web_app_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )

            time.sleep(5)  # Wait for server startup
            webbrowser.open(f'http://localhost:{self.port}')
            logger.info(f"Web application started on port {self.port}")
            return True

        except Exception as e:
            logger.error(f"Failed to start web application: {str(e)}")
            return False

    def display_state(self):
        """Display drone state in terminal"""
        while not self._shutdown_flag:
            os.system('cls' if os.name == 'nt' else 'clear')
            print("\n=== Drone Metrics ===")
            for key, value in DRONE_STATE.items():
                print(f"{key}: {value}")
            print("===================\n")
            time.sleep(0.5)

    def shutdown(self):
        """Gracefully shutdown the system."""
        logger.info("Initiating system shutdown...")
        self._shutdown_flag = True
        if self.web_app_process:
            self.web_app_process.terminate()
            logger.info("Terminated web application process")

    async def find_available_port(self):
        """Find an available port for WebSocket server."""
        for port in self.websocket_ports:
            try:
                # Try to create a test server to check port availability
                test_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                test_socket.bind(('localhost', port))
                test_socket.close()
                self.websocket_port = port
                return True
            except OSError:
                continue
        return False

    async def run(self):
        """Main execution flow."""
        try:
            if not self.start_web_app():
                logger.error("Failed to start web application")
                return

            # Find available WebSocket port
            if not await self.find_available_port():
                logger.error("No available ports for WebSocket server")
                self.shutdown()
                return

            # Start the state update task
            asyncio.create_task(update_drone_state())
            
            # Start WebSocket server
            async with websockets.serve(websocket_handler, "localhost", self.websocket_port):
                logger.info(f"WebSocket server started on ws://localhost:{self.websocket_port}")
                
                # Start display thread
                threading.Thread(target=self.display_state, daemon=True).start()
                
                # Run forever
                await asyncio.Future()

        except KeyboardInterrupt:
            logger.info("Received shutdown signal")
            self.shutdown()
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            self.shutdown()

def main():
    """Application entry point."""
    drone_system = DroneSystem()
    asyncio.run(drone_system.run())

if __name__ == "__main__":
    main()