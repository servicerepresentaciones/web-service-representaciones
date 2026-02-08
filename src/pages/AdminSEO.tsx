import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Loader2, Search, Globe, Palette, LayoutGrid, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import PageLoading from '@/components/PageLoading';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PageSEO {
    id: string;
    page_path: string;
    page_name: string;
    title: string;
    description: string;
    keywords: string;
}

const AdminSEO = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);

    // Global Settings
    const [settings, setSettings] = useState({
        id: '',
        seo_title: '',
        seo_description: '',
        seo_keywords: '',
        favicon_mode: 'light' as 'light' | 'dark',
        favicon_url: '',
        favicon_url_dark: '',
        logo_url_dark: ''
    });

    // Per-page SEO
    const [pageSeos, setPageSeos] = useState<PageSEO[]>([]);
    const [selectedPagePath, setSelectedPagePath] = useState('/');

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) {
                setUser(data.session.user);
            }
        });
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [settingsRes, pageSeoRes] = await Promise.all([
                supabase.from('site_settings').select('id, seo_title, seo_description, seo_keywords, favicon_mode, favicon_url, favicon_url_dark, logo_url_dark').single(),
                supabase.from('page_seo').select('*').order('page_name')
            ]);

            if (settingsRes.error) throw settingsRes.error;
            if (settingsRes.data) {
                setSettings({
                    id: settingsRes.data.id,
                    seo_title: settingsRes.data.seo_title || '',
                    seo_description: settingsRes.data.seo_description || '',
                    seo_keywords: settingsRes.data.seo_keywords || '',
                    favicon_mode: settingsRes.data.favicon_mode || 'light',
                    favicon_url: settingsRes.data.favicon_url || '',
                    favicon_url_dark: settingsRes.data.favicon_url_dark || '',
                    logo_url_dark: settingsRes.data.logo_url_dark || ''
                });
            }

            if (pageSeoRes.data) {
                setPageSeos(pageSeoRes.data);
            }
        } catch (error: any) {
            console.error('Error fetching SEO data:', error);
            // Non-critical error if page_seo doesn't exist yet
            if (error.code !== 'PGRST116' && error.message.includes('relation "public.page_seo" does not exist')) {
                toast({
                    title: "Aviso",
                    description: "La tabla de SEO por página no existe aún. Por favor ejecuta el SQL proporcionado.",
                    variant: "destructive"
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateGlobal = async () => {
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

            toast({ title: 'SEO Global actualizado', description: 'La configuración global se ha guardado correctamente.' });
        } catch (error: any) {
            toast({ title: 'Error al guardar', description: error.message, variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleUpdatePageSeo = async (pageSeo: PageSEO) => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('page_seo')
                .update({
                    title: pageSeo.title,
                    description: pageSeo.description,
                    keywords: pageSeo.keywords,
                    updated_at: new Date().toISOString()
                })
                .eq('id', pageSeo.id);

            if (error) throw error;

            toast({ title: `SEO de ${pageSeo.page_name} actualizado`, description: 'Los cambios se han guardado correctamente.' });

            // Update local state
            setPageSeos(prev => prev.map(p => p.id === pageSeo.id ? pageSeo : p));
        } catch (error: any) {
            toast({ title: 'Error al ahorrar', description: error.message, variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/admin');
    };

    if (loading) {
        return <PageLoading logoUrl={settings.logo_url_dark} />;
    }

    const selectedPage = pageSeos.find(p => p.page_path === selectedPagePath);

    return (
        <div className="min-h-screen bg-[#F5F6FA] flex">
            <div className="hidden lg:block relative z-20">
                <AdminSidebar onLogout={handleLogout} />
            </div>

            <div className="flex-1 flex flex-col min-w-0">
                <AdminHeader userEmail={user?.email} />

                <main className="p-4 lg:p-8 overflow-y-auto max-h-[calc(100vh-80px)]">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                                    <Search className="w-8 h-8 text-accent" /> Optimización SEO
                                </h2>
                                <p className="text-gray-500 mt-2">Gestiona cómo aparece tu sitio en Google y otros buscadores.</p>
                            </div>
                        </div>

                        <Tabs defaultValue="global" className="space-y-6">
                            <TabsList className="bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                                <TabsTrigger value="global" className="rounded-lg gap-2 data-[state=active]:bg-accent data-[state=active]:text-white">
                                    <Globe className="w-4 h-4" /> SEO Global & Favicon
                                </TabsTrigger>
                                <TabsTrigger value="pages" className="rounded-lg gap-2 data-[state=active]:bg-accent data-[state=active]:text-white">
                                    <LayoutGrid className="w-4 h-4" /> SEO por Página
                                </TabsTrigger>
                            </TabsList>

                            {/* Tab: Global Settings */}
                            <TabsContent value="global" className="space-y-6">
                                <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                                    <CardHeader className="bg-white border-b border-gray-50">
                                        <CardTitle className="text-xl flex items-center gap-2 text-gray-800">
                                            <Globe className="w-5 h-5 text-accent" /> Metadatos Globales (Respaldo)
                                        </CardTitle>
                                        <CardDescription>Estos valores se usarán si una página no tiene SEO específico configurado.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-8 space-y-6">
                                        <div className="space-y-2">
                                            <Label className="font-bold text-gray-700 uppercase tracking-wider text-xs">Título por Defecto</Label>
                                            <Input
                                                value={settings.seo_title}
                                                onChange={(e) => setSettings({ ...settings, seo_title: e.target.value })}
                                                className="bg-gray-50 border-none h-12 rounded-xl focus:ring-2 focus:ring-accent"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="font-bold text-gray-700 uppercase tracking-wider text-xs">Descripción por Defecto</Label>
                                            <Textarea
                                                value={settings.seo_description}
                                                onChange={(e) => setSettings({ ...settings, seo_description: e.target.value })}
                                                className="bg-gray-50 border-none min-h-[100px] rounded-xl focus:ring-2 focus:ring-accent"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="font-bold text-gray-700 uppercase tracking-wider text-xs">Keywords Globales</Label>
                                            <Input
                                                value={settings.seo_keywords}
                                                onChange={(e) => setSettings({ ...settings, seo_keywords: e.target.value })}
                                                className="bg-gray-50 border-none h-12 rounded-xl focus:ring-2 focus:ring-accent"
                                            />
                                        </div>
                                        <Button
                                            onClick={handleUpdateGlobal}
                                            disabled={saving}
                                            className="w-full bg-accent hover:bg-accent/90 text-white rounded-xl h-12 shadow-lg shadow-accent/20"
                                        >
                                            {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
                                            Guardar Configuración Global
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                                    <CardHeader className="bg-white border-b border-gray-50">
                                        <CardTitle className="text-xl flex items-center gap-2 text-gray-800">
                                            <Palette className="w-5 h-5 text-accent" /> Estilo del Favicon
                                        </CardTitle>
                                        <CardDescription>Selecciona la versión del icono que verán los usuarios en la pestaña del navegador.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-8">
                                        <RadioGroup
                                            value={settings.favicon_mode}
                                            onValueChange={(value: "light" | "dark") => setSettings({ ...settings, favicon_mode: value })}
                                            className="grid grid-cols-1 md:grid-cols-2 gap-6"
                                        >
                                            <div className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 ${settings.favicon_mode === 'light' ? 'border-accent bg-accent/5' : 'border-gray-100 bg-gray-50'}`}>
                                                <RadioGroupItem value="light" id="fav-light" />
                                                <Label htmlFor="fav-light" className="flex-1 cursor-pointer">
                                                    <span className="block font-bold">Modo Claro</span>
                                                    <span className="text-xs text-gray-500">Para navegadores con temas claros</span>
                                                </Label>
                                                {settings.favicon_url && <img src={settings.favicon_url} className="w-8 h-8 object-contain" />}
                                            </div>
                                            <div className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 ${settings.favicon_mode === 'dark' ? 'border-accent bg-accent/5' : 'border-gray-100 bg-gray-50'}`}>
                                                <RadioGroupItem value="dark" id="fav-dark" />
                                                <Label htmlFor="fav-dark" className="flex-1 cursor-pointer">
                                                    <span className="block font-bold">Modo Oscuro</span>
                                                    <span className="text-xs text-gray-500">Para navegadores con temas oscuros</span>
                                                </Label>
                                                {settings.favicon_url_dark && <img src={settings.favicon_url_dark} className="w-8 h-8 object-contain" />}
                                            </div>
                                        </RadioGroup>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Tab: Per-Page SEO */}
                            <TabsContent value="pages" className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div className="md:col-span-1 space-y-2">
                                        <p className="text-sm font-bold text-gray-500 px-2 uppercase tracking-tight text-xs">Seleccionar Página</p>
                                        <div className="flex flex-col gap-1">
                                            {pageSeos.map((page) => (
                                                <button
                                                    key={page.id}
                                                    onClick={() => setSelectedPagePath(page.page_path)}
                                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${selectedPagePath === page.page_path ? 'bg-accent text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100'}`}
                                                >
                                                    <FileText className="w-4 h-4" />
                                                    {page.page_name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="md:col-span-3">
                                        {selectedPage ? (
                                            <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                                                <CardHeader className="bg-white border-b border-gray-50">
                                                    <CardTitle className="text-xl flex items-center gap-2 text-gray-800">
                                                        SEO: {selectedPage.page_name}
                                                    </CardTitle>
                                                    <CardDescription>Ruta de la página: <code className="text-accent">{selectedPage.page_path}</code></CardDescription>
                                                </CardHeader>
                                                <CardContent className="p-8 space-y-6">
                                                    <div className="space-y-2">
                                                        <Label className="font-bold text-gray-700 uppercase tracking-wider text-xs">Título de la Página</Label>
                                                        <Input
                                                            value={selectedPage.title}
                                                            onChange={(e) => {
                                                                const newVal = e.target.value;
                                                                setPageSeos(prev => prev.map(p => p.id === selectedPage.id ? { ...p, title: newVal } : p));
                                                            }}
                                                            placeholder="Título que aparece en Google"
                                                            className="bg-gray-50 border-none h-12 rounded-xl focus:ring-2 focus:ring-accent"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="font-bold text-gray-700 uppercase tracking-wider text-xs">Meta Descripción</Label>
                                                        <Textarea
                                                            value={selectedPage.description}
                                                            onChange={(e) => {
                                                                const newVal = e.target.value;
                                                                setPageSeos(prev => prev.map(p => p.id === selectedPage.id ? { ...p, description: newVal } : p));
                                                            }}
                                                            placeholder="Breve resumen para buscadores..."
                                                            className="bg-gray-50 border-none min-h-[120px] rounded-xl focus:ring-2 focus:ring-accent"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="font-bold text-gray-700 uppercase tracking-wider text-xs">Keywords (Palabras Clave)</Label>
                                                        <Input
                                                            value={selectedPage.keywords}
                                                            onChange={(e) => {
                                                                const newVal = e.target.value;
                                                                setPageSeos(prev => prev.map(p => p.id === selectedPage.id ? { ...p, keywords: newVal } : p));
                                                            }}
                                                            placeholder="pestaña, tecnología, redes..."
                                                            className="bg-gray-50 border-none h-12 rounded-xl focus:ring-2 focus:ring-accent"
                                                        />
                                                    </div>
                                                    <Button
                                                        onClick={() => handleUpdatePageSeo(selectedPage)}
                                                        disabled={saving}
                                                        className="w-full bg-accent hover:bg-accent/90 text-white rounded-xl h-12 shadow-lg shadow-accent/20"
                                                    >
                                                        {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
                                                        Guardar Cambios para {selectedPage.page_name}
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        ) : (
                                            <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
                                                <Search className="w-12 h-12 mb-4 opacity-20" />
                                                <p>Selecciona una página de la izquierda para configurar su SEO.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminSEO;
