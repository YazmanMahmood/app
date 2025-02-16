import sqlite3
import os
import logging
import random
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_database():
    try:
        # Get the absolute path to the database
        db_path = os.path.join(os.getcwd(), "project", "database", "drone.db")
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        
        # Connect to database and create table
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Create drone_metrics table
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
                mission_status TEXT CHECK(mission_status IN ('Idle', 'Running', 'Completed', 'Failed')),
                current_mission TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create missions table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS missions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                status TEXT CHECK(status IN ('Idle', 'Running', 'Completed', 'Failed')) DEFAULT 'Idle',
                start_time DATETIME,
                end_time DATETIME,
                waypoints TEXT,  -- JSON string of waypoints
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Insert sample mission
        cursor.execute('''
            INSERT INTO missions (name, status, waypoints)
            VALUES (?, ?, ?)
        ''', (
            'Sample Mission',
            'Idle',
            '[{"lat": 31.4510, "lng": 74.2932, "alt": 50}]'
        ))
        
        # Insert initial drone metrics
        cursor.execute('''
            INSERT INTO drone_metrics 
            (latitude, longitude, speed, signal, arm_status, battery, 
             landing_station, heading, altitude, mission_status, current_mission)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            random.uniform(31.4509, 31.4511),
            random.uniform(74.2931, 74.2933),
            random.uniform(0, 15),
            random.randint(80, 100),
            'Disarmed',
            100,
            'Closed',
            random.randint(0, 359),
            random.uniform(0, 100),
            'Idle',
            'Sample Mission'
        ))
        
        conn.commit()
        logger.info(f"Database initialized successfully at: {db_path}")
        
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    init_database() 