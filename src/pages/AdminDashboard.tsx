import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, Settings, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

// Admin Components
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import StatCard from '@/components/admin/StatCard';
import SalesChart from '@/components/admin/SalesChart';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Stats data
  const stats = [
    {
      title: 'Leads Totales',
      value: '1,284',
      trend: 12.5,
      icon: UserPlus,
      iconColor: 'text-accent',
      iconBgColor: 'bg-accent/10',
    },
    {
      title: 'Visitas Hoy',
      value: '45,689',
      trend: 8.5,
      icon: Users,
      iconColor: 'text-[#8280FF]',
      iconBgColor: 'bg-[#E0DFFD]',
    },
    {
      title: 'Nuevos Mensajes',
      value: '24',
      trend: 5.2,
      trendLabel: 'Últimas 24 horas',
      icon: FileText,
      iconColor: 'text-[#FEC53D]',
      iconBgColor: 'bg-[#FFF5D9]',
    },
    {
      title: 'Conversiones',
      value: '3.2%',
      trend: 1.8,
      icon: Settings,
      iconColor: 'text-[#4AD991]',
      iconBgColor: 'bg-[#DAFBE6]',
    },
  ];

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();

        if (!data.session) {
          navigate('/admin');
          return;
        }

        setUser(data.session.user);
      } catch (error) {
        console.error('Error checking auth:', error);
        navigate('/admin');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: 'Sesión cerrada',
        description: 'Has cerrado sesión correctamente',
      });
      navigate('/admin');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cerrar sesión',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex">
      {/* Sidebar - Hidden on mobile, controlled by state or CSS in real app */}
      <div className="hidden lg:block relative z-20">
        <AdminSidebar onLogout={handleLogout} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader userEmail={user?.email} />

        <main className="p-4 lg:p-8 overflow-y-auto max-h-[calc(100vh-80px)]">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h2>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <StatCard
                key={index}
                title={stat.title}
                value={stat.value}
                trend={stat.trend}
                trendLabel={stat.trendLabel}
                icon={stat.icon}
                iconColor={stat.iconColor}
                iconBgColor={stat.iconBgColor}
              />
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            <SalesChart />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;

