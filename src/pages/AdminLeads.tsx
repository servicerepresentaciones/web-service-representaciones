import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    UserPlus,
    Search,
    Filter,
    Loader2,
    Mail,
    Phone,
    Calendar,
    MessageSquare,
    Eye,
    ChevronRight,
    CheckCircle2,
    Clock,
    AlertCircle,
    XCircle,
    Download,
    Building2,
    User,
    Package,
    Settings as SettingsIcon
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import PageLoading from '@/components/PageLoading';
import { cn } from '@/lib/utils';

interface Lead {
    id: string;
    created_at: string;
    full_name: string;
    email: string;
    phone: string | null;
    subject: string;
    message: string;
    status: 'new' | 'in_progress' | 'contacted' | 'discarded';
    client_type: 'natural' | 'company' | null;
    ruc: string | null;
    interest_type: 'product' | 'service' | 'both' | null;
    requested_product: string | null;
    requested_service: string | null;
}

const statusConfig = {
    new: { label: 'Nuevo', color: 'bg-blue-500', icon: AlertCircle, text: 'text-blue-600', bg: 'bg-blue-50' },
    in_progress: { label: 'En Proceso', color: 'bg-orange-500', icon: Clock, text: 'text-orange-600', bg: 'bg-orange-50' },
    contacted: { label: 'Contactado', color: 'bg-green-500', icon: CheckCircle2, text: 'text-green-600', bg: 'bg-green-50' },
    discarded: { label: 'Descartado', color: 'bg-gray-500', icon: XCircle, text: 'text-gray-600', bg: 'bg-gray-50' },
};

const AdminLeads = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Lead Detail Modal
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [logoUrl, setLogoUrl] = useState<string>('');

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) {
                setUser(data.session.user);
            }
        });
        fetchLeads();
        fetchLogo();
    }, []);

    const fetchLogo = async () => {
        try {
            const { data } = await supabase.from('site_settings').select('logo_url_dark').single();
            if (data?.logo_url_dark) setLogoUrl(data.logo_url_dark);
        } catch (error) {
            console.error('Error fetching logo:', error);
        }
    };

    const fetchLeads = async () => {
        try {
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLeads(data || []);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: Lead['status']) => {
        setUpdatingStatus(true);
        try {
            const { error } = await supabase
                .from('leads')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            setLeads(leads.map(lead => lead.id === id ? { ...lead, status: newStatus } : lead));
            if (selectedLead?.id === id) {
                setSelectedLead({ ...selectedLead, status: newStatus });
            }

            toast({ title: "Estado actualizado" });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setUpdatingStatus(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredLeads = leads.filter(lead => {
        const matchesSearch =
            lead.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.subject.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;

        const leadDate = new Date(lead.created_at);
        const matchesDate = (!startDate || leadDate >= new Date(startDate)) &&
            (!endDate || leadDate <= new Date(endDate + 'T23:59:59'));

        return matchesSearch && matchesStatus && matchesDate;
    });

    const exportToCSV = () => {
        const headers = [
            'Fecha Registro',
            'Nombre del Lead',
            'Correo Electrónico',
            'Teléfono',
            'Tipo de Cliente',
            'Número RUC',
            'Interés Principal',
            'Producto Solicitado',
            'Servicio Solicitado',
            'Asunto del Mensaje',
            'Mensaje/Consulta',
            'Estado Actual'
        ];

        const clean = (str: string | null) => {
            if (!str) return '""';
            return `"${str.toString().replace(/"/g, '""').replace(/\n/g, ' ').replace(/\r/g, '')}"`;
        };

        const rows = filteredLeads.map(lead => [
            clean(formatDate(lead.created_at)),
            clean(lead.full_name),
            clean(lead.email),
            clean(lead.phone),
            clean(lead.client_type === 'company' ? 'Empresa' : 'Persona Natural'),
            clean(lead.ruc),
            clean(lead.interest_type === 'product' ? 'Producto' : lead.interest_type === 'service' ? 'Servicio' : 'Ambos'),
            clean(lead.requested_product),
            clean(lead.requested_service),
            clean(lead.subject),
            clean(lead.message),
            clean(statusConfig[lead.status].label)
        ].join(';'));

        const csvContent = 'sep=;\n' + headers.join(';') + '\n' + rows.join('\n');
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `leads_service_representaciones_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
            title: "Exportación completada",
            description: "El archivo se ha descargado correctamente.",
        });
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/admin');
    };

    if (loading) {
        return <PageLoading logoUrl={logoUrl} />;
    }

    return (
        <div className="min-h-screen bg-[#F5F6FA] flex">
            <div className="hidden lg:block relative z-20">
                <AdminSidebar onLogout={handleLogout} />
            </div>
            <div className="flex-1 flex flex-col min-w-0">
                <AdminHeader userEmail={user?.email} />
                <main className="p-4 lg:p-8 overflow-y-auto max-h-[calc(100vh-80px)]">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <div>
                                <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                                    <UserPlus className="w-8 h-8 text-accent" /> Leads de Contacto
                                </h2>
                                <p className="text-gray-500 mt-2">Gestiona {leads.length} mensajes recibidos.</p>
                            </div>
                            <Button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700 text-white gap-2 shadow-lg">
                                <Download className="w-4 h-4" /> Exportar a Excel (CSV)
                            </Button>
                        </div>

                        {/* Filters */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4 mb-6">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                    <Input
                                        placeholder="Buscar por nombre, email o asunto..."
                                        className="pl-12 bg-gray-50 border-none h-12 rounded-xl"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {['all', 'new', 'in_progress', 'contacted', 'discarded'].map((status) => (
                                        <Button
                                            key={status}
                                            variant={statusFilter === status ? 'default' : 'outline'}
                                            onClick={() => setStatusFilter(status)}
                                            className={cn(
                                                "capitalize px-4 h-12 rounded-xl",
                                                statusFilter === status ? "bg-accent text-white shadow-sm" : "text-gray-600 bg-gray-50 border-none"
                                            )}
                                        >
                                            {status === 'all' ? 'Todos' : statusConfig[status as Lead['status']].label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-gray-50">
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <span className="text-sm font-bold text-gray-400 uppercase tracking-tighter shrink-0">Desde:</span>
                                    <Input
                                        type="date"
                                        className="bg-gray-50 border-none h-10 rounded-lg"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <span className="text-sm font-bold text-gray-400 uppercase tracking-tighter shrink-0">Hasta:</span>
                                    <Input
                                        type="date"
                                        className="bg-gray-50 border-none h-10 rounded-lg"
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                    />
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-gray-400 hover:bg-accent hover:text-white transition-colors"
                                    onClick={() => { setStartDate(''); setEndDate(''); }}
                                >
                                    Limpiar fechas
                                </Button>
                                <div className="flex-1" />
                                <p className="text-sm text-gray-400 font-medium">
                                    Mostrando <span className="text-gray-800">{filteredLeads.length}</span> resultados
                                </p>
                            </div>
                        </div>

                        {/* Leads List */}
                        <div className="space-y-4">
                            {filteredLeads.length === 0 ? (
                                <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-gray-200">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Mail className="w-8 h-8 text-gray-300" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-700">No se encontraron leads</h3>
                                    <p className="text-gray-400 max-w-xs mx-auto mt-2">
                                        No hay mensajes de contacto que coincidan con los filtros seleccionados.
                                    </p>
                                </div>
                            ) : (
                                filteredLeads.map((lead) => (
                                    <div
                                        key={lead.id}
                                        onClick={() => { setSelectedLead(lead); setIsDetailsOpen(true); }}
                                        className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-accent/20 transition-all cursor-pointer group"
                                    >
                                        <div className="flex flex-col md:flex-row gap-4 md:items-center">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="font-bold text-gray-800 text-lg truncate">{lead.full_name}</h3>
                                                    <span className={cn(
                                                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                                                        statusConfig[lead.status].bg,
                                                        statusConfig[lead.status].text
                                                    )}>
                                                        {statusConfig[lead.status].label}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                                    <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {lead.email}</span>
                                                    {lead.phone && <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> {lead.phone}</span>}
                                                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {formatDate(lead.created_at)}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm font-medium text-gray-700 bg-gray-50 px-4 py-2 rounded-lg">
                                                <div className="truncate max-w-[200px]">
                                                    <span className="text-gray-400 text-xs block uppercase font-bold tracking-tighter">Asunto</span>
                                                    {lead.subject}
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-accent transition-colors" />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* Lead Details Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            Detalles del Lead
                        </DialogTitle>
                    </DialogHeader>

                    {selectedLead && (
                        <div className="space-y-6 py-4">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tipo de Cliente</label>
                                    <div className="flex items-center gap-2 text-gray-800 font-bold">
                                        {selectedLead.client_type === 'company' ? (
                                            <><Building2 className="w-4 h-4 text-accent" /> Empresa (RUC: {selectedLead.ruc})</>
                                        ) : (
                                            <><User className="w-4 h-4 text-accent" /> Persona Natural</>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Interés</label>
                                    <div className="flex items-center gap-2 text-gray-800 font-bold capitalize">
                                        {selectedLead.interest_type === 'product' && <><Package className="w-4 h-4 text-orange-500" /> Producto</>}
                                        {selectedLead.interest_type === 'service' && <><SettingsIcon className="w-4 h-4 text-blue-500" /> Servicio</>}
                                        {selectedLead.interest_type === 'both' && <><AlertCircle className="w-4 h-4 text-green-500" /> Ambos (Prod. y Serv.)</>}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nombre Completo</label>
                                    <p className="text-lg font-bold text-gray-800">{selectedLead.full_name}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Fecha de Recepción</label>
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Calendar className="w-4 h-4" />
                                        {formatDate(selectedLead.created_at)}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email</label>
                                    <a href={`mailto:${selectedLead.email}`} className="flex items-center gap-2 text-accent hover:underline font-medium">
                                        <Mail className="w-4 h-4" />
                                        {selectedLead.email}
                                    </a>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Teléfono</label>
                                    {selectedLead.phone ? (
                                        <a href={`tel:${selectedLead.phone}`} className="flex items-center gap-2 text-gray-600 font-medium">
                                            <Phone className="w-4 h-4" />
                                            {selectedLead.phone}
                                        </a>
                                    ) : <p className="text-gray-400 italic">No proporcionado</p>}
                                </div>
                            </div>

                            {(selectedLead.requested_product || selectedLead.requested_service) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {selectedLead.requested_product && (
                                        <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                                            <label className="text-[10px] font-bold text-orange-400 uppercase tracking-widest block mb-1">Producto Solicitado</label>
                                            <p className="text-orange-900 font-bold">{selectedLead.requested_product}</p>
                                        </div>
                                    )}
                                    {selectedLead.requested_service && (
                                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                            <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-1">Servicio Solicitado</label>
                                            <p className="text-blue-900 font-bold">{selectedLead.requested_service}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Asunto</label>
                                    <p className="font-bold text-gray-800">{selectedLead.subject}</p>
                                </div>
                                <div className="space-y-1 border-t pt-3 border-gray-200">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Mensaje</label>
                                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedLead.message}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cambiar Estado</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {(['new', 'in_progress', 'contacted', 'discarded'] as const).map((status) => {
                                        const config = statusConfig[status];
                                        return (
                                            <button
                                                key={status}
                                                disabled={updatingStatus}
                                                onClick={() => handleUpdateStatus(selectedLead.id, status)}
                                                className={cn(
                                                    "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all gap-1.5",
                                                    selectedLead.status === status
                                                        ? cn("border-accent bg-accent/5", config.text)
                                                        : "border-gray-100 hover:border-gray-200 text-gray-500"
                                                )}
                                            >
                                                <config.icon className="w-5 h-5" />
                                                <span className="text-[10px] font-bold uppercase">{config.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1" />
                        <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Cerrar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminLeads;
