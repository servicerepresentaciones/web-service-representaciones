import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  MessageSquare,
  Settings,
  LogOut,
  Layers,
  Users,
  Image as ImageIcon,
  Tags,
  Megaphone,
  BadgeCheck,
  Phone,
  UserPlus,
  Search,
  Code,
  PanelBottom,
  Share2,
  Info,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

import { supabase } from '@/lib/supabase';

interface SidebarProps {
  onLogout: () => void;
}

const AdminSidebar = ({ onLogout }: SidebarProps) => {
  const location = useLocation();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('logo_url_light')
          .single();
        if (data?.logo_url_light) {
          setLogoUrl(data.logo_url_light);
        }
      } catch (error) {
        console.error('Error fetching logo:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogo();
  }, []);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: ImageIcon, label: 'Sliders', path: '/admin/sliders' },
    { icon: Tags, label: 'Categorías', path: '/admin/categories' },
    { icon: BadgeCheck, label: 'Marcas', path: '/admin/brands' },
    { icon: Package, label: 'Productos', path: '/admin/products' },
    { icon: Layers, label: 'Servicios', path: '/admin/services' },
    { icon: FileText, label: 'Blog', path: '/admin/blog' },
    { icon: Megaphone, label: 'CTA', path: '/admin/cta' },
    { icon: Phone, label: 'Contacto', path: '/admin/contact-info' },
    { icon: UserPlus, label: 'Leads', path: '/admin/leads' },
    { icon: Search, label: 'SEO', path: '/admin/seo' },
    { icon: Code, label: 'Scripts', path: '/admin/scripts' },
    { icon: Info, label: 'Nosotros', path: '/admin/nosotros' },
    { icon: PanelBottom, label: 'Footer', path: '/admin/footer' },
    { icon: Share2, label: 'Redes Sociales', path: '/admin/social' },
  ];

  return (
    <div className="w-64 bg-white min-h-screen flex flex-col border-r border-gray-200">
      <div className="h-24 flex items-center px-4 border-b border-gray-100">
        <Link to="/admin/dashboard" className="flex items-center justify-center w-full">
          {loading ? (
            <div className="h-10 w-32 bg-gray-50 animate-pulse rounded-lg" />
          ) : logoUrl ? (
            <img src={logoUrl} alt="Logo" className="max-w-full max-h-16 object-contain w-full" />
          ) : (
            // Espacio vacío mientras carga el logo
            <div className="h-10 w-full" />
          )}
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        <div className="px-4 mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
          Menú Principal
        </div>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path === '/admin/dashboard' && location.pathname === '/admin-dashboard');

          return (
            <Link
              key={item.label}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-white shadow-md shadow-accent/20"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-gray-500")} />
              {item.label}
            </Link>
          );
        })}

        <div className="mt-8 px-4 mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
          Sistema
        </div>

        <Link
          to="/admin/settings"
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
            location.pathname === '/admin/settings'
              ? "bg-accent text-white shadow-md shadow-accent/20"
              : "text-gray-600 hover:bg-gray-50"
          )}
        >
          <Settings className={cn("w-5 h-5", location.pathname === '/admin/settings' ? "text-white" : "text-gray-500")} />
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
