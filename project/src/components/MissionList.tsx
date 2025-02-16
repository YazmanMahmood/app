import React from 'react';
import { Mission } from '../types/mission';
import { formatCoordinates } from '../utils/coordinates';

interface MissionListProps {
  missions: Mission[];
  onDelete: (id: string) => void;
  onStart: (id: string) => void;
  onPause: (id: string) => void;
  onEdit: (mission: Mission) => void;
}

class MissionErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  state: { hasError: boolean; error: Error | null } = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: Error) {
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

export const MissionList: React.FC<MissionListProps> = ({
  missions = [], // Provide default empty array
  onDelete,
  onStart,
  onPause,
  onEdit,
}) => {
  if (!missions?.length) {
    return <div className="text-gray-500">No missions available</div>;
  }

  return (
    <MissionErrorBoundary>
      <div>
        {missions.map((mission) => (
          <div key={mission.id}>
            <div>{mission.name}</div>
            <div>{mission.waypoints.length > 0 && formatCoordinates(mission.waypoints[0].coordinates[0], mission.waypoints[0].coordinates[1])}</div>
            <button onClick={() => onStart(mission.id)}>Start</button>
            <button onClick={() => onPause(mission.id)}>Pause</button>
            <button onClick={() => onEdit(mission)}>Edit</button>
            <button onClick={() => onDelete(mission.id)}>Delete</button>
          </div>
        ))}
      </div>
    </MissionErrorBoundary>
  );
};