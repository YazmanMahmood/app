import sqlite3
import time
import os

def monitor_metrics():
    try:
        # Get the absolute path to the database
        db_path = os.path.join(os.getcwd(), "project", "database", "drone.db")
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        
        while True:
            # Clear screen
            os.system('cls' if os.name == 'nt' else 'clear')
            
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Get latest drone metrics
            cursor.execute('''
                SELECT * FROM drone_metrics 
                ORDER BY timestamp DESC 
                LIMIT 1
            ''')
            
            row = cursor.fetchone()
            if row:
                print("\nCurrent Drone Metrics:")
                print("=" * 50)
                print(f"Latitude:        {row[1]:.6f}°")
                print(f"Longitude:       {row[2]:.6f}°")
                print(f"Speed:           {row[3]:.1f} m/s")
                print(f"Signal:          {row[4]}%")
                print(f"Arm Status:      {row[5]}")
                print(f"Battery:         {row[6]}%")
                print(f"Landing Station: {row[7]}")
                print(f"Heading:         {row[8]}°")
                print(f"Altitude:        {row[9]:.1f} m")
                print(f"Mission Status:  {row[10]}")
                print(f"Current Mission: {row[11]}")
                print(f"Timestamp:       {row[12]}")
                print("=" * 50)
                
                # Get mission details
                cursor.execute('''
                    SELECT * FROM missions
                    WHERE name = ?
                ''', (row[11],))
                
                mission = cursor.fetchone()
                if mission:
                    print("\nMission Details:")
                    print("=" * 50)
                    print(f"Name:       {mission[1]}")
                    print(f"Status:     {mission[2]}")
                    print(f"Started:    {mission[3] or 'Not started'}")
                    print(f"Completed:  {mission[4] or 'In progress'}")
                    print(f"Waypoints:  {mission[5]}")
                    print("=" * 50)
            else:
                print("\nNo data in database yet")
                print("=" * 50)
            
            conn.close()
            time.sleep(1)  # Update every second
            
    except KeyboardInterrupt:
        print("\nMonitoring stopped")
    except Exception as e:
        print(f"Error: {e}")
        print(f"Database path: {db_path}")
        print(f"Current working directory: {os.getcwd()}")

if __name__ == "__main__":
    monitor_metrics()