import sqlite3
from datetime import datetime
import logging
import os
import random

logger = logging.getLogger(__name__)

class DroneDB:
    def __init__(self, db_path=os.path.join(os.getcwd(), "project", "database", "drone.db")):
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        self.db_path = db_path
        self.init_db()

    def init_db(self):
        """Initialize database with required tables"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Create drone_metrics table if it doesn't exist
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS drone_metrics (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        latitude REAL,
                        longitude REAL,
                        speed REAL,
                        signal INTEGER,
                        arm_status TEXT CHECK(arm_status IN ('Armed', 'Disarmed')),
                        battery INTEGER,
                        landing_station TEXT CHECK(landing_station IN ('Open', 'Closed')),
                        heading INTEGER,
                        altitude REAL,
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                conn.commit()
                logger.info("Database initialized successfully")
        except Exception as e:
            logger.error(f"Database initialization failed: {e}")

    def generate_random_metrics(self):
        """Generate random metrics for simulation"""
        return {
            'latitude': random.uniform(45.0, 45.1),
            'longitude': random.uniform(-93.0, -93.1),
            'speed': random.uniform(0, 15),
            'signal': random.randint(80, 100),
            'arm_status': random.choice(['Armed', 'Disarmed']),
            'battery': random.randint(80, 100),
            'landing_station': random.choice(['Open', 'Closed']),
            'heading': random.randint(0, 359),
            'altitude': random.uniform(0, 100)
        }

    def update_metrics(self):
        """Update drone metrics with random values"""
        try:
            metrics = self.generate_random_metrics()
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO drone_metrics 
                    (latitude, longitude, speed, signal, arm_status, battery, 
                     landing_station, heading, altitude)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    metrics['latitude'],
                    metrics['longitude'],
                    metrics['speed'],
                    metrics['signal'],
                    metrics['arm_status'],
                    metrics['battery'],
                    metrics['landing_station'],
                    metrics['heading'],
                    metrics['altitude']
                ))
                conn.commit()
                return metrics
        except Exception as e:
            logger.error(f"Failed to update metrics in database: {e}")
            return None

    def get_latest_metrics(self):
        """Get the most recent metrics from database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT latitude, longitude, speed, signal, arm_status, 
                           battery, landing_station, heading, altitude, timestamp
                    FROM drone_metrics
                    ORDER BY timestamp DESC
                    LIMIT 1
                ''')
                result = cursor.fetchone()
                if result:
                    return {
                        'latitude': result[0],
                        'longitude': result[1],
                        'speed': result[2],
                        'signal': result[3],
                        'arm_status': result[4],
                        'battery': result[5],
                        'landing_station': result[6],
                        'heading': result[7],
                        'altitude': result[8],
                        'timestamp': result[9]
                    }
                return None
        except Exception as e:
            logger.error(f"Failed to get latest metrics: {e}")
            return None

    def get_metrics_history(self, limit=100):
        """Get historical metrics data"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT battery, status, altitude, signal, speed, heading, timestamp
                    FROM drone_metrics
                    ORDER BY timestamp DESC
                    LIMIT ?
                ''', (limit,))
                results = cursor.fetchall()
                return [{
                    'Battery': row[0],
                    'Status': row[1],
                    'Altitude': row[2],
                    'Signal': row[3],
                    'Speed': row[4],
                    'Heading': row[5],
                    'timestamp': row[6]
                } for row in results]
        except Exception as e:
            logger.error(f"Failed to get metrics history: {e}")
            return []