import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export interface ChartData {
    name: string;
    leads: number;
    visits: number;
    whatsapp: number;
}

interface SalesChartProps {
    data: ChartData[];
    loading: boolean;
}

const SalesChart = ({ data, loading }: SalesChartProps) => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h3 className="text-xl font-bold text-gray-800">Resumen de Actividad</h3>
            </div>

            <div className="flex-1 min-h-[300px] w-full relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                    </div>
                )}
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8280FF" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#8280FF" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorWhatsapp" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#FEC53D" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#FEC53D" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                            dy={10}
                            minTickGap={30}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                            dx={-10}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Area
                            name="Leads"
                            type="monotone"
                            dataKey="leads"
                            stroke="#2563EB"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorLeads)"
                        />
                        <Area
                            name="Visitas"
                            type="monotone"
                            dataKey="visits"
                            stroke="#8280FF"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorVisits)"
                        />
                        <Area
                            name="WhatsApp"
                            type="monotone"
                            dataKey="whatsapp"
                            stroke="#FEC53D"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorWhatsapp)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default SalesChart;
