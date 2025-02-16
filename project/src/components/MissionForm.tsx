import React from 'react';
import { Calendar, Clock, Route, MapPin, AlertCircle } from 'lucide-react';
import { MissionForm as MissionFormType } from '../types/mission';

interface MissionFormProps {
  form: MissionFormType;
  waypointsCount: number;
  onFormChange: (form: MissionFormType) => void;
  onWaypointSelect: () => void;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isEditing?: boolean;
}

export const MissionForm: React.FC<MissionFormProps> = ({
  form,
  waypointsCount,
  onFormChange,
  onWaypointSelect,
  onCancel,
  onSubmit,
  isEditing = false,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Waypoints</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={waypointsCount > 0 ? `${waypointsCount} waypoints selected` : ''}
            readOnly
            className="flex-1 bg-gray-700 rounded p-2"
            placeholder="Click 'Select on Map'"
          />
          <button
            type="button"
            onClick={onWaypointSelect}
            className="bg-green-600 hover:bg-green-700 px-3 rounded flex items-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            {isEditing ? 'Edit' : 'Select'}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1 flex items-center gap-2">
          <Route className="w-4 h-4" />
          Mission Name
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => onFormChange({ ...form, name: e.target.value })}
          className="w-full bg-gray-700 rounded p-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Date
        </label>
        <input
          type="date"
          value={form.date}
          onChange={(e) => onFormChange({ ...form, date: e.target.value })}
          className="w-full bg-gray-700 rounded p-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Time
        </label>
        <input
          type="time"
          value={form.time}
          onChange={(e) => onFormChange({ ...form, time: e.target.value })}
          className="w-full bg-gray-700 rounded p-2"
          required
        />
      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white p-2 rounded transition-colors flex items-center justify-center gap-2"
        >
          <AlertCircle className="w-4 h-4" />
          Cancel
        </button>
        <button 
          type="submit"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded transition-colors flex items-center justify-center gap-2"
        >
          <Route className="w-4 h-4" />
          {isEditing ? 'Update' : 'Create'} Mission
        </button>
      </div>
    </form>
  );
};