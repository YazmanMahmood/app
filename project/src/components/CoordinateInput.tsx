import React from 'react';
import { WaypointAction } from '../types/Mission';
import { X } from 'lucide-react';

interface CoordinateInputProps {
  label: string;
  lat: number;
  lng: number;
  height: number;
  action: WaypointAction;
  onChange: (lat: number, lng: number, height: number, action: WaypointAction) => void;
  onDelete?: () => void;
}

export const CoordinateInput: React.FC<CoordinateInputProps> = ({
  label,
  lat,
  lng,
  height,
  action,
  onChange,
  onDelete
}) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg space-y-3">
      <div className="flex justify-between items-center">
        <span className="font-bold text-white">{label}</span>
        <button
          onClick={onDelete}
          className="p-1 hover:bg-gray-700 rounded-full transition-colors"
          title="Delete waypoint"
        >
          <X className="w-4 h-4 text-gray-400 hover:text-white" />
        </button>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">
          Action Type
        </label>
        <select
          value={action.type}
          onChange={(e) => onChange(lat, lng, height, { 
            ...action, 
            type: e.target.value as WaypointAction['type'],
            ...(e.target.value === 'loiter' ? { duration: action.duration || 5 } : {})
          })}
          className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="waypoint">Waypoint</option>
          <option value="takeoff">Takeoff</option>
          <option value="loiter">Loiter</option>
          <option value="land">Land</option>
          <option value="rtl">Return to Launch</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Latitude (°)
          </label>
          <input
            type="number"
            value={lat}
            onChange={(e) => onChange(parseFloat(e.target.value), lng, height, action)}
            className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            step="0.000001"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Longitude (°)
          </label>
          <input
            type="number"
            value={lng}
            onChange={(e) => onChange(lat, parseFloat(e.target.value), height, action)}
            className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            step="0.000001"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">
          Altitude (meters)
        </label>
        <input
          type="number"
          value={height}
          onChange={(e) => onChange(lat, lng, parseInt(e.target.value), action)}
          className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          min="0"
          max="1000"
        />
      </div>

      {action.type === 'loiter' && (
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Duration (seconds)
          </label>
          <input
            type="number"
            value={action.duration || 0}
            onChange={(e) => onChange(lat, lng, height, { ...action, duration: parseInt(e.target.value) })}
            className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            min="0"
          />
        </div>
      )}
    </div>
  );
};