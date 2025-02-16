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
from flask import Flask, Response
from pymavlink import mavutil
import cv2
import numpy as np
import sys
import re

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('drone.log', encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
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
    'LandingStation': 'Closed'
}

class DroneController:
    """Handles drone connection and commands."""
    def __init__(self, connection_string: str = 'udp:127.0.0.1:14550'):
        self.connection_string = connection_string
        self.vehicle = None

    def connect(self) -> bool:
        """Connect to the drone."""
        try:
            self.vehicle = mavutil.mavlink_connection(self.connection_string)
            self.vehicle.wait_heartbeat()
            logger.info(f"Connected to vehicle on: {self.connection_string}")
            DRONE_STATE['Status'] = 'Connected'
            return True
        except Exception as e:
            logger.error(f"Connection failed: {str(e)}")
            DRONE_STATE['Status'] = 'Disconnected'
            return False

    def close_connection(self):
        """Close the drone connection."""
        if self.vehicle:
            self.vehicle.close()
            logger.info("Vehicle connection closed")
            DRONE_STATE['Status'] = 'Disconnected'

    def arm(self):
        """Arm the drone."""
        if not self.vehicle:
            return False
        self.vehicle.mav.command_long_send(
            self.vehicle.target_system,
            self.vehicle.target_component,
            mavutil.mavlink.MAV_CMD_COMPONENT_ARM_DISARM,
            0, 1, 0, 0, 0, 0, 0, 0)

    def disarm(self):
        """Disarm the drone."""
        if not self.vehicle:
            return False
        self.vehicle.mav.command_long_send(
            self.vehicle.target_system,
            self.vehicle.target_component,
            mavutil.mavlink.MAV_CMD_COMPONENT_ARM_DISARM,
            0, 0, 0, 0, 0, 0, 0, 0)

async def update_drone_state():
    """Update drone state with random values"""
    while True:
        DRONE_STATE.update({
            'Battery': max(0, min(100, DRONE_STATE['Battery'] + random.randint(-5, 3))),
            'Altitude': max(0, min(100, DRONE_STATE['Altitude'] + random.randint(-2, 2))),
            'Signal': max(0, min(100, DRONE_STATE['Signal'] + random.randint(-10, 10))),
            'Speed': max(0, min(30, DRONE_STATE['Speed'] + random.randint(-3, 3))),
            'Heading': (DRONE_STATE['Heading'] + random.randint(-10, 10)) % 360,
            'LandingStation': random.choice(['Open', 'Closed'])
        })
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

class DroneSystem:
    """Main system to manage drone operations."""
    def __init__(self):
        self.drone_controller = DroneController()
        self.internet_monitor = InternetMonitor()
        self._shutdown_flag = False
        self.web_app_process = None
        self.available_ports = [5173, 3000, 3001, 3002]
        self.port = None
        self.websocket_ports = [8765, 8766, 8767, 8768]
        self.websocket_port = None
        self.web_app_dir = os.path.join(os.getcwd(), 'project')
        self.update_interval = 1
        self.logger = logging.getLogger(__name__)
        self.app = Flask(__name__)
        self.setup_routes()
        self.rtsp_url = 'rtsp://admin:admin123456@192.168.167.234:8554/profile0?tcp'
        self.flask_server = None
        self.clients = set()

    def setup_routes(self):
        """Setup Flask routes"""
        @self.app.route('/video_feed')
        def video_feed():
            return Response(self.generate_frames(),
                          mimetype='multipart/x-mixed-replace; boundary=frame')

    def generate_frames(self):
        """Generate camera frames"""
        cap = cv2.VideoCapture(self.rtsp_url)
        while True:
            success, frame = cap.read()
            if not success:
                break
            else:
                # Encode frame to JPEG
                ret, buffer = cv2.imencode('.jpg', frame)
                frame = buffer.tobytes()
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        cap.release()

    def find_available_web_port(self) -> Optional[int]:
        """Find an available port for the web application."""
        for port in self.available_ports:
            try:
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                    s.bind(('localhost', port))
                    return port
            except OSError:
                continue
        return None

    def start_web_app(self) -> bool:
        """Start the React web application."""
        try:
            if not os.path.exists(self.web_app_dir):
                logger.error(f"Project directory not found: {self.web_app_dir}")
                return False

            # Find available port
            self.port = self.find_available_web_port()
            if not self.port:
                logger.error("No available ports for web application")
                return False

            os.chdir(self.web_app_dir)
            logger.info(f"Changed to directory: {self.web_app_dir}")

            # First run npm run build
            logger.info("Running npm build...")
            build_process = subprocess.run(
                'npm run build',
                shell=True,
                cwd=self.web_app_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )

            if build_process.returncode != 0:
                logger.error(f"Build failed. stdout: {build_process.stdout}")
                logger.error(f"stderr: {build_process.stderr}")
                return False

            logger.info("Build completed successfully")

            # Start Flask server in a separate thread
            threading.Thread(target=lambda: self.app.run(host='0.0.0.0', port=5000, threaded=True), daemon=True).start()
            logger.info("Flask server started on port 5000")

            # Start the web app with specified port
            logger.info(f"Starting development server on port {self.port}...")
            self.web_app_process = subprocess.Popen(
                f'npm run dev -- --port {self.port}',  # Specify port here
                shell=True,
                cwd=self.web_app_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1,
                encoding='utf-8'
            )

            # Create a thread to read and log the output
            def log_output(pipe, log_level):
                for line in pipe:
                    line = line.strip()
                    # Remove ANSI escape sequences
                    line = re.sub(r'\x1b\[[0-9;]*[a-zA-Z]', '', line)
                    if log_level == "INFO":
                        logger.info(f"npm output: {line}")
                    else:
                        logger.error(f"npm error: {line}")

            stdout_thread = threading.Thread(
                target=log_output, 
                args=(self.web_app_process.stdout, "INFO"),
                daemon=True
            )
            stderr_thread = threading.Thread(
                target=log_output, 
                args=(self.web_app_process.stderr, "ERROR"),
                daemon=True
            )
            stdout_thread.start()
            stderr_thread.start()

            # Wait for the server to start (max 30 seconds)
            start_time = time.time()
            server_started = False
            while time.time() - start_time < 30:
                if self.web_app_process.poll() is not None:
                    # Process ended prematurely
                    stdout, stderr = self.web_app_process.communicate()
                    logger.error(f"Web app process ended unexpectedly")
                    logger.error(f"stdout: {stdout}")
                    logger.error(f"stderr: {stderr}")
                    return False

                # Try to connect to the server
                try:
                    response = requests.get(f'http://localhost:{self.port}')
                    if response.status_code == 200:
                        server_started = True
                        break
                except requests.exceptions.ConnectionError:
                    time.sleep(1)
                    continue

            if not server_started:
                logger.error("Timeout waiting for web server to start")
                # Get any final output
                stdout, stderr = self.web_app_process.communicate(timeout=1)
                if stdout:
                    logger.error(f"Final stdout: {stdout}")
                if stderr:
                    logger.error(f"Final stderr: {stderr}")
                return False

            # Open in browser
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
        
        # Set stop event if it exists
        if hasattr(self, '_stop_event'):
            asyncio.create_task(self._set_stop_event())
        
        if self.drone_controller.vehicle:
            self.drone_controller.close_connection()
        
        if self.web_app_process:
            self.web_app_process.terminate()
            logger.info("Terminated web application process")

    async def _set_stop_event(self):
        """Helper to set stop event"""
        if self._stop_event:
            self._stop_event.set()

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

    def start_flask_server(self):
        """Start Flask server"""
        try:
            self.app.run(host='0.0.0.0', port=5000, threaded=True)
        except Exception as e:
            logger.error(f"Flask server error: {e}")

    async def websocket_handler(self, websocket):
        """Handle WebSocket connections"""
        try:
            self.clients.add(websocket)
            logger.info(f"New client connected from {websocket.remote_address}")
            
            while not self._shutdown_flag:
                try:
                    # Send current drone state
                    await websocket.send(json.dumps(DRONE_STATE))
                    await asyncio.sleep(1)
                except websockets.exceptions.ConnectionClosed:
                    break
                except Exception as e:
                    logger.error(f"Error sending data: {e}")
                    break
                    
        except Exception as e:
            logger.error(f"Error in handler: {e}")
        finally:
            self.clients.remove(websocket)
            logger.info(f"Client disconnected: {websocket.remote_address}")

    async def run(self):
        """Main execution flow."""
        try:
            if not self.start_web_app():
                logger.error("Failed to start web application")
                return

            # Start Flask server in a separate thread
            self.flask_server = threading.Thread(
                target=self.start_flask_server,
                daemon=True
            )
            self.flask_server.start()
            logger.info("Flask server started on port 5000")

            # Find available WebSocket port
            if not await self.find_available_port():
                logger.error("No available ports for WebSocket server")
                self.shutdown()
                return

            # Create stop event
            self._stop_event = asyncio.Event()
            
            # Start the state update task
            update_task = asyncio.create_task(update_drone_state())
            
            # Start WebSocket server
            async with websockets.serve(self.websocket_handler, "localhost", self.websocket_port) as server:
                logger.info(f"WebSocket server started on ws://localhost:{self.websocket_port}")
                
                # Start display thread
                display_thread = threading.Thread(target=self.display_state, daemon=True)
                display_thread.start()
                
                # Wait for stop event
                try:
                    await self._stop_event.wait()
                except asyncio.CancelledError:
                    logger.info("Received cancellation signal")
                finally:
                    # Clean shutdown
                    update_task.cancel()
                    server.close()
                    await server.wait_closed()
                    logger.info("WebSocket server shut down cleanly")

        except KeyboardInterrupt:
            logger.info("Received shutdown signal")
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
        finally:
            self.shutdown()

def ensure_directories():
    """Ensure required directories exist"""
    dirs = [
        os.path.join(os.getcwd(), "project", "database"),
        os.path.join(os.getcwd(), "project", "logs")
    ]
    for dir_path in dirs:
        os.makedirs(dir_path, exist_ok=True)

def main():
    """Application entry point."""
    drone_system = DroneSystem()
    try:
        asyncio.run(drone_system.run())
    except KeyboardInterrupt:
        logger.info("Received keyboard interrupt")
        drone_system.shutdown()
    except Exception as e:
        logger.error(f"Application error: {e}")
        drone_system.shutdown()

if __name__ == "__main__":
    ensure_directories()
    main()

