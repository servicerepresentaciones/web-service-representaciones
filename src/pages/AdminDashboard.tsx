import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import SalesChart, { ChartData } from '@/components/admin/SalesChart';
import StatCard from '@/components/admin/StatCard';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  startOfDay, endOfDay, subDays, format, startOfMonth, endOfMonth,
  subMonths, startOfYear, endOfYear, subYears, eachDayOfInterval, startOfWeek, endOfWeek
} from 'date-fns';
import { es } from 'date-fns/locale';

type DateRange =
  | 'today'
  | 'last_7_days'
  | 'last_15_days'
  | 'last_30_days'
  | 'current_month'
  | 'last_month'
  | 'last_3_months'
  | 'last_6_months'
  | 'last_12_months'
  | 'this_year'
  | 'last_year';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<DateRange>('last_15_days');
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [totals, setTotals] = useState({
    leads: 0,
    visits: 0,
    whatsapp: 0
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setUser(data.session.user);
      }
    });
  }, []);

  useEffect(() => {
    fetchData(range);
  }, [range]);

  const getDateRange = (range: DateRange) => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (range) {
      case 'today':
        start = startOfDay(now);
        end = endOfDay(now);
        break;
      case 'last_7_days':
        start = subDays(now, 6);
        end = endOfDay(now);
        break;
      case 'last_15_days':
        start = subDays(now, 14);
        end = endOfDay(now);
        break;
      case 'last_30_days':
        start = subDays(now, 29);
        end = endOfDay(now);
        break;
      case 'current_month':
        start = startOfMonth(now);
        end = endOfDay(now);
        break;
      case 'last_month':
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(subMonths(now, 1));
        break;
      case 'last_3_months':
        start = subMonths(now, 3);
        end = endOfDay(now);
        break;
      case 'last_6_months':
        start = subMonths(now, 6);
        end = endOfDay(now);
        break;
      case 'last_12_months':
        start = subMonths(now, 12);
        end = endOfDay(now);
        break;
      case 'this_year':
        start = startOfYear(now);
        end = endOfDay(now);
        break;
      case 'last_year':
        start = startOfYear(subYears(now, 1));
        end = endOfYear(subYears(now, 1));
        break;
    }
    return { start, end };
  };

  const fetchData = async (selectedRange: DateRange) => {
    setLoading(true);
    try {
      const { start, end } = getDateRange(selectedRange);
      const startDateStr = start.toISOString();
      const endDateStr = end.toISOString();

      // Fetch Daily Stats
      const { data: statsData } = await supabase
        .from('daily_stats')
        .select('date, visits, whatsapp_clicks')
        .gte('date', startDateStr.split('T')[0])
        .lte('date', endDateStr.split('T')[0])
        .order('date', { ascending: true });

      // Fetch Leads
      const { data: leadsData } = await supabase
        .from('leads')
        .select('created_at')
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr);

      // Generate all days in interval to prevent gaps
      const daysInterval = eachDayOfInterval({ start, end });

      const processedData: ChartData[] = daysInterval.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const displayDate = format(day, 'dd MMM', { locale: es });

        const stats = statsData?.find((s: any) => s.date === dateStr);
        const dayLeads = leadsData?.filter((l: any) =>
          l.created_at.startsWith(dateStr)
        ).length || 0;

        return {
          name: displayDate,
          leads: dayLeads,
          visits: stats?.visits || 0,
          whatsapp: stats?.whatsapp_clicks || 0,
        };
      });

      setChartData(processedData);

      // Calculate totals from the processed data
      const newTotals = processedData.reduce((acc, curr) => ({
        leads: acc.leads + curr.leads,
        visits: acc.visits + curr.visits,
        whatsapp: acc.whatsapp + curr.whatsapp
      }), { leads: 0, visits: 0, whatsapp: 0 });

      setTotals(newTotals);

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las estadísticas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const stats = [
    {
      title: 'Leads',
      value: totals.leads.toLocaleString(),
      trend: 0,
      icon: UserPlus,
      iconColor: 'text-accent',
      iconBgColor: 'bg-accent/10',
    },
    {
      title: 'Visitas',
      value: totals.visits.toLocaleString(),
      trend: 0,
      icon: Users,
      iconColor: 'text-[#8280FF]',
      iconBgColor: 'bg-[#E0DFFD]',
    },
    {
      title: 'Clicks WhatsApp',
      value: totals.whatsapp.toLocaleString(),
      trend: 0,
      trendLabel: 'Periodo Seleccionado',
      icon: MessageSquare,
      iconColor: 'text-[#FEC53D]',
      iconBgColor: 'bg-[#FFF5D9]',
    },
  ];

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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
              <p className="text-gray-500 mt-1">Resumen de actividad y métricas clave.</p>
            </div>

            <Select value={range} onValueChange={(val: DateRange) => setRange(val)}>
              <SelectTrigger className="w-[180px] bg-white border-gray-200">
                <SelectValue placeholder="Periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="last_7_days">Últimos 7 días</SelectItem>
                <SelectItem value="last_15_days">Últimos 15 días</SelectItem>
                <SelectItem value="last_30_days">Últimos 30 días</SelectItem>
                <SelectItem value="current_month">Mes Actual</SelectItem>
                <SelectItem value="last_month">Mes Anterior</SelectItem>
                <SelectItem value="last_3_months">Últimos 3 meses</SelectItem>
                <SelectItem value="last_6_months">Últimos 6 meses</SelectItem>
                <SelectItem value="last_12_months">Últimos 12 meses</SelectItem>
                <SelectItem value="this_year">Este Año</SelectItem>
                <SelectItem value="last_year">Año Pasado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
          <div className="grid grid-cols-1 gap-8">
            <div className="h-[400px]">
              <SalesChart data={chartData} loading={loading} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
