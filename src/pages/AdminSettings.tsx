import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Upload, Loader2, Globe, Image as ImageIcon, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

const AdminSettings = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [settings, setSettings] = useState({
        id: '',
        logo_url_light: '',
        logo_url_dark: '',
        favicon_url: '',
        favicon_url_dark: '',
    });

    const fileInputRefs = {
        logo_light: useRef<HTMLInputElement>(null),
        logo_dark: useRef<HTMLInputElement>(null),
        favicon_light: useRef<HTMLInputElement>(null),
        favicon_dark: useRef<HTMLInputElement>(null),
    };

    const [uploading, setUploading] = useState<string | null>(null);

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

            if (error) throw error;
            if (data) {
                setSettings(data);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const getFilePathFromUrl = (url: string) => {
        if (!url) return null;
        // Eliminar parámetros de consulta (query params como ?t=...)
        const urlWithoutQuery = url.split('?')[0];
        // La URL pública de Supabase tiene este formato: .../storage/v1/object/public/site-assets/brand/nombre-archivo
        const parts = urlWithoutQuery.split('site-assets/');
        return parts.length > 1 ? parts[1] : null;
    };

    const deleteFileFromStorage = async (url: string) => {
        const filePath = getFilePathFromUrl(url);
        if (filePath) {
            const { error } = await supabase.storage
                .from('site-assets')
                .remove([filePath]);
            if (error) console.error('Error deleting file from storage:', error);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, field: keyof typeof settings) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validar tamaño (máx 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast({
                title: "Archivo muy grande",
                description: "La imagen no debe superar los 2MB",
                variant: "destructive"
            });
            return;
        }

        setUploading(field);

        try {
            const fileName = `${field}`; // Nombre fijo para que sobrescriba
            const filePath = `brand/${fileName}`;

            // Usamos upsert: true para que sobrescriba el archivo si ya existe con el mismo nombre
            const { error: uploadError } = await supabase.storage
                .from('site-assets')
                .upload(filePath, file, {
                    upsert: true,
                    contentType: file.type
                });

            if (uploadError) throw uploadError;

            // Obtenemos la URL pública (añadimos un query param de tiempo para evitar cache del navegador al sobrescribir)
            const { data: { publicUrl } } = supabase.storage
                .from('site-assets')
                .getPublicUrl(filePath);

            const finalUrl = `${publicUrl}?t=${new Date().getTime()}`;

            // Actualizar inmediatamente la base de datos
            const { error: dbError } = await supabase
                .from('site_settings')
                .update({ [field]: finalUrl })
                .eq('id', settings.id);

            if (dbError) throw dbError;

            setSettings(prev => ({ ...prev, [field]: finalUrl }));

            toast({
                title: "Imagen actualizada",
                description: "Los cambios se han guardado y sincronizado."
            });
        } catch (error: any) {
            toast({
                title: "Error de carga",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setUploading(null);
        }
    };

    const handleRemoveImage = async (field: keyof typeof settings) => {
        const urlToContainer = settings[field] as string;
        if (!urlToContainer) return;

        try {
            // Primero actualizamos la base de datos
            const { error: dbError } = await supabase
                .from('site_settings')
                .update({ [field]: null })
                .eq('id', settings.id);

            if (dbError) throw dbError;

            // Luego borramos del storage
            await deleteFileFromStorage(urlToContainer);

            setSettings(prev => ({ ...prev, [field]: '' }));
            toast({
                title: "Imagen eliminada",
                description: "El cambio se ha guardado automáticamente."
            });
        } catch (error: any) {
            toast({
                title: "Error al eliminar",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    const handleUpdate = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('site_settings')
                .update({
                    logo_url_light: settings.logo_url_light,
                    logo_url_dark: settings.logo_url_dark,
                    favicon_url: settings.favicon_url,
                    favicon_url_dark: settings.favicon_url_dark,
                    updated_at: new Date().toISOString()
                })
                .eq('id', settings.id);

            if (error) throw error;

            toast({
                title: 'Configuración guardada',
                description: 'Los cambios se han aplicado correctamente.',
            });
        } catch (error: any) {
            toast({
                title: 'Error al guardar',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/admin');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-accent animate-spin" />
            </div>
        );
    }

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
                                <h2 className="text-3xl font-bold text-gray-800">Configuración del Sitio</h2>
                                <p className="text-gray-500 mt-2">Gestiona la identidad visual de Service Representaciones.</p>
                            </div>
                            <Button
                                onClick={handleUpdate}
                                disabled={saving}
                                className="bg-accent hover:bg-accent/90 text-white gap-2 shadow-lg shadow-accent/20"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Guardar Cambios
                            </Button>
                        </div>

                        <div className="grid gap-8">

                            {/* Logos Section */}
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="text-xl font-bold text-gray-800 mb-6">Logotipos</h3>
                                <div className="grid md:grid-cols-2 gap-8">
                                    {/* Logo Positivo */}
                                    <div className="space-y-4">
                                        <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Versión Positiva</label>
                                        <div className="relative group">
                                            <div
                                                onClick={() => fileInputRefs.logo_light.current?.click()}
                                                className="aspect-[3/1] bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-4 cursor-pointer hover:border-accent transition-all relative overflow-hidden"
                                            >
                                                {settings.logo_url_light ? (
                                                    <img src={settings.logo_url_light} alt="Light Logo" className="max-h-full object-contain" />
                                                ) : (
                                                    <div className="text-center">
                                                        <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                                        <span className="text-xs text-gray-400 font-medium">Click para subir (Fondo claro)</span>
                                                    </div>
                                                )}
                                                {uploading === 'logo_url_light' && (
                                                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                                        <Loader2 className="w-8 h-8 text-accent animate-spin" />
                                                    </div>
                                                )}
                                            </div>
                                            {settings.logo_url_light && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleRemoveImage('logo_url_light'); }}
                                                    className="absolute top-2 right-2 p-1.5 bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                        <input type="file" hidden ref={fileInputRefs.logo_light} accept="image/*" onChange={(e) => handleFileUpload(e, 'logo_url_light')} />
                                    </div>

                                    {/* Logo Negativo */}
                                    <div className="space-y-4">
                                        <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Versión Negativa</label>
                                        <div className="relative group">
                                            <div
                                                onClick={() => fileInputRefs.logo_dark.current?.click()}
                                                className="aspect-[3/1] bg-slate-900 rounded-xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center p-4 cursor-pointer hover:border-accent transition-all relative overflow-hidden"
                                            >
                                                {settings.logo_url_dark ? (
                                                    <img src={settings.logo_url_dark} alt="Dark Logo" className="max-h-full object-contain" />
                                                ) : (
                                                    <div className="text-center">
                                                        <ImageIcon className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                                                        <span className="text-xs text-slate-500 font-medium">Click para subir (Fondo oscuro)</span>
                                                    </div>
                                                )}
                                                {uploading === 'logo_url_dark' && (
                                                    <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center">
                                                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                                                    </div>
                                                )}
                                            </div>
                                            {settings.logo_url_dark && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleRemoveImage('logo_url_dark'); }}
                                                    className="absolute top-2 right-2 p-1.5 bg-white/10 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                        <input type="file" hidden ref={fileInputRefs.logo_dark} accept="image/*" onChange={(e) => handleFileUpload(e, 'logo_url_dark')} />
                                    </div>
                                </div>
                            </div>

                            {/* Favicons Section */}
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="text-xl font-bold text-gray-800 mb-6">Favicons</h3>
                                <div className="grid md:grid-cols-2 gap-8">
                                    {/* Favicon Light */}
                                    <div className="space-y-4">
                                        <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Favicon (Claro)</label>
                                        <div className="flex items-center gap-4">
                                            <div className="relative group">
                                                <div
                                                    onClick={() => fileInputRefs.favicon_light.current?.click()}
                                                    className="w-20 h-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-accent transition-all overflow-hidden"
                                                >
                                                    {settings.favicon_url ? (
                                                        <img src={settings.favicon_url} alt="Favicon Light" className="w-10 h-10 object-contain" />
                                                    ) : (
                                                        <ImageIcon className="w-6 h-6 text-gray-300" />
                                                    )}
                                                </div>
                                                {settings.favicon_url && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleRemoveImage('favicon_url'); }}
                                                        className="absolute -top-2 -right-2 p-1 bg-red-50 text-red-500 rounded-full border border-red-100 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500 max-w-[150px]">Recomendado: 32x32px (PNG/ICO).</div>
                                        </div>
                                        <input type="file" hidden ref={fileInputRefs.favicon_light} accept="image/*" onChange={(e) => handleFileUpload(e, 'favicon_url')} />
                                    </div>

                                    {/* Favicon Dark */}
                                    <div className="space-y-4">
                                        <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Favicon (Oscuro)</label>
                                        <div className="flex items-center gap-4">
                                            <div className="relative group">
                                                <div
                                                    onClick={() => fileInputRefs.favicon_dark.current?.click()}
                                                    className="w-20 h-20 bg-slate-900 rounded-xl border-2 border-dashed border-slate-700 flex items-center justify-center cursor-pointer hover:border-accent transition-all overflow-hidden"
                                                >
                                                    {settings.favicon_url_dark ? (
                                                        <img src={settings.favicon_url_dark} alt="Favicon Dark" className="w-10 h-10 object-contain" />
                                                    ) : (
                                                        <ImageIcon className="w-6 h-6 text-slate-700" />
                                                    )}
                                                </div>
                                                {settings.favicon_url_dark && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleRemoveImage('favicon_url_dark'); }}
                                                        className="absolute -top-2 -right-2 p-1 bg-white/10 text-white rounded-full border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500 max-w-[150px]">Versión para navegadores en dark mode.</div>
                                        </div>
                                        <input type="file" hidden ref={fileInputRefs.favicon_dark} accept="image/*" onChange={(e) => handleFileUpload(e, 'favicon_url_dark')} />
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

export default AdminSettings;
