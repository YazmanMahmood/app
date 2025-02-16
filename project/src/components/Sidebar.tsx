import { NavLink } from 'react-router-dom';
import { Bone as Drone, MapPin, Settings, Camera, Menu, Play } from 'lucide-react';

function Sidebar() {
  const menuItems = [
    { icon: Drone, text: 'Mission Planner', path: '/mission-planner' },
    { icon: MapPin, text: 'Sites', path: '/sites' },
    { icon: Camera, text: 'Drone View', path: '/camera' },
    { icon: Settings, text: 'Settings', path: '/settings' },
    { icon: Play, text: 'Demo Mission', path: '/demo-mission' },
  ];

  return (
    <div className="w-64 bg-gray-800 p-4 flex flex-col">
      <div className="flex items-center gap-3 mb-8">
        <Drone className="w-8 h-8 text-blue-400" />
        <h1 className="text-xl font-bold">DroneControl</h1>
      </div>
      
      <nav className="flex-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.text}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default Sidebar