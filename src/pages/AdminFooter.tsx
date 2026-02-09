import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Loader2, Type, Link as LinkIcon, Plus, Trash2, PanelBottom } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import PageLoading from '@/components/PageLoading';

interface CustomLink {
    label: string;
    url: string;
}

const AdminFooter = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);

    const [settings, setSettings] = useState({
        id: '',
        footer_description: '',
        footer_copyright: '',
        company_links: [] as CustomLink[]
    });
    const [logoUrl, setLogoUrl] = useState<string>('');

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
                .select('id, footer_description, footer_copyright, footer_company_links, logo_url_dark')
                .single();

            if (error) throw error;
            if (data) {
                const companyLinks = Array.isArray(data.footer_company_links)
                    ? data.footer_company_links
                    : [
                        { label: 'Nosotros', url: '/nosotros' },
                        { label: 'Productos', url: '/productos' },
                        { label: 'Servicios', url: '/servicios' },
                        { label: 'Contacto', url: '/contacto' }
                    ];

                if (data.logo_url_dark) setLogoUrl(data.logo_url_dark);
                setSettings({
                    id: data.id,
                    footer_description: data.footer_description || '',
                    footer_copyright: data.footer_copyright || '',
                    company_links: companyLinks
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
                    footer_description: settings.footer_description,
                    footer_copyright: settings.footer_copyright,
                    footer_company_links: settings.company_links,
                    updated_at: new Date().toISOString()
                })
                .eq('id', settings.id);

            if (error) throw error;

            toast({
                title: 'Footer guardado',
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

    const addLink = () => {
        setSettings({
            ...settings,
            company_links: [...settings.company_links, { label: '', url: '' }]
        });
    };

    const removeLink = (index: number) => {
        const newLinks = [...settings.company_links];
        newLinks.splice(index, 1);
        setSettings({ ...settings, company_links: newLinks });
    };

    const updateLink = (index: number, field: keyof CustomLink, value: string) => {
        const newLinks = [...settings.company_links];
        newLinks[index][field] = value;
        setSettings({ ...settings, company_links: newLinks });
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
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                                    <PanelBottom className="w-8 h-8 text-accent" /> Administración del Footer
                                </h2>
                                <p className="text-gray-500 mt-2">Gestiona los textos y enlaces de la columna "Empresa" en el pie de página.</p>
                            </div>
                            <Button
                                onClick={handleUpdate}
                                disabled={saving}
                                className="bg-accent hover:bg-accent/90 text-white gap-2 shadow-lg shadow-accent/20"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Guardar Footer
                            </Button>
                        </div>

                        <div className="grid gap-8">
                            {/* General Info */}
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    <Type className="w-5 h-5 text-accent" /> Información General
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Descripción del Footer</label>
                                        <Textarea
                                            value={settings.footer_description}
                                            onChange={(e) => setSettings({ ...settings, footer_description: e.target.value })}
                                            placeholder="Breve descripción de la empresa para el footer..."
                                            className="min-h-[100px] bg-gray-50 border-none focus:ring-2 focus:ring-accent"
                                        />
                                    </div>
                                    <div className="pt-4">
                                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Texto de Copyright (Barra Inferior)</label>
                                        <Input
                                            value={settings.footer_copyright}
                                            onChange={(e) => setSettings({ ...settings, footer_copyright: e.target.value })}
                                            placeholder="Ej: © {year} Service Representaciones. Todos los derechos reservados."
                                            className="bg-gray-50 border-none h-12 rounded-xl"
                                        />
                                        <p className="text-xs text-gray-400 mt-2 italic">Puedes usar {'{year}'} para que el año se actualice automáticamente.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Section Empresa Links */}
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                        <LinkIcon className="w-5 h-5 text-accent" /> Enlaces de Empresa (Footer)
                                    </h3>
                                    <Button onClick={addLink} variant="outline" size="sm" className="gap-2 border-accent text-accent hover:bg-accent hover:text-white">
                                        <Plus className="w-4 h-4" /> Añadir Enlace
                                    </Button>
                                </div>
                                <div className="space-y-4">
                                    {settings.company_links.map((link, index) => (
                                        <div key={index} className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 rounded-xl relative group">
                                            <div className="flex-1">
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Etiqueta</label>
                                                <Input
                                                    value={link.label}
                                                    onChange={(e) => updateLink(index, 'label', e.target.value)}
                                                    placeholder="Ej: Nosotros"
                                                    className="bg-white border-gray-200"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">URL / Ruta</label>
                                                <Input
                                                    value={link.url}
                                                    onChange={(e) => updateLink(index, 'url', e.target.value)}
                                                    placeholder="Ej: /nosotros"
                                                    className="bg-white border-gray-200"
                                                />
                                            </div>
                                            <div className="md:pt-5">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeLink(index)}
                                                    className="text-red-400 hover:text-red-600 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {settings.company_links.length === 0 && (
                                        <p className="text-center py-8 text-gray-400 italic">No hay enlaces personalizados creados.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminFooter;
