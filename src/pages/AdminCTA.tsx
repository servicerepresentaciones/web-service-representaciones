import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Loader2, Megaphone, Image as ImageIcon, Trash2, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

interface CtaSettings {
    id: string;
    cta_badge: string;
    cta_title: string;
    cta_description: string;
    cta_button_primary_text: string;
    cta_button_primary_url: string;
    cta_button_secondary_text: string;
    cta_button_secondary_url: string;
    cta_bg_image: string | null;
}

const AdminCTA = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [settings, setSettings] = useState<CtaSettings>({
        id: '',
        cta_badge: '',
        cta_title: '',
        cta_description: '',
        cta_button_primary_text: '',
        cta_button_primary_url: '',
        cta_button_secondary_text: '',
        cta_button_secondary_url: '',
        cta_bg_image: null,
    });

    // For handling file upload cleanup
    const [originalBg, setOriginalBg] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

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
                    // Default values if null
                    cta_badge: data.cta_badge || '¿Listo para transformar tu empresa?',
                    cta_title: data.cta_title || 'Impulsa tu negocio con tecnología de vanguardia',
                    cta_description: data.cta_description || 'Nuestro equipo de expertos está listo para ayudarte a encontrar las mejores soluciones tecnológicas para tus necesidades empresariales.',
                    cta_button_primary_text: data.cta_button_primary_text || 'Solicitar Consulta Gratuita',
                    cta_button_primary_url: data.cta_button_primary_url || '/contacto',
                    cta_button_secondary_text: data.cta_button_secondary_text || 'Ver Catálogo Completo',
                    cta_button_secondary_url: data.cta_button_secondary_url || '/productos',
                    cta_bg_image: data.cta_bg_image || null,
                });
                setOriginalBg(data.cta_bg_image);
            }
            if (error && error.code !== 'PGRST116') throw error;
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileName = `cta/bg-${Date.now()}`;
            const { error: uploadError } = await supabase.storage
                .from('site-assets')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('site-assets')
                .getPublicUrl(fileName);

            const finalUrl = `${publicUrl}?t=${Date.now()}`;
            setSettings(prev => ({ ...prev, cta_bg_image: finalUrl }));
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveImage = () => {
        setSettings(prev => ({ ...prev, cta_bg_image: null }));
    };

    const extractFilePath = (url: string) => {
        if (!url) return null;
        const urlWithoutQuery = url.split('?')[0];
        const parts = urlWithoutQuery.split('site-assets/');
        return parts.length > 1 ? parts[1] : null;
    };

    const deleteFromStorage = async (url: string) => {
        const filePath = extractFilePath(url);
        if (filePath) {
            await supabase.storage.from('site-assets').remove([filePath]);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('site_settings')
                .update({
                    cta_badge: settings.cta_badge,
                    cta_title: settings.cta_title,
                    cta_description: settings.cta_description,
                    cta_button_primary_text: settings.cta_button_primary_text,
                    cta_button_primary_url: settings.cta_button_primary_url,
                    cta_button_secondary_text: settings.cta_button_secondary_text,
                    cta_button_secondary_url: settings.cta_button_secondary_url,
                    cta_bg_image: settings.cta_bg_image
                })
                .eq('id', settings.id);

            if (error) throw error;

            // Cleanup old image if changed
            if (originalBg && originalBg !== settings.cta_bg_image) {
                await deleteFromStorage(originalBg);
            }
            setOriginalBg(settings.cta_bg_image);

            toast({ title: 'Configuración guardada', description: 'La sección CTA ha sido actualizada.' });
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
                                    <Megaphone className="w-8 h-8 text-accent" /> Gestión de CTA
                                </h2>
                                <p className="text-gray-500 mt-2">Personaliza la sección de llamada a la acción en la página de inicio.</p>
                            </div>
                            <Button onClick={handleSave} disabled={saving} className="bg-accent hover:bg-accent/90 text-white gap-2 shadow-lg">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Guardar Cambios
                            </Button>
                        </div>

                        <div className="grid gap-8">
                            {/* Image Section */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><ImageIcon className="w-5 h-5 text-accent" /> Fondo del CTA</h3>
                                <div className="aspect-[21/9] bg-gray-50 border-2 border-dashed rounded-xl flex flex-col items-center justify-center relative group overflow-hidden">
                                    {settings.cta_bg_image ? (
                                        <>
                                            <img src={settings.cta_bg_image} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>Cambiar</Button>
                                                    <Button size="sm" variant="destructive" onClick={handleRemoveImage}>Quitar</Button>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center cursor-pointer p-6" onClick={() => fileInputRef.current?.click()}>
                                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
                                                {uploading ? <Loader2 className="animate-spin text-accent" /> : <Upload className="text-accent" />}
                                            </div>
                                            <p className="text-sm font-medium text-gray-600">Click para subir fondo personalizado</p>
                                            <p className="text-xs text-gray-400 mt-1">Si no se sube imagen, se usará el gradiente por defecto.</p>
                                        </div>
                                    )}
                                </div>
                                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />
                            </div>

                            {/* Content Section */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold">Badge (Etiqueta superior)</label>
                                    <Input
                                        value={settings.cta_badge}
                                        onChange={e => setSettings({ ...settings, cta_badge: e.target.value })}
                                        placeholder="Ej. ¿Listo para transformar tu empresa?"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold">Título Principal</label>
                                    <Input
                                        value={settings.cta_title}
                                        onChange={e => setSettings({ ...settings, cta_title: e.target.value })}
                                        placeholder="Ej. Impulsa tu negocio con tecnología de vanguardia"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold">Descripción</label>
                                    <Textarea
                                        value={settings.cta_description}
                                        onChange={e => setSettings({ ...settings, cta_description: e.target.value })}
                                        placeholder="Ej. Nuestro equipo de expertos..."
                                        className="resize-none h-24"
                                    />
                                </div>
                            </div>

                            {/* Buttons Section */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="font-bold text-accent">Botón Primario</h4>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold">Texto</label>
                                        <Input
                                            value={settings.cta_button_primary_text}
                                            onChange={e => setSettings({ ...settings, cta_button_primary_text: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold">Enlace (URL)</label>
                                        <Input
                                            value={settings.cta_button_primary_url}
                                            onChange={e => setSettings({ ...settings, cta_button_primary_url: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="font-bold text-gray-500">Botón Secundario</h4>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold">Texto</label>
                                        <Input
                                            value={settings.cta_button_secondary_text}
                                            onChange={e => setSettings({ ...settings, cta_button_secondary_text: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold">Enlace (URL)</label>
                                        <Input
                                            value={settings.cta_button_secondary_url}
                                            onChange={e => setSettings({ ...settings, cta_button_secondary_url: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminCTA;
