import sqlite3
import random
import time
import os
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class DroneMetricsUpdater:
    def __init__(self):
        self.db_path = os.path.join(os.getcwd(), "project", "database", "drone.db")
        self.last_values = None
        self.update_interval = 1  # seconds
        self.mission_duration = random.randint(30, 60)  # Random mission duration
        self.mission_timer = 0

    def get_realistic_random_values(self):
        """Generate random values with realistic changes from last values"""
        if not self.last_values:
            self.last_values = {
                'latitude': random.uniform(31.4509, 31.4511),
                'longitude': random.uniform(74.2931, 74.2933),
                'speed': 0,
                'signal': 95,
                'arm_status': 'Disarmed',
                'battery': 100,
                'landing_station': 'Closed',
                'heading': 0,
                'altitude': 0,
                'mission_status': 'Idle',
                'current_mission': 'Sample Mission'
            }
        
        # Update mission status
        self.mission_timer += 1
        if self.mission_timer >= self.mission_duration:
            self.mission_timer = 0
            self.mission_duration = random.randint(30, 60)
            
        # Determine mission status based on timer
        if self.mission_timer == 0:
            mission_status = 'Idle'
        elif self.mission_timer == 1:
            mission_status = 'Running'
        elif self.mission_timer == self.mission_duration:
            mission_status = random.choice(['Completed', 'Failed'])
        else:
            mission_status = self.last_values['mission_status']
        
        new_values = {
            'latitude': self.last_values['latitude'] + random.uniform(-0.0001, 0.0001),
            'longitude': self.last_values['longitude'] + random.uniform(-0.0001, 0.0001),
            'speed': max(0, min(30, self.last_values['speed'] + random.uniform(-2, 2))),
            'signal': max(0, min(100, self.last_values['signal'] + random.uniform(-5, 5))),
            'arm_status': 'Armed' if mission_status == 'Running' else 'Disarmed',
            'battery': max(0, self.last_values['battery'] - random.uniform(0, 0.1)),
            'landing_station': 'Open' if mission_status == 'Running' else 'Closed',
            'heading': (self.last_values['heading'] + random.uniform(-10, 10)) % 360,
            'altitude': max(0, min(100, self.last_values['altitude'] + random.uniform(-1, 1))),
            'mission_status': mission_status,
            'current_mission': 'Sample Mission'
        }
        
        self.last_values = new_values
        return new_values

    def update_database(self):
        """Update database with new random values"""
        try:
            metrics = self.get_realistic_random_values()
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Update drone metrics
                cursor.execute('''
                    INSERT INTO drone_metrics 
                    (latitude, longitude, speed, signal, arm_status, battery, 
                     landing_station, heading, altitude, mission_status, current_mission)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    metrics['latitude'],
                    metrics['longitude'],
                    metrics['speed'],
                    metrics['signal'],
                    metrics['arm_status'],
                    metrics['battery'],
                    metrics['landing_station'],
                    metrics['heading'],
                    metrics['altitude'],
                    metrics['mission_status'],
                    metrics['current_mission']
                ))
                
                # Update mission status if changed
                if metrics['mission_status'] != self.last_values.get('mission_status'):
                    cursor.execute('''
                        UPDATE missions 
                        SET status = ?,
                            start_time = CASE 
                                WHEN status = 'Running' THEN CURRENT_TIMESTAMP 
                                ELSE start_time 
                            END,
                            end_time = CASE 
                                WHEN status IN ('Completed', 'Failed') THEN CURRENT_TIMESTAMP 
                                ELSE end_time 
                            END
                        WHERE name = ?
                    ''', (metrics['mission_status'], metrics['current_mission']))
                
                conn.commit()
                
            return True
        except Exception as e:
            logger.error(f"Failed to update metrics: {e}")
            return False

    def run(self):
        """Run continuous updates"""
        logger.info("Starting drone metrics updater...")
        try:
            while True:
                if self.update_database():
                    logger.info("Updated metrics successfully")
                else:
                    logger.error("Failed to update metrics")
                time.sleep(self.update_interval)
        except KeyboardInterrupt:
            logger.info("Stopping drone metrics updater...")
        except Exception as e:
            logger.error(f"Unexpected error: {e}")

def main():
    updater = DroneMetricsUpdater()
    updater.run()

if __name__ == "__main__":
    main() 