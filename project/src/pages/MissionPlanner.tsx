import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, LayersControl } from 'react-leaflet';
import { Route, Lock, MapPin, Play, Pause, Edit2, Trash2 } from 'lucide-react';
import DroneInfo from '../components/DroneInfo';
import { MissionForm } from '../components/MissionForm';
import { MissionList } from '../components/MissionList';
import { MapController } from '../components/map/MapController';
import { MapClickHandler } from '../components/map/MapClickHandler';
import { startIcon, endIcon, waypointIcon, locationIcon } from '../components/map/CustomMarkers';
import { SiteSelector, Site } from '../components/SiteSelector';

import { sites } from '../data/sites';
import { CoordinateInput } from '../components/CoordinateInput';
import { Mission } from '../types/mission';
import { getWaypointLabel } from '../utils/coordinates';
import WaypointMarker from '../components/WaypointMarker';
import '../styles/waypoints.css';

interface Waypoint {
  coordinates: [number, number];
  altitude: number;
}
import 'leaflet/dist/leaflet.css';
import { formatCoordinates } from '../utils/coordinates';

// Replace existing formatWaypointsToText function
const formatWaypointsToText = (waypoints: Waypoint[]): string => {
  if (!waypoints?.length) return '';
  
  return waypoints.map((wp, index) => {
    const [lat, lng] = wp.coordinates;
    return `${index + 1}. ${lng} : ${lat} : ${wp.altitude}`;
  }).join('\n');
};

// Update saveWaypointsToFile with error handling
const saveWaypointsToFile = (waypoints: LocalWaypoint[]) => {
  try {
    const waypointsText = formatWaypointsToText(waypoints);
    const blob = new Blob([waypointsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mission_waypoints_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to save waypoints:', error);
    alert('Failed to save waypoints file');
  }
};

const DEFAULT_ZOOM = 18;
const DEFAULT_HEIGHT = 5;
const POLYLINE_OPTIONS = { 
  color: '#00ff00', // Bright green for better visibility on satellite
  weight: 3,
  opacity: 0.8,
  dashArray: '5, 10' // Makes the line dashed
};

interface DroneState {
  Battery: number;
  Status: string;
  Altitude: number;
  Signal: number;
  Speed: number;
  Heading: number;
  Location: [number, number];
  HomeLocation: [number, number];
  LandingStation: string;
}

const initialDroneState: DroneState = {
  Battery: 75,
  Status: 'Connected',
  Altitude: 0,
  Signal: 100,
  Speed: 0,
  Heading: 76,
  Location: [0, 0],
  HomeLocation: [0, 0],
  LandingStation: 'open'
};

// Update the WaypointAction interface
interface WaypointAction {
  type: 'waypoint' | 'takeoff' | 'land' | 'loiter' | 'rtl';
  duration?: number;
}

interface LocalWaypoint {
  id: string;
  coordinates: [number, number];
  altitude: number;
  action: WaypointAction;
  position: [number, number];
  order: number;
  label: string;
  height?: number;
}

// Add error boundary component
interface MissionErrorBoundaryProps {
  children: React.ReactNode;
}

class MissionErrorBoundary extends React.Component<MissionErrorBoundaryProps> {
  state: { hasError: boolean; error: Error | null } = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Mission Error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg">
          <h2 className="font-bold mb-2">Something went wrong</h2>
          <p className="mb-4">{this.state.error?.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Add websocket configuration
const WS_RETRY_INTERVAL = 5000;
const MAX_RETRIES = 3;

// Removed redundant fetchWsPort function

// Add these constants at the top with your other constants
const MAPBOX_TOKEN = 'your_mapbox_token'; // You'll need to get a token from Mapbox
const GOOGLE_MAPS_API_KEY = 'your_google_maps_api_key'; // Or get a Google Maps API key

const MissionPlanner: React.FC = () => {
  // Initialize states with safe defaults
  const [selectedSite, setSelectedSite] = useState<Site>(sites[0] || {
    id: '0',
    name: 'Default Site',
    coordinates: [0, 0],
    droneInfo: {
      battery: 0,
      status: 'Disconnected',
      altitude: 0,
      signal: 0
    }
  });
  
  const [missions, setMissions] = useState<Mission[]>([]);
  const [waypoints, setWaypoints] = useState<LocalWaypoint[]>([]);
  const [missionCreationStep, setMissionCreationStep] = useState<'idle' | 'selecting-waypoints' | 'mission-details'>('idle');
  const [missionForm, setMissionForm] = useState({
    name: '',
    date: '',
    time: ''
  });
  const [isSettingWaypoints, setIsSettingWaypoints] = useState(false);
  const [isMapLocked, setIsMapLocked] = useState(true);
  const [showMissionForm, setShowMissionForm] = useState(false);
  const [editingMissionId, setEditingMissionId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [droneState] = useState<DroneState>(initialDroneState);
  const [locationError, setLocationError] = useState<string | null>(null);
  const mapRef = useRef(null);
  const [wsConnected] = useState(true);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
          setLocationError(null);
        },
        (error) => {
          if (error.code === 1) {
            setLocationError('Location access denied. Please enable location services.');
          } else {  
            setLocationError(`Failed to get location: ${error.message}`);
          }
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser');
    }
  }, []);

  const waypointPositions = waypoints.map(wp => wp.coordinates);

  const handleNewMissionClick = () => {
    setWaypoints([]);
    setMissionCreationStep('selecting-waypoints');
    setIsSettingWaypoints(true);
    setShowMissionForm(true);
    setIsMapLocked(true);
  };

  const handleWaypointSelect = (lat: number, lng: number) => {
    if (isSettingWaypoints) {
      const newWaypoint: LocalWaypoint = {
        id: Date.now().toString(),
        coordinates: [lat, lng],
        altitude: DEFAULT_HEIGHT,
        action: {
          type: 'waypoint'
        },
        position: [lat, lng],
        order: waypoints.length + 1,
        label: `${waypoints.length + 1}`
      };
      setWaypoints(prev => [...prev, newWaypoint]);
    }
  };

  const handleWaypointDelete = (id: string, showConfirm = false) => {
    if (missionCreationStep === 'idle') return;

    const waypointIndex = waypoints.findIndex(wp => wp.id === id);
    
    if (waypointIndex === 0) return;

    setWaypoints(prev => {
      const newWaypoints = prev.filter(wp => wp.id !== id);
      return newWaypoints.map((wp, index) => ({
        ...wp,
        order: index + 1,
        label: `${index + 1}`
      }));
    });
  };

  const handleHeightChange = (waypointId: string, altitude: number) => {
    setWaypoints(prev => prev.map(wp => 
      wp.id === waypointId ? { ...wp, altitude } : wp
    ));
  };

  const handleCoordinateChange = (waypointId: string, lat: number, lng: number, height: number, action: WaypointAction) => {
    setWaypoints(prev => prev.map(wp => 
      wp.id === waypointId ? { ...wp, coordinates: [lat, lng], altitude: height, action } : wp
    ));
  };

  const handleWaypointsComplete = () => {
    if (waypoints.length < 2) {
      alert('Please add at least 2 waypoints to create a mission');
      return;
    }
    setIsSettingWaypoints(false);
    setMissionCreationStep('mission-details');
    setIsMapLocked(false);
  };

  const handleMissionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!waypoints?.length || waypoints.length < 2) {
        throw new Error('Please add at least 2 waypoints');
      }

      const missionData: Mission = {
        id: editingMissionId || Date.now().toString(),
        name: missionForm.name || 'Untitled Mission',
        date: missionForm.date || new Date().toISOString().split('T')[0],
        time: missionForm.time || new Date().toTimeString().split(' ')[0],
        waypoints: waypoints.map((wp, index) => ({
          ...wp,
          action: wp.action || { type: 'waypoint' },
          order: index + 1,
          height: wp.height || 0
        })),
        status: 'pending'
      };

      setMissions(prev => {
        const newMissions = editingMissionId 
          ? prev.map(m => m.id === editingMissionId ? missionData : m)
          : [...prev, missionData];
        return newMissions;
      });

      saveWaypointsToFile(waypoints);

      setWaypoints([]);
      setMissionForm({ name: '', date: '', time: '' });
      setMissionCreationStep('idle');
      setShowMissionForm(false);
    } catch (error) {
      console.error('Mission creation failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to create mission');
    }
  };

  const handleDeleteMission = (missionId: string) => {
    setMissions(prev => prev.filter(mission => mission.id !== missionId));
  };

  const handleStartMission = (missionId: string) => {
    setMissions(prev => prev.map(mission => 
      mission.id === missionId ? { ...mission, status: 'active' } : mission
    ));
  };

  const handlePauseMission = (missionId: string) => {
    setMissions(prev => prev.map(mission => 
      mission.id === missionId ? { ...mission, status: 'pending' } : mission
    ));
  };

  const handleEditMission = (mission: Mission) => {
    setEditingMissionId(mission.id);
    setMissionForm({
      name: mission.name,
      date: mission.date,
      time: mission.time
    });
    setWaypoints(mission.waypoints.map((wp, index) => ({
      id: Date.now().toString(),
      coordinates: wp.coordinates,
      altitude: wp.height || DEFAULT_HEIGHT,
      action: { type: 'waypoint' },
      position: wp.coordinates,
      order: index + 1,
      label: `Waypoint ${index + 1}`,
      height: wp.height || DEFAULT_HEIGHT
    })));
    setMissionCreationStep('mission-details');
    setShowMissionForm(true);
    setIsMapLocked(false);
  };

  const handleWaypointSelectInForm = () => {
    setMissionCreationStep('selecting-waypoints');
    setIsSettingWaypoints(true);
    setIsMapLocked(false);
  };

  const handleSiteChange = (site: Site) => {
    setSelectedSite(site);
    if (mapRef.current) {
      const map = mapRef.current;
      // @ts-ignore
      map.setView(site.coordinates, DEFAULT_ZOOM);
    }
  };

  const confirmAction = (action: string, callback: () => void) => {
    if (window.confirm(`Are you sure you want to ${action}?`)) {
      callback();
    }
  };

  const handleWaypointDragEnd = (id: string, newCoords: [number, number]) => {
    setWaypoints(prev => prev.map(wp => {
      if (wp.id === id) {
        return {
          ...wp,
          coordinates: newCoords,
          position: newCoords,
          label: `${wp.order}`
        };
      }
      return wp;
    }));
  };

  const validateMission = () => {
    if (waypoints.length < 2) {
      alert('A valid mission requires at least 2 waypoints');
      return false;
    }
    return true;
  };

  const handleMissionComplete = () => {
    if (!validateMission()) return;
    
    // Rest of your mission completion logic
    // ...
  };

  return (
    <MissionErrorBoundary>
      <div className="h-screen flex flex-col p-2 sm:p-6">
        {locationError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            <span className="block sm:inline">{locationError}</span>
          </div>
        )}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            DroneControl
            <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">BETA</span>
            {wsConnected && <span className="text-xs bg-green-600 text-white px-2 py-1 rounded ml-2">Connected</span>}
          </h1>
          <SiteSelector
            sites={sites || []}
            selectedSite={selectedSite}
            onSiteChange={handleSiteChange}
          />
        </div>
  
        <DroneInfo info={{
          speed: droneState.Speed,
          heading: droneState.Heading
        }} />
  
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 min-h-0">
          <div className="lg:col-span-9 order-2 lg:order-1 h-full">
            <div className="bg-gray-800 rounded-lg p-2 sm:p-4 h-full">
              <div className="h-full rounded-lg overflow-hidden relative shadow-xl">
                <MapContainer
                  ref={mapRef}
                  center={selectedSite.coordinates}
                  zoom={DEFAULT_ZOOM}
                  style={{ height: '100%', width: '100%' }}
                  className="map-satellite"
                >
                  <MapController isLocked={isMapLocked} />
                  
                  <LayersControl position="topright">
                    <LayersControl.BaseLayer checked name="Satellite">
                      <TileLayer
                        attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                        url='https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
                        maxZoom={19}
                      />
                    </LayersControl.BaseLayer>
                    
                    <LayersControl.BaseLayer name="Street">
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                    </LayersControl.BaseLayer>
                    
                    <LayersControl.BaseLayer name="Terrain">
                      <TileLayer
                        attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                        url='https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}'
                        maxZoom={19}
                      />
                    </LayersControl.BaseLayer>
                  </LayersControl>

                  <MapClickHandler 
                    onPointSelect={handleWaypointSelect}
                    isActive={isSettingWaypoints}
                  />
                  
                  {waypointPositions.length > 1 && (
                    <Polyline positions={waypointPositions} pathOptions={POLYLINE_OPTIONS} />
                  )}
                  
                  {waypoints.map((waypoint, index) => (
                    <WaypointMarker
                      key={waypoint.id}
                      id={waypoint.id}
                      index={index}
                      coordinates={waypoint.coordinates}
                      altitude={waypoint.altitude}
                      action={waypoint.action}
                      onHeightChange={(height) => handleHeightChange(waypoint.id, height)}
                      onDelete={() => handleWaypointDelete(waypoint.id)}
                      onDragEnd={handleWaypointDragEnd}
                      isDraggable={true}
                    />
                  ))}
  
                  {userLocation && (
                    <Marker position={userLocation} icon={locationIcon}>
                      <Popup>Your Location</Popup>
                    </Marker>
                  )}
                </MapContainer>
  
                <div className="absolute top-4 right-4 z-[1000] space-y-2">
                  <button
                    onClick={() => setIsMapLocked(!isMapLocked)}
                    className={`${
                      isMapLocked ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                    } text-white p-2 rounded-lg flex items-center gap-2 w-full`}
                  >
                    <Lock className="w-5 h-5" />
                    <span className="hidden sm:inline">{isMapLocked ? 'Unlock Map' : 'Lock Map'}</span>
                  </button>
                </div>
  
                {missionCreationStep === 'selecting-waypoints' && (
                  <div className="absolute top-4 left-4 z-[1000] bg-blue-600 text-white px-4 py-2 rounded-lg">
                    <span className="hidden sm:inline">Click on map to add waypoints</span>
                    <span className="sm:hidden">Add waypoints</span>
                    ({waypoints.length} added)
                    <button 
                      onClick={handleWaypointsComplete}
                      className="ml-4 bg-green-500 px-2 py-1 rounded"
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
  
          <div className="lg:col-span-3 order-1 lg:order-2 space-y-4 overflow-y-auto">
            {missionCreationStep === 'idle' && (
              <button
                onClick={handleNewMissionClick}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Route className="w-5 h-5" />
                Create New Mission
              </button>
            )}
  
            {showMissionForm && (
              <div className="space-y-4 bg-gray-900 p-4 rounded-lg">
                <div className="space-y-2">
                  <h3 className="font-bold text-lg">Waypoints</h3>
                  {waypoints.map((waypoint, index) => (
                    <CoordinateInput
                      key={waypoint.id}
                      label={`Waypoint ${index + 1}`}
                      lat={waypoint.coordinates[0]}
                      lng={waypoint.coordinates[1]}
                      height={waypoint.altitude}
                      action={waypoint.action}
                      isFirstWaypoint={index === 0}
                      onChange={(lat, lng, height, action) => 
                        handleCoordinateChange(waypoint.id, lat, lng, height, action)
                      }
                      onDelete={() => {
                        if (index !== 0) {
                          handleWaypointDelete(waypoint.id);
                        }
                      }}
                    />
                  ))}
                  {missionCreationStep === 'mission-details' && (
                    <button
                      onClick={handleWaypointSelectInForm}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded flex items-center justify-center gap-2"
                    >
                      <MapPin className="w-4 h-4" />
                      {editingMissionId ? 'Edit Waypoints' : 'Select Waypoints'}
                    </button>
                  )}
                </div>
  
                {missionCreationStep === 'mission-details' && (
                  <MissionForm
                    form={missionForm}
                    waypointsCount={waypoints.length}
                    onFormChange={setMissionForm}
                    onWaypointSelect={handleWaypointSelectInForm}
                    onCancel={() => {
                      try {
                        setShowMissionForm(false);
                        setWaypoints([]);
                        setIsSettingWaypoints(false);
                        setMissionCreationStep('idle');
                        setEditingMissionId(null);
                        setIsMapLocked(true);
                      } catch (error) {
                        console.error('Cancel failed:', error);
                      }
                    }}
                    onSubmit={handleMissionSubmit}
                    isEditing={!!editingMissionId}
                  />
                )}
              </div>
            )}
  
            {missions && (
              <div className="space-y-4">
                <h3 className="font-bold text-lg">Saved Missions</h3>
                {missions.map((mission) => (
                  <div 
                    key={mission.id} 
                    className="bg-gray-800 rounded-lg p-4 space-y-2"
                  >
                    <div className="font-semibold text-white">{mission.name}</div>
                    <div className="text-gray-400 text-sm">
                      {mission.waypoints[0] && formatCoordinates(
                        mission.waypoints[0].coordinates[0], 
                        mission.waypoints[0].coordinates[1]
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        onClick={() => confirmAction(
                          'start this mission',
                          () => handleStartMission(mission.id)
                        )}
                        className="flex-1 min-w-[100px] flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm"
                      >
                        <Play className="w-4 h-4" />
                        Start
                      </button>
                      <button
                        onClick={() => confirmAction(
                          'pause this mission',
                          () => handlePauseMission(mission.id)
                        )}
                        className="flex-1 min-w-[100px] flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1.5 rounded text-sm"
                      >
                        <Pause className="w-4 h-4" />
                        Pause
                      </button>
                      <button
                        onClick={() => handleEditMission(mission)}
                        className="flex-1 min-w-[100px] flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => confirmAction(
                          'delete this mission',
                          () => handleDeleteMission(mission.id)
                        )}
                        className="flex-1 min-w-[100px] flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MissionErrorBoundary>
  );
}

export default MissionPlanner;