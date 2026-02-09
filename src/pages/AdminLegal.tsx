import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Loader2, FileText, Globe } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import PageLoading from '@/components/PageLoading';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminLegal = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [logoUrl, setLogoUrl] = useState<string>('');
    const [legalPages, setLegalPages] = useState<any[]>([]);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) {
                setUser(data.session.user);
            }
        });
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [pagesRes, settingsRes] = await Promise.all([
                supabase.from('legal_pages').select('*').order('slug'),
                supabase.from('site_settings').select('logo_url_dark').single()
            ]);

            if (pagesRes.error) {
                console.error('Error fetching legal pages:', pagesRes.error);
                toast({
                    title: "Información requerida",
                    description: "La tabla de páginas legales aún no ha sido creada en la base de datos.",
                    variant: "destructive"
                });
            }

            if (pagesRes.data) setLegalPages(pagesRes.data);
            if (settingsRes.data?.logo_url_dark) setLogoUrl(settingsRes.data.logo_url_dark);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (slug: string) => {
        const page = legalPages.find(p => p.slug === slug);
        if (!page) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('legal_pages')
                .update({
                    title: page.title,
                    content: page.content,
                    is_active: page.is_active,
                    updated_at: new Date().toISOString()
                })
                .eq('slug', slug);

            if (error) throw error;

            toast({
                title: 'Cambios guardados',
                description: `La página "${page.title}" ha sido actualizada.`,
            });
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const updatePageState = (slug: string, field: string, value: any) => {
        setLegalPages(prev => prev.map(p => p.slug === slug ? { ...p, [field]: value } : p));
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/admin');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
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
                    <div className="max-w-5xl mx-auto">
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                                <FileText className="w-8 h-8 text-accent" /> Páginas Legales
                            </h2>
                            <p className="text-gray-500 mt-2">Gestiona el contenido de los términos, privacidad y cookies.</p>
                        </div>

                        <Tabs defaultValue="terminos-condiciones" className="space-y-6">
                            <TabsList className="bg-white p-1 h-auto rounded-xl border border-gray-100 shadow-sm flex flex-wrap gap-1">
                                {legalPages.map(page => (
                                    <TabsTrigger
                                        key={page.slug}
                                        value={page.slug}
                                        className="rounded-lg px-6 py-2.5 data-[state=active]:bg-accent data-[state=active]:text-white font-bold transition-all"
                                    >
                                        {page.title}
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            {legalPages.map(page => (
                                <TabsContent key={page.slug} value={page.slug} className="space-y-6 outline-none">
                                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-50">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
                                                    <Globe className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-gray-800">{page.title}</h3>
                                                    <p className="text-sm text-gray-400">Ruta: /legal/{page.slug}</p>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => handleUpdate(page.slug)}
                                                disabled={saving}
                                                className="bg-accent hover:bg-accent/90 text-white gap-2 shadow-lg shadow-accent/20"
                                            >
                                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                Guardar Cambios
                                            </Button>
                                        </div>

                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Título de la Página</label>
                                                <Input
                                                    value={page.title}
                                                    onChange={(e) => updatePageState(page.slug, 'title', e.target.value)}
                                                    className="bg-gray-50 border-none h-12 rounded-xl text-lg font-bold focus:ring-2 focus:ring-accent"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Contenido (Texto Plano / Markdown)</label>
                                                <Textarea
                                                    value={page.content}
                                                    onChange={(e) => updatePageState(page.slug, 'content', e.target.value)}
                                                    className="min-h-[400px] bg-gray-50 border-none rounded-2xl p-6 focus:ring-2 focus:ring-accent leading-relaxed"
                                                    placeholder="Escribe el contenido legal aquí..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLegal;
