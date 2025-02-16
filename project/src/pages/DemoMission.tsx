import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Play, Square, Lock, Unlock } from 'lucide-react';
import DroneInfo from '../components/DroneInfo';
import { MapController } from '../components/map/MapController';

// UMT Lahore coordinates (centered on the mission area)
const UMT_CENTER: [number, number] = [31.451065, 74.293068];

// Updated waypoints with the provided coordinates
const DEMO_WAYPOINTS: [number, number][] = [
  [31.45133145937601, 74.29257014272194],  // A (Start/End)
  [31.451386426060655, 74.29331545531234], // B
  [31.450910047055583, 74.29341733257289], // C
  [31.450732763546167, 74.29281679293172], // D
  [31.450975308548603, 74.29270955371004], // E
  [31.45133145937601, 74.29257014272194],  // Back to A
];

// Custom icons
const droneIcon = new Icon({
  iconUrl: '/drone-icon.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const waypointIcon = new Icon({
  iconUrl: '/waypoint-marker.png',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const DemoMission: React.FC = () => {
  const [missionActive, setMissionActive] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(DEMO_WAYPOINTS[0]);
  const [currentWaypointIndex, setCurrentWaypointIndex] = useState(0);
  const [missionComplete, setMissionComplete] = useState(false);
  const [isMapLocked, setIsMapLocked] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (missionActive) {
      interval = setInterval(() => {
        setCurrentWaypointIndex((prevIndex) => {
          if (prevIndex >= DEMO_WAYPOINTS.length - 1) {
            setMissionActive(false);
            setMissionComplete(true);
            return 0;
          }
          return prevIndex + 1;
        });
      }, 2000); // Move to next waypoint every 2 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [missionActive]);

  useEffect(() => {
    setCurrentPosition(DEMO_WAYPOINTS[currentWaypointIndex]);
  }, [currentWaypointIndex]);

  const handleStartStop = () => {
    if (!missionActive) {
      setMissionComplete(false);
      setCurrentWaypointIndex(0);
      setCurrentPosition(DEMO_WAYPOINTS[0]);
    }
    setMissionActive(!missionActive);
  };

  const getWaypointLabel = (index: number) => {
    return String.fromCharCode(65 + index); // Convert 0 to A, 1 to B, etc.
  };

  return (
    <div className="p-6 h-full">
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-2">Demo Mission</h1>
        <p className="text-gray-400">UMT Greens Patrol Route</p>
      </div>

      <div className="grid grid-rows-[auto_1fr] gap-6 h-full">
        <DroneInfo info={{ speed: missionActive ? 5 : 0, heading: 0 }} />

        <div className="grid grid-cols-[1fr_auto] gap-4">
          {/* Map Container */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="relative h-[60vh] rounded-lg overflow-hidden">
              <MapContainer
                center={UMT_CENTER}
                zoom={18}
                style={{ height: '100%', width: '100%' }}
              >
                <MapController isLocked={isMapLocked} />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Path polyline */}
                <Polyline
                  positions={DEMO_WAYPOINTS}
                  pathOptions={{ color: '#3b82f6', weight: 2 }}
                />

                {/* Waypoint markers */}
                {DEMO_WAYPOINTS.slice(0, -1).map((position, index) => (
                  <Marker
                    key={index}
                    position={position}
                    icon={waypointIcon}
                  >
                    <Popup>Waypoint {getWaypointLabel(index)}</Popup>
                  </Marker>
                ))}

                {/* Drone marker */}
                <Marker position={currentPosition} icon={droneIcon}>
                  <Popup>Current Position</Popup>
                </Marker>
              </MapContainer>

              {/* Map controls */}
              <div className="absolute top-4 right-4 z-[1000] space-y-2">
                <button
                  onClick={() => setIsMapLocked(!isMapLocked)}
                  className={`
                    ${isMapLocked ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}
                    text-white p-2 rounded-lg flex items-center gap-2 w-full
                  `}
                >
                  {isMapLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                  <span className="hidden sm:inline">{isMapLocked ? 'Unlock Map' : 'Lock Map'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mission Control Sidebar */}
          <div className="bg-gray-800 rounded-lg p-4 w-64 space-y-4">
            <h3 className="text-lg font-semibold mb-4">Mission Control</h3>
            
            <div className="space-y-2">
              <button
                onClick={handleStartStop}
                className={`
                  w-full
                  ${missionActive 
                    ? 'bg-gray-600 hover:bg-gray-700' 
                    : missionComplete
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }
                  text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2
                `}
              >
                {missionActive ? (
                  <>
                    <Square className="w-5 h-5" />
                    Stop Mission
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Start Mission
                  </>
                )}
              </button>

              <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Mission Status</h4>
                <div className="text-sm text-gray-300">
                  Current Waypoint: {getWaypointLabel(currentWaypointIndex)}
                </div>
                <div className="text-sm text-gray-300">
                  Status: {missionActive ? 'In Progress' : missionComplete ? 'Completed' : 'Ready'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoMission; 