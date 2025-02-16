import React from 'react';
import { MapPin } from 'lucide-react';

interface CoordinateInputProps {
  label: string;
  lat: number;
  lng: number;
  height: number;
  action?: WaypointAction;  // Make action optional
  onChange: (lat: number, lng: number, height: number, action: WaypointAction) => void;
}

export const CoordinateInput: React.FC<CoordinateInputProps> = ({
  label,
  lat,
  lng,
  height,
  action = { type: 'waypoint' },  // Provide default value
  onChange,
}) => {
  return (
    <div className="p-3 bg-gray-800 rounded-lg">
      <h4 className="font-bold mb-2">{label}</h4>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={lat}
            onChange={(e) => onChange(parseFloat(e.target.value), lng, height, action)}
            placeholder="Latitude"
            className="p-2 rounded bg-gray-700"
          />
          <input
            type="number"
            value={lng}
            onChange={(e) => onChange(lat, parseFloat(e.target.value), height, action)}
            placeholder="Longitude"
            className="p-2 rounded bg-gray-700"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={height}
            onChange={(e) => onChange(lat, lng, parseFloat(e.target.value), action)}
            placeholder="Height (ft)"
            className="p-2 rounded bg-gray-700"
          />
          <select
            value={action.type}
            onChange={(e) => onChange(lat, lng, height, { ...action, type: e.target.value as WaypointActionType })}
            className="p-2 rounded bg-gray-700"
          >
            <option value="waypoint">Waypoint</option>
            <option value="takeoff">Takeoff</option>
            <option value="land">Land</option>
            <option value="loiter">Loiter</option>
            <option value="rtl">Return to Launch</option>
          </select>
        </div>
        {action.type === 'loiter' && (
          <input
            type="number"
            value={action.duration || 0}
            onChange={(e) => onChange(lat, lng, height, { ...action, duration: parseFloat(e.target.value) })}
            placeholder="Loiter time (seconds)"
            className="p-2 rounded bg-gray-700 w-full"
          />
        )}
      </div>
    </div>
  );
};