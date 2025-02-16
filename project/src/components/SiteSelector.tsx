import React from 'react';
import { MapPin } from 'lucide-react';

export interface Site {
  id: string;
  name: string;
  coordinates: [number, number];
  droneInfo: {
    model: string;
    batteryLevel: string;
    status: string;
    altitude: string;
    signalStrength: string;
    currentSpeed: string;
    heading: string;
  };
}

interface SiteSelectorProps {
  sites: Site[];
  selectedSite: Site;
  onSiteChange: (site: Site) => void;
}

export const SiteSelector: React.FC<SiteSelectorProps> = ({
  sites,
  selectedSite,
  onSiteChange,
}) => {
  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-gray-700 p-2 rounded-lg cursor-pointer group">
        <MapPin className="w-4 h-4 text-blue-400" />
        <select
          className="bg-transparent text-white outline-none w-full cursor-pointer"
          value={selectedSite.id}
          onChange={(e) => {
            const site = sites.find(s => s.id === e.target.value);
            if (site) onSiteChange(site);
          }}
        >
          {sites.map((site) => (
            <option key={site.id} value={site.id} className="bg-gray-700">
              {site.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};