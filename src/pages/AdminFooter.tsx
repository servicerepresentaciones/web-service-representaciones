import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Loader2, Type, Link as LinkIcon, Plus, Trash2, PanelBottom, Image as ImageIcon } from 'lucide-react';
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
        company_links: [] as CustomLink[],
        footer_partner_logo: '',
        footer_partner_logo_2: ''
    });
    const [logoUrl, setLogoUrl] = useState<string>('');
    const [uploading, setUploading] = useState<string | null>(null);
    const fileInputRef1 = useRef<HTMLInputElement>(null);
    const fileInputRef2 = useRef<HTMLInputElement>(null);

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
                .select('id, footer_description, footer_copyright, footer_company_links, logo_url_dark, footer_partner_logo, footer_partner_logo_2')
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
                    company_links: companyLinks,
                    footer_partner_logo: data.footer_partner_logo || '',
                    footer_partner_logo_2: data.footer_partner_logo_2 || ''
                });
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const deleteOldImage = async (url: string) => {
        if (!url) return;
        try {
            const pathParts = url.split('/site-assets/');
            if (pathParts.length < 2) return;
            const filePath = pathParts[1].split('?')[0];

            const { error } = await supabase.storage
                .from('site-assets')
                .remove([filePath]);

            if (error) console.error('Error deleting old image:', error);
        } catch (error) {
            console.error('Error parsing/deleting old image:', error);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'footer_partner_logo' | 'footer_partner_logo_2') => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast({ title: "Error", description: "La imagen debe ser menor a 2MB", variant: "destructive" });
            return;
        }

        setUploading(field);
        try {
            if (settings[field]) {
                await deleteOldImage(settings[field]);
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `footer/partner-${field === 'footer_partner_logo_2' ? '2-' : ''}${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('site-assets')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('site-assets')
                .getPublicUrl(fileName);

            const finalUrl = `${publicUrl}?t=${Date.now()}`;
            setSettings({ ...settings, [field]: finalUrl });
            toast({ title: "Logo subido", description: "El logo se ha cargado correctamente." });
        } catch (error: any) {
            toast({ title: "Error al subir", description: error.message, variant: "destructive" });
        } finally {
            setUploading(null);
            if (field === 'footer_partner_logo' && fileInputRef1.current) fileInputRef1.current.value = '';
            if (field === 'footer_partner_logo_2' && fileInputRef2.current) fileInputRef2.current.value = '';
        }
    };

    const handleRemoveImage = async (field: 'footer_partner_logo' | 'footer_partner_logo_2') => {
        if (!confirm('¿Estás seguro de eliminar el logo actual?')) return;

        try {
            if (settings[field]) {
                await deleteOldImage(settings[field]);
            }
            setSettings({ ...settings, [field]: '' });
            toast({ title: "Logo eliminado" });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
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
                    footer_partner_logo: settings.footer_partner_logo,
                    footer_partner_logo_2: settings.footer_partner_logo_2,
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
                                <p className="text-gray-500 mt-2">Gestiona los textos, logos y enlaces del pie de página.</p>
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

                            {/* Logos de Partner / Respaldo */}
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    <ImageIcon className="w-5 h-5 text-accent" /> Logos de Partner / Respaldo
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Logo 1 */}
                                    <div className="space-y-4">
                                        <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Logo Principal</label>
                                        <div className="relative w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-dashed border-gray-300">
                                            {settings.footer_partner_logo ? (
                                                <img src={settings.footer_partner_logo} alt="Partner Logo 1" className="max-w-full max-h-full object-contain p-2" />
                                            ) : (
                                                <span className="text-xs text-gray-400 text-center px-2">Sin logo</span>
                                            )}
                                            {uploading === 'footer_partner_logo' && (
                                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                                    <Loader2 className="w-6 h-6 animate-spin text-accent" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => fileInputRef1.current?.click()}
                                                disabled={uploading !== null}
                                                className="w-full"
                                            >
                                                {settings.footer_partner_logo ? 'Cambiar' : 'Subir'}
                                            </Button>
                                            {settings.footer_partner_logo && (
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    onClick={() => handleRemoveImage('footer_partner_logo')}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            ref={fileInputRef1}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e, 'footer_partner_logo')}
                                        />
                                    </div>

                                    {/* Logo 2 */}
                                    <div className="space-y-4">
                                        <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Logo Secundario</label>
                                        <div className="relative w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-dashed border-gray-300">
                                            {settings.footer_partner_logo_2 ? (
                                                <img src={settings.footer_partner_logo_2} alt="Partner Logo 2" className="max-w-full max-h-full object-contain p-2" />
                                            ) : (
                                                <span className="text-xs text-gray-400 text-center px-2">Sin logo</span>
                                            )}
                                            {uploading === 'footer_partner_logo_2' && (
                                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                                    <Loader2 className="w-6 h-6 animate-spin text-accent" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => fileInputRef2.current?.click()}
                                                disabled={uploading !== null}
                                                className="w-full"
                                            >
                                                {settings.footer_partner_logo_2 ? 'Cambiar' : 'Subir'}
                                            </Button>
                                            {settings.footer_partner_logo_2 && (
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    onClick={() => handleRemoveImage('footer_partner_logo_2')}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            ref={fileInputRef2}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e, 'footer_partner_logo_2')}
                                        />
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 mt-4 text-center">
                                    Recomendado: Imágenes PNG transparente, altura aprox. 60-80px.
                                </p>
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
