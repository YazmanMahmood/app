export interface Waypoint {
  coordinates: [any, any];
  id: string;
  position: [number, number];
  order: number;
  label: string;
  height: number; // Height in feet
}

export interface Mission {
  id: string;
  name: string;
  date: string;
  time: string;
  waypoints: Waypoint[];
  status: 'pending' | 'active' | 'completed';
}

export interface MissionForm {
  name: string;
  date: string;
  time: string;
}

export interface DroneInfo {
  model: string;
  batteryLevel: string;
  status: string;
  altitude: string;
  signalStrength: string;
  currentSpeed: string;
  heading: string;
}