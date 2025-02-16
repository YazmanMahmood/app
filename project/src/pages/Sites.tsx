import React from 'react';
import { MapPin } from 'lucide-react';

function Sites() {
  const sites = [
    {
      id: 1,
      name: 'Expo Center Lahore',
      location: 'Johar Town, Lahore',
      coordinates: '31.4697° N, 74.2728° E',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=2070',
    },
    {
      id: 2,
      name: 'UMT Lahore',
      location: 'Township, Lahore',
      coordinates: '31.5714° N, 74.2459° E',
      image: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=2086',
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Available Sites</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sites.map((site) => (
          <div key={site.id} className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="h-48 overflow-hidden">
              <img
                src={site.image}
                alt={site.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="text-xl font-semibold mb-2">{site.name}</h3>
              <div className="space-y-2 text-gray-300">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{site.location}</span>
                </div>
                <p className="text-sm">{site.coordinates}</p>
              </div>
              <button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Sites