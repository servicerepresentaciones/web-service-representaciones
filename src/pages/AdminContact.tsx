import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Loader2, Phone, MapPin, Mail, Clock, Map, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

interface ContactSettings {
    id: string;
    contact_address: string;
    contact_phone_1: string;
    contact_phone_2: string;
    contact_email_1: string;
    contact_email_2: string;
    contact_schedule_week: string;
    contact_schedule_weekend: string;
    contact_map_url: string;
    contact_response_time: string;
    contact_title: string;
    contact_subtitle: string;
    contact_hero_title: string;
    contact_hero_subtitle: string;
}

const AdminContact = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [settings, setSettings] = useState<ContactSettings>({
        id: '',
        contact_address: '',
        contact_phone_1: '',
        contact_phone_2: '',
        contact_email_1: '',
        contact_email_2: '',
        contact_schedule_week: '',
        contact_schedule_weekend: '',
        contact_map_url: '',
        contact_response_time: '',
        contact_title: '',
        contact_subtitle: '',
        contact_hero_title: '',
        contact_hero_subtitle: '',
    });

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) {
                setUser(data.session.user);
            }
        });
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('site_settings')
                .select('*')
                .single();

            if (data) {
                setSettings({
                    id: data.id,
                    contact_address: data.contact_address || 'Av. Tecnología 1234, Piso 5\nCiudad Empresarial, CP 12345',
                    contact_phone_1: data.contact_phone_1 || '+1 (234) 567-890',
                    contact_phone_2: data.contact_phone_2 || '+1 (234) 567-891',
                    contact_email_1: data.contact_email_1 || 'info@servicerepresentaciones.com',
                    contact_email_2: data.contact_email_2 || 'ventas@servicerepresentaciones.com',
                    contact_schedule_week: data.contact_schedule_week || 'Lunes a Viernes: 9:00 - 18:00',
                    contact_schedule_weekend: data.contact_schedule_weekend || 'Sábados: 9:00 - 13:00',
                    contact_map_url: data.contact_map_url || 'https://www.google.com/maps/embed?pb=...',
                    contact_response_time: data.contact_response_time || 'Respuesta en 24 horas. Nos pondremos en contacto pronto.',
                    contact_title: data.contact_title || '¿Tienes alguna pregunta?',
                    contact_subtitle: data.contact_subtitle || 'Estamos aquí para ayudarte. Completa el formulario y nos pondremos en contacto contigo lo antes posible.',
                    contact_hero_title: data.contact_hero_title || 'Contáctanos',
                    contact_hero_subtitle: data.contact_hero_subtitle || 'Estamos listos para asesorarte en tu próximo proyecto tecnológico',
                });
            }
            if (error && error.code !== 'PGRST116') throw error;
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('site_settings')
                .update({
                    contact_address: settings.contact_address,
                    contact_phone_1: settings.contact_phone_1,
                    contact_phone_2: settings.contact_phone_2,
                    contact_email_1: settings.contact_email_1,
                    contact_email_2: settings.contact_email_2,
                    contact_schedule_week: settings.contact_schedule_week,
                    contact_schedule_weekend: settings.contact_schedule_weekend,
                    contact_map_url: settings.contact_map_url,
                    contact_response_time: settings.contact_response_time,
                    contact_title: settings.contact_title,
                    contact_subtitle: settings.contact_subtitle,
                    contact_hero_title: settings.contact_hero_title,
                    contact_hero_subtitle: settings.contact_hero_subtitle,
                })
                .eq('id', settings.id);

            if (error) throw error;

            toast({ title: 'Configuración guardada', description: 'La información de contacto ha sido actualizada.' });
        } catch (error: any) {
            toast({ title: 'Error al guardar', description: error.message, variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/admin');
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F5F6FA]"><Loader2 className="animate-spin text-accent w-12 h-12" /></div>;

    return (
        <div className="min-h-screen bg-[#F5F6FA] flex">
            <div className="hidden lg:block relative z-20">
                <AdminSidebar onLogout={handleLogout} />
            </div>
            <div className="flex-1 flex flex-col min-w-0">
                <AdminHeader userEmail={user?.email} />
                <main className="p-4 lg:p-8 overflow-y-auto max-h-[calc(100vh-80px)]">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                                    <Phone className="w-8 h-8 text-accent" /> Información de Contacto
                                </h2>
                                <p className="text-gray-500 mt-2">Gestiona la información de contacto y ubicación de la empresa.</p>
                            </div>
                            <Button onClick={handleSave} disabled={saving} className="bg-accent hover:bg-accent/90 text-white gap-2 shadow-lg">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Guardar Cambios
                            </Button>
                        </div>

                        <div className="grid gap-6">

                            {/* Header Hero Settings */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-700">
                                    <Settings className="w-5 h-5 text-accent" /> Encabezado Hero (Banner)
                                </h3>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-600">Título Hero</label>
                                        <Input
                                            value={settings.contact_hero_title}
                                            onChange={e => setSettings({ ...settings, contact_hero_title: e.target.value })}
                                            placeholder="Ej: Contáctanos"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-600">Subtítulo Hero</label>
                                        <Input
                                            value={settings.contact_hero_subtitle}
                                            onChange={e => setSettings({ ...settings, contact_hero_subtitle: e.target.value })}
                                            placeholder="Ej: Estamos listos para asesorarte..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section Header Settings */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-700">
                                    <Settings className="w-5 h-5 text-accent" /> Encabezado de la Sección
                                </h3>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-600">Título</label>
                                    <Input
                                        value={settings.contact_title}
                                        onChange={e => setSettings({ ...settings, contact_title: e.target.value })}
                                        placeholder="Ej: ¿Tienes alguna pregunta?"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-600">Subtítulo</label>
                                    <Textarea
                                        value={settings.contact_subtitle}
                                        onChange={e => setSettings({ ...settings, contact_subtitle: e.target.value })}
                                        placeholder="Ej: Estamos aquí para ayudarte..."
                                        className="h-20 resize-none"
                                    />
                                </div>
                            </div>

                            {/* Address & Map */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-700">
                                    <MapPin className="w-5 h-5 text-accent" /> Ubicación
                                </h3>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-600">Dirección Física</label>
                                            <Textarea
                                                value={settings.contact_address}
                                                onChange={e => setSettings({ ...settings, contact_address: e.target.value })}
                                                placeholder="Dirección completa..."
                                                className="h-32 resize-none"
                                            />
                                            <p className="text-xs text-gray-400">Esta dirección aparecerá en el pie de página y página de contacto.</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-600 flex items-center gap-2">
                                                <Map className="w-4 h-4" /> URL del Mapa (Embed)
                                            </label>
                                            <Input
                                                value={settings.contact_map_url}
                                                onChange={e => setSettings({ ...settings, contact_map_url: e.target.value })}
                                                placeholder="https://www.google.com/maps/embed?..."
                                            />
                                            <p className="text-xs text-gray-400">
                                                Pega aquí el enlace del iframe ("src") de Google Maps.
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-600">Mensaje de Tiempo de Respuesta</label>
                                            <Input
                                                value={settings.contact_response_time}
                                                onChange={e => setSettings({ ...settings, contact_response_time: e.target.value })}
                                                placeholder="Ej: Respuesta en 24 horas. Nos pondremos en contacto pronto."
                                            />
                                            <p className="text-xs text-gray-400">Este texto aparece abajo a la derecha de la información de contacto.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Phones & Emails */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-700">
                                        <Phone className="w-5 h-5 text-accent" /> Comunicación
                                    </h3>

                                    <div className="space-y-4">
                                        <label className="text-sm font-bold text-gray-600 uppercase text-xs tracking-wider">Teléfonos</label>
                                        <div className="grid gap-4">
                                            <Input
                                                value={settings.contact_phone_1}
                                                onChange={e => setSettings({ ...settings, contact_phone_1: e.target.value })}
                                                placeholder="Teléfono Principal"
                                            />
                                            <Input
                                                value={settings.contact_phone_2}
                                                onChange={e => setSettings({ ...settings, contact_phone_2: e.target.value })}
                                                placeholder="Teléfono Secundario (Opcional)"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-sm font-bold text-gray-600 uppercase text-xs tracking-wider flex items-center gap-2">
                                            <Mail className="w-4 h-4" /> Correos Electrónicos
                                        </label>
                                        <div className="grid gap-4">
                                            <Input
                                                value={settings.contact_email_1}
                                                onChange={e => setSettings({ ...settings, contact_email_1: e.target.value })}
                                                placeholder="Email Principal (Info)"
                                            />
                                            <Input
                                                value={settings.contact_email_2}
                                                onChange={e => setSettings({ ...settings, contact_email_2: e.target.value })}
                                                placeholder="Email Secundario (Ventas)"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Schedule */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-700">
                                        <Clock className="w-5 h-5 text-accent" /> Horarios de Atención
                                    </h3>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-600">Días Laborales (Semana)</label>
                                            <Input
                                                value={settings.contact_schedule_week}
                                                onChange={e => setSettings({ ...settings, contact_schedule_week: e.target.value })}
                                                placeholder="Ej: Lunes a Viernes: 9:00 - 18:00"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-600">Fin de Semana</label>
                                            <Input
                                                value={settings.contact_schedule_weekend}
                                                onChange={e => setSettings({ ...settings, contact_schedule_weekend: e.target.value })}
                                                placeholder="Ej: Sábados: 9:00 - 13:00"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main >
            </div >
        </div >
    );
};

export default AdminContact;
