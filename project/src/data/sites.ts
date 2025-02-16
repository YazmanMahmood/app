import { Site } from '../components/SiteSelector';

export const sites: Site[] = [
  {
    id: 'umt',
    name: 'UMT Lahore',
    coordinates: [31.451081, 74.293154],
    droneInfo: {
      model: 'Artemis Firefly',
      batteryLevel: '85%',
      status: 'Ready',
      altitude: '120m',
      signalStrength: '98%',
      currentSpeed: '0 km/h',
      heading: '0°'
    }
  },
  {
    id: 'expo',
    name: 'Expo Center Lahore',
    coordinates: [31.4697, 74.2728],
    droneInfo: {
      model: 'Artemis Phoenix',
      batteryLevel: '92%',
      status: 'Standby',
      altitude: '0m',
      signalStrength: '100%',
      currentSpeed: '0 km/h',
      heading: '90°'
    }
  }
];