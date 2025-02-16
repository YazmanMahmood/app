import React, { useEffect, useState } from 'react';
import { Battery, AlertCircle, Navigation, Wifi, Home } from 'lucide-react';

interface DroneMetrics {
  Battery: number;
  Status: string;
  Altitude: number;
  Signal: number;
  Speed: number;
  Heading: number;
  LandingStation: string;
}

interface DroneInfoProps {
  info: {
    speed: number;
    heading: number;
  }
}

const DroneInfo: React.FC<DroneInfoProps> = ({ info }) => {
  const [metrics, setMetrics] = useState<DroneMetrics>({
    Battery: 0,
    Status: 'Disconnected',
    Altitude: 0,
    Signal: 0,
    Speed: 0,
    Heading: 0,
    LandingStation: 'Closed'
  });

  // Replace localhost with your computer's IP address
  const WS_URL = `ws://${window.location.hostname}:8765`;

  // WebSocket connection for real-time updates
  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as DroneMetrics;
        setMetrics(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setMetrics(prev => ({ ...prev, Status: 'Connection Error' }));
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
      setMetrics(prev => ({ ...prev, Status: 'Disconnected' }));
    };

    return () => {
      ws.close();
    };
  }, []);

  // Metric cards configuration
  const metricCards = [
    {
      icon: <Battery className="text-blue-500" />,
      label: 'Battery',
      value: `${metrics.Battery}%`,
      color: metrics.Battery < 20 ? 'text-red-500' : 'text-white'
    },
    {
      icon: <AlertCircle className="text-blue-500" />,
      label: 'Status',
      value: metrics.Status,
      color: metrics.Status === 'Connected' ? 'text-green-500' : 'text-red-500'
    },
    {
      icon: <Navigation className="text-blue-500" />,
      label: 'Altitude',
      value: `${metrics.Altitude}m`,
      color: 'text-white'
    },
    {
      icon: <Wifi className="text-blue-500" />,
      label: 'Signal',
      value: `${metrics.Signal}%`,
      color: metrics.Signal < 30 ? 'text-red-500' : 'text-white'
    },
    {
      icon: <Navigation className="text-blue-500" />,
      label: 'Speed',
      value: `${metrics.Speed}m/s`,
      color: 'text-white'
    },
    {
      icon: <Navigation className="text-blue-500" />,
      label: 'Heading',
      value: `${metrics.Heading}°`,
      color: 'text-white'
    },
    {
      icon: <Home className="text-blue-500" />,
      label: 'Landing Station',
      value: metrics.LandingStation,
      color: metrics.LandingStation === 'Open' ? 'text-green-500' : 'text-yellow-500'
    }
  ];

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h2 className="text-xl font-bold text-white mb-4">Drone Status</h2>
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
        {metricCards.map((card, index) => (
          <div key={index} className="flex items-center gap-2">
            {card.icon}
            <div>
              <div className="text-gray-400">{card.label}</div>
              <div className={`text-xl ${card.color}`}>{card.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DroneInfo;