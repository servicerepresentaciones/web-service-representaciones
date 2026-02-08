import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Loader2, Search, Globe, Layout, Palette } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const AdminSEO = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);

    const [settings, setSettings] = useState({
        id: '',
        seo_title: '',
        seo_description: '',
        seo_keywords: '',
        favicon_mode: 'light' as 'light' | 'dark',
        favicon_url: '',
        favicon_url_dark: ''
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
                .select('id, seo_title, seo_description, seo_keywords, favicon_mode, favicon_url, favicon_url_dark')
                .single();

            if (error) throw error;
            if (data) {
                setSettings({
                    id: data.id,
                    seo_title: data.seo_title || '',
                    seo_description: data.seo_description || '',
                    seo_keywords: data.seo_keywords || '',
                    favicon_mode: data.favicon_mode || 'light',
                    favicon_url: data.favicon_url || '',
                    favicon_url_dark: data.favicon_url_dark || ''
                });
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('site_settings')
                .update({
                    seo_title: settings.seo_title,
                    seo_description: settings.seo_description,
                    seo_keywords: settings.seo_keywords,
                    favicon_mode: settings.favicon_mode,
                    updated_at: new Date().toISOString()
                })
                .eq('id', settings.id);

            if (error) throw error;

            toast({
                title: 'SEO actualizado',
                description: 'La configuración de SEO y Favicon se ha guardado correctamente.',
            });
        } catch (error: any) {
            toast({
                title: 'Error al ahorrar',
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
                                <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                                    <Search className="w-8 h-8 text-accent" /> Configuración SEO
                                </h2>
                                <p className="text-gray-500 mt-2">Optimiza cómo aparece tu sitio en los buscadores y gestiona el favicon.</p>
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
                            {/* Meta Tags Section */}
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    <Globe className="w-5 h-5 text-accent" /> Meta Etiquetas Principales
                                </h3>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Título del Sitio (Meta Title)</label>
                                        <Input
                                            value={settings.seo_title}
                                            onChange={(e) => setSettings({ ...settings, seo_title: e.target.value })}
                                            placeholder="Ej: Service Representaciones - Soluciones Tecnológicas"
                                            className="bg-gray-50 border-none h-12 rounded-xl"
                                        />
                                        <p className="text-[11px] text-gray-400 pl-1">Recomendado: 50-60 caracteres.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Descripción (Meta Description)</label>
                                        <Textarea
                                            value={settings.seo_description}
                                            onChange={(e) => setSettings({ ...settings, seo_description: e.target.value })}
                                            placeholder="Escribe una descripción atractiva para los resultados de búsqueda..."
                                            className="bg-gray-50 border-none min-h-[120px] rounded-xl focus:ring-2 focus:ring-accent"
                                        />
                                        <p className="text-[11px] text-gray-400 pl-1">Recomendado: 150-160 caracteres.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Palabras Clave (Keywords)</label>
                                        <Input
                                            value={settings.seo_keywords}
                                            onChange={(e) => setSettings({ ...settings, seo_keywords: e.target.value })}
                                            placeholder="tecnología, telecomunicaciones, software..."
                                            className="bg-gray-50 border-none h-12 rounded-xl"
                                        />
                                        <p className="text-[11px] text-gray-400 pl-1">Separa las palabras por comas.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Favicon Mode Section */}
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    <Palette className="w-5 h-5 text-accent" /> Estilo del Favicon
                                </h3>

                                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 mb-6">
                                    <p className="text-sm text-gray-600 mb-4 font-medium italic">
                                        Selecciona qué versión del favicon quieres que se use por defecto en el navegador.
                                    </p>

                                    <RadioGroup
                                        value={settings.favicon_mode}
                                        onValueChange={(value: "light" | "dark") => setSettings({ ...settings, favicon_mode: value })}
                                        className="flex flex-col md:flex-row gap-6"
                                    >
                                        <div className="flex items-center space-x-3 bg-white p-4 rounded-xl border border-gray-100 flex-1 hover:border-accent transition-colors cursor-pointer">
                                            <RadioGroupItem value="light" id="light" />
                                            <Label htmlFor="light" className="flex flex-1 items-center justify-between cursor-pointer">
                                                <span>Modo Claro (Positivo)</span>
                                                {settings.favicon_url ? (
                                                    <img src={settings.favicon_url} alt="Favicon Light" className="w-6 h-6 object-contain" />
                                                ) : (
                                                    <Layout className="w-6 h-6 text-gray-200" />
                                                )}
                                            </Label>
                                        </div>

                                        <div className="flex items-center space-x-3 bg-slate-900 p-4 rounded-xl border border-slate-700 flex-1 hover:border-accent transition-colors cursor-pointer">
                                            <RadioGroupItem value="dark" id="dark" className="border-slate-500" />
                                            <Label htmlFor="dark" className="flex flex-1 items-center justify-between cursor-pointer text-white">
                                                <span>Modo Oscuro (Negativo)</span>
                                                {settings.favicon_url_dark ? (
                                                    <img src={settings.favicon_url_dark} alt="Favicon Dark" className="w-6 h-6 object-contain" />
                                                ) : (
                                                    <Layout className="w-6 h-6 text-slate-700" />
                                                )}
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                <p className="text-xs text-gray-400 italic">
                                    Nota: Si quieres cambiar las imágenes de los favicons, puedes hacerlo en la sección de "Configuración del Sitio".
                                </p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminSEO;
