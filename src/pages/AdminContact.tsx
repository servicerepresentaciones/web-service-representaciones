import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Loader2, Phone, MapPin, Mail, Clock, Map, Settings, Upload, Image as ImageIcon, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import PageLoading from '@/components/PageLoading';

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
    contact_hero_image: string;
}

const AdminContact = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [uploadingGeneric, setUploadingGeneric] = useState(false);
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
        contact_hero_image: '',
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

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
            const [settingsRes, logoRes] = await Promise.all([
                supabase.from('site_settings').select('*').single(),
                supabase.from('site_settings').select('logo_url_dark').single()
            ]);

            if (settingsRes.data) {
                setSettings({
                    id: settingsRes.data.id,
                    contact_address: settingsRes.data.contact_address || 'Av. Tecnología 1234, Piso 5\nCiudad Empresarial, CP 12345',
                    contact_phone_1: settingsRes.data.contact_phone_1 || '+1 (234) 567-890',
                    contact_phone_2: settingsRes.data.contact_phone_2 || '+1 (234) 567-891',
                    contact_email_1: settingsRes.data.contact_email_1 || 'info@servicerepresentaciones.com',
                    contact_email_2: settingsRes.data.contact_email_2 || 'ventas@servicerepresentaciones.com',
                    contact_schedule_week: settingsRes.data.contact_schedule_week || 'Lunes a Viernes: 9:00 - 18:00',
                    contact_schedule_weekend: settingsRes.data.contact_schedule_weekend || 'Sábados: 9:00 - 13:00',
                    contact_map_url: settingsRes.data.contact_map_url || 'https://www.google.com/maps/embed?pb=...',
                    contact_response_time: settingsRes.data.contact_response_time || 'Respuesta en 24 horas. Nos pondremos en contacto pronto.',
                    contact_title: settingsRes.data.contact_title || '¿Tienes alguna pregunta?',
                    contact_subtitle: settingsRes.data.contact_subtitle || 'Estamos aquí para ayudarte. Completa el formulario y nos pondremos en contacto contigo lo antes posible.',
                    contact_hero_title: settingsRes.data.contact_hero_title || 'Contáctanos',
                    contact_hero_subtitle: settingsRes.data.contact_hero_subtitle || 'Estamos listos para asesorarte en tu próximo proyecto tecnológico',
                    contact_hero_image: settingsRes.data.contact_hero_image || '',
                });
            }
            if (logoRes.data?.logo_url_dark) {
                setLogoUrl(logoRes.data.logo_url_dark);
            }
            if (settingsRes.error && settingsRes.error.code !== 'PGRST116') throw settingsRes.error;
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteOldImage = async (url: string) => {
        if (!url) return;
        try {
            // Extract file path from URL
            // Format: .../storage/v1/object/public/site-assets/folder/filename.ext
            const pathParts = url.split('/site-assets/');
            if (pathParts.length < 2) return;

            const filePath = pathParts[1].split('?')[0]; // Remove query params

            const { error } = await supabase.storage
                .from('site-assets')
                .remove([filePath]);

            if (error) console.error('Error deleting old image:', error);
        } catch (error) {
            console.error('Error parsing/deleting old image:', error);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast({ title: "Error", description: "La imagen debe ser menor a 2MB", variant: "destructive" });
            return;
        }

        setUploadingGeneric(true);
        try {
            // Delete old image if exists
            if (settings.contact_hero_image) {
                await deleteOldImage(settings.contact_hero_image);
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `contact-hero-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('site-assets')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('site-assets')
                .getPublicUrl(fileName);

            const finalUrl = `${publicUrl}?t=${Date.now()}`;
            setSettings({ ...settings, contact_hero_image: finalUrl });
            toast({ title: "Imagen subida", description: "La imagen se ha cargado correctamente." });
        } catch (error: any) {
            toast({ title: "Error al subir", description: error.message, variant: "destructive" });
        } finally {
            setUploadingGeneric(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemoveImage = async () => {
        if (!confirm('¿Estás seguro de eliminar la imagen actual?')) return;

        try {
            if (settings.contact_hero_image) {
                await deleteOldImage(settings.contact_hero_image);
            }
            setSettings({ ...settings, contact_hero_image: '' });
            toast({ title: "Imagen eliminada" });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
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
                    contact_hero_image: settings.contact_hero_image,
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

    if (loading) return <PageLoading logoUrl={logoUrl} />;

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
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-700">
                                    <Settings className="w-5 h-5 text-accent" /> Encabezado Hero (Banner)
                                </h3>

                                <div className="grid md:grid-cols-2 gap-6 items-start">
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

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-600">Imagen de Fondo</label>
                                        <div className="relative group rounded-xl overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50 min-h-[160px] flex flex-col items-center justify-center text-center p-4">
                                            {settings.contact_hero_image ? (
                                                <>
                                                    <img
                                                        src={settings.contact_hero_image}
                                                        alt="Hero Background"
                                                        className="absolute inset-0 w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            onClick={() => fileInputRef.current?.click()}
                                                            disabled={uploadingGeneric}
                                                            className="h-8"
                                                        >
                                                            <Upload className="w-4 h-4 mr-2" /> Cambiar
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={handleRemoveImage}
                                                            className="h-8 px-2"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="p-3 bg-white rounded-full shadow-sm">
                                                        <ImageIcon className="w-6 h-6 text-gray-400" />
                                                    </div>
                                                    <div>
                                                        <Button
                                                            variant="ghost"
                                                            onClick={() => fileInputRef.current?.click()}
                                                            disabled={uploadingGeneric}
                                                            className="text-accent hover:text-accent/80 hover:bg-accent/10"
                                                        >
                                                            {uploadingGeneric ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                                                            Subir imagen
                                                        </Button>
                                                        <p className="text-xs text-gray-400 mt-1">Recomendado: 1920x600px (Max 2MB)</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleImageUpload}
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
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    // Si pegan el iframe completo, extraemos solo el src
                                                    if (val.includes('<iframe')) {
                                                        const match = val.match(/src="([^"]+)"/);
                                                        if (match && match[1]) {
                                                            setSettings({ ...settings, contact_map_url: match[1] });
                                                            toast({ title: "Enlace extraído", description: "Se ha extraído automáticamente el enlace del mapa." });
                                                            return;
                                                        }
                                                    }
                                                    setSettings({ ...settings, contact_map_url: val });
                                                }}
                                                placeholder="https://www.google.com/maps/embed?..."
                                            />
                                            <p className="text-[10px] text-gray-400 leading-relaxed">
                                                <strong>Instrucciones:</strong> En Google Maps, ve a Compartir {'>'} Incorporar un mapa y pulsa "Copiar HTML". Pégalo aquí directamente y extraeremos el enlace por ti.
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
        </div>
    );
};

export default AdminContact;
