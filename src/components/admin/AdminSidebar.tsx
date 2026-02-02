import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  MessageSquare, 
  Settings, 
  LogOut,
  Layers,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  onLogout: () => void;
}

const AdminSidebar = ({ onLogout }: SidebarProps) => {
  const location = useLocation();
  
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Package, label: 'Productos', path: '/admin/products' }, // Placeholder path
    { icon: Layers, label: 'Servicios', path: '/admin/services' }, // Placeholder
    { icon: MessageSquare, label: 'Contactos', path: '/admin/contacts' },
    { icon: Users, label: 'Usuarios', path: '/admin/users' },
  ];

  return (
    <div className="w-64 bg-white min-h-screen flex flex-col border-r border-gray-200">
      {/* Logo Area */}
      <div className="h-20 flex items-center px-8 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-800">
          <span className="text-[#4880FF]">Dash</span>Stack
        </h1>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6 px-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path === '/admin/dashboard' && location.pathname === '/admin-dashboard');
          
          return (
            <Link
              key={item.label}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-[#4880FF] text-white shadow-md shadow-blue-200" 
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-gray-500")} />
              {item.label}
            </Link>
          );
        })}

        <div className="mt-8 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
          Pages
        </div>
        
        <Link
          to="/admin/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 mt-2"
        >
          <Settings className="w-5 h-5 text-gray-500" />
          Configuración
        </Link>
      </div>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-100">
        <Button 
          variant="ghost" 
          onClick={onLogout}
          className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 gap-2"
        >
          <LogOut className="w-5 h-5" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
};

export default AdminSidebar;
