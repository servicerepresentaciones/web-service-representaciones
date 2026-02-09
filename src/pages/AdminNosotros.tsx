import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Loader2, Info, Image as ImageIcon, Trash2, Upload, Plus, X, Shield, Target, Eye, Gem, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import PageLoading from '@/components/PageLoading';

interface Value {
    title: string;
    desc: string;
    icon: string;
}

interface AboutSettings {
    id: string;
    hero_title: string;
    hero_subtitle: string;
    hero_image_url: string | null;
    intro_title: string;
    intro_text: string;
    intro_image_url: string | null;
    mission_title: string;
    mission_text: string;
    vision_title: string;
    vision_text: string;
    values: Value[];
    benefits: string[];
}

const AdminNosotros = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [settings, setSettings] = useState<AboutSettings>({
        id: '',
        hero_title: '',
        hero_subtitle: '',
        hero_image_url: null,
        intro_title: '',
        intro_text: '',
        intro_image_url: null,
        mission_title: '',
        mission_text: '',
        vision_title: '',
        vision_text: '',
        values: [],
        benefits: [],
    });

    const fileRefs = {
        hero: useRef<HTMLInputElement>(null),
        intro: useRef<HTMLInputElement>(null),
    };

    const [uploadingField, setUploadingField] = useState<string | null>(null);
    const [originalImages, setOriginalImages] = useState<{ hero: string | null, intro: string | null }>({ hero: null, intro: null });

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
            const [aboutRes, logoRes] = await Promise.all([
                supabase.from('about_settings').select('*').single(),
                supabase.from('site_settings').select('logo_url_dark').single()
            ]);

            if (aboutRes.data) {
                setSettings(aboutRes.data);
                setOriginalImages({
                    hero: aboutRes.data.hero_image_url,
                    intro: aboutRes.data.intro_image_url
                });
            }
            if (logoRes.data?.logo_url_dark) {
                setLogoUrl(logoRes.data.logo_url_dark);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const extractFilePath = (url: string) => {
        if (!url) return null;
        // Eliminar parámetros de consulta
        const urlWithoutQuery = url.split('?')[0];
        // La URL pública de Supabase tiene este formato: .../storage/v1/object/public/site-assets/nombre-archivo
        const parts = urlWithoutQuery.split('site-assets/');
        return parts.length > 1 ? parts[1] : null;
    };

    const deleteFromStorage = async (url: string) => {
        const filePath = extractFilePath(url);
        if (filePath) {
            const { error } = await supabase.storage
                .from('site-assets')
                .remove([filePath]);
            if (error) console.error('Error deleting file from storage:', error);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, field: 'hero_image_url' | 'intro_image_url') => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploadingField(field);
        try {
            const fileName = `about/${field}-${Date.now()}`;
            const { error: uploadError } = await supabase.storage
                .from('site-assets')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('site-assets')
                .getPublicUrl(fileName);

            const finalUrl = `${publicUrl}?t=${Date.now()}`;
            setSettings(prev => ({ ...prev, [field]: finalUrl }));

            toast({ title: "Imagen subida", description: "La imagen se ha cargado correctamente." });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setUploadingField(null);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('about_settings')
                .update({
                    hero_title: settings.hero_title,
                    hero_subtitle: settings.hero_subtitle,
                    hero_image_url: settings.hero_image_url,
                    intro_title: settings.intro_title,
                    intro_text: settings.intro_text,
                    intro_image_url: settings.intro_image_url,
                    mission_title: settings.mission_title,
                    mission_text: settings.mission_text,
                    vision_title: settings.vision_title,
                    vision_text: settings.vision_text,
                    values: settings.values,
                    benefits: settings.benefits,
                    updated_at: new Date().toISOString()
                })
                .eq('id', settings.id);

            if (error) throw error;

            // Cleanup old images if they were changed
            if (originalImages.hero && originalImages.hero !== settings.hero_image_url) {
                await deleteFromStorage(originalImages.hero);
            }
            if (originalImages.intro && originalImages.intro !== settings.intro_image_url) {
                await deleteFromStorage(originalImages.intro);
            }

            setOriginalImages({
                hero: settings.hero_image_url,
                intro: settings.intro_image_url
            });

            toast({ title: 'Configuración guardada', description: 'La página de Nosotros ha sido actualizada.' });
        } catch (error: any) {
            toast({ title: 'Error al guardar', description: error.message, variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    // Values management
    const addValue = () => {
        setSettings(prev => ({
            ...prev,
            values: [...prev.values, { title: '', desc: '', icon: 'Shield' }]
        }));
    };

    const updateValue = (index: number, field: keyof Value, value: string) => {
        const newValues = [...settings.values];
        newValues[index] = { ...newValues[index], [field]: value };
        setSettings(prev => ({ ...prev, values: newValues }));
    };

    const removeValue = (index: number) => {
        setSettings(prev => ({
            ...prev,
            values: prev.values.filter((_, i) => i !== index)
        }));
    };

    // Benefits management
    const addBenefit = () => {
        setSettings(prev => ({
            ...prev,
            benefits: [...prev.benefits, '']
        }));
    };

    const updateBenefit = (index: number, value: string) => {
        const newBenefits = [...settings.benefits];
        newBenefits[index] = value;
        setSettings(prev => ({ ...prev, benefits: newBenefits }));
    };

    const removeBenefit = (index: number) => {
        setSettings(prev => ({
            ...prev,
            benefits: prev.benefits.filter((_, i) => i !== index)
        }));
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/admin');
    };

    if (loading) return <PageLoading logoUrl={logoUrl} />;

    const availableIcons = [
        { name: 'Shield', icon: Shield },
        { name: 'Target', icon: Target },
        { name: 'Eye', icon: Eye },
        { name: 'Gem', icon: Gem },
        { name: 'CheckCircle2', icon: CheckCircle2 },
    ];

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
                                    <Info className="w-8 h-8 text-accent" /> Gestión de Nosotros
                                </h2>
                                <p className="text-gray-500 mt-2">Personaliza el contenido de la página "Sobre Nosotros".</p>
                            </div>
                            <Button onClick={handleSave} disabled={saving} className="bg-accent hover:bg-accent/90 text-white gap-2 shadow-lg">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Guardar Cambios
                            </Button>
                        </div>

                        <div className="grid gap-8">
                            {/* Hero Section */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                                <h3 className="text-xl font-bold border-b pb-4">Sección Hero (Cabecera)</h3>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold">Título Hero</label>
                                            <Input value={settings.hero_title} onChange={e => setSettings({ ...settings, hero_title: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold">Subtítulo Hero</label>
                                            <Textarea value={settings.hero_subtitle} onChange={e => setSettings({ ...settings, hero_subtitle: e.target.value })} className="h-24 resize-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold">Imagen Hero</label>
                                        <div className="aspect-video bg-gray-50 border-2 border-dashed rounded-xl flex items-center justify-center relative overflow-hidden group">
                                            {settings.hero_image_url ? (
                                                <>
                                                    <img src={settings.hero_image_url} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                        <Button size="sm" variant="secondary" onClick={() => fileRefs.hero.current?.click()}>Cambiar</Button>
                                                        <Button size="sm" variant="destructive" onClick={() => setSettings({ ...settings, hero_image_url: null })}>Quitar</Button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center cursor-pointer" onClick={() => fileRefs.hero.current?.click()}>
                                                    {uploadingField === 'hero_image_url' ? <Loader2 className="animate-spin mb-2 mx-auto" /> : <Upload className="mb-2 mx-auto" />}
                                                    <p className="text-xs text-gray-500">Subir imagen</p>
                                                </div>
                                            )}
                                        </div>
                                        <input type="file" ref={fileRefs.hero} hidden accept="image/*" onChange={e => handleFileUpload(e, 'hero_image_url')} />
                                    </div>
                                </div>
                            </div>

                            {/* Intro Section */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                                <h3 className="text-xl font-bold border-b pb-4">Introducción Corporativa</h3>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold">Título Intro</label>
                                            <Input value={settings.intro_title} onChange={e => setSettings({ ...settings, intro_title: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold">Texto Intro</label>
                                            <Textarea value={settings.intro_text} onChange={e => setSettings({ ...settings, intro_text: e.target.value })} className="h-40 resize-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold">Imagen Intro</label>
                                        <div className="aspect-video bg-gray-50 border-2 border-dashed rounded-xl flex items-center justify-center relative overflow-hidden group">
                                            {settings.intro_image_url ? (
                                                <>
                                                    <img src={settings.intro_image_url} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                        <Button size="sm" variant="secondary" onClick={() => fileRefs.intro.current?.click()}>Cambiar</Button>
                                                        <Button size="sm" variant="destructive" onClick={() => setSettings({ ...settings, intro_image_url: null })}>Quitar</Button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center cursor-pointer" onClick={() => fileRefs.intro.current?.click()}>
                                                    {uploadingField === 'intro_image_url' ? <Loader2 className="animate-spin mb-2 mx-auto" /> : <Upload className="mb-2 mx-auto" />}
                                                    <p className="text-xs text-gray-500">Subir imagen</p>
                                                </div>
                                            )}
                                        </div>
                                        <input type="file" ref={fileRefs.intro} hidden accept="image/*" onChange={e => handleFileUpload(e, 'intro_image_url')} />
                                    </div>
                                </div>
                            </div>

                            {/* Mision & Vision */}
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                                    <h3 className="text-lg font-bold flex items-center gap-2"><Target className="w-5 h-5 text-accent" /> Misión</h3>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-gray-400">Título</label>
                                        <Input value={settings.mission_title} onChange={e => setSettings({ ...settings, mission_title: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-gray-400">Descripción</label>
                                        <Textarea value={settings.mission_text} onChange={e => setSettings({ ...settings, mission_text: e.target.value })} className="h-32 resize-none" />
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                                    <h3 className="text-lg font-bold flex items-center gap-2"><Eye className="w-5 h-5 text-accent" /> Visión</h3>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-gray-400">Título</label>
                                        <Input value={settings.vision_title} onChange={e => setSettings({ ...settings, vision_title: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-gray-400">Descripción</label>
                                        <Textarea value={settings.vision_text} onChange={e => setSettings({ ...settings, vision_text: e.target.value })} className="h-32 resize-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Values Section */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold">Nuestros Valores</h3>
                                    <Button size="sm" onClick={addValue} className="gap-2"><Plus className="w-4 h-4" /> Añadir Valor</Button>
                                </div>
                                <div className="grid lg:grid-cols-2 gap-4">
                                    {settings.values.map((v, i) => (
                                        <div key={i} className="p-4 bg-gray-50 rounded-xl border relative shadow-sm hover:shadow-md transition-shadow">
                                            <button onClick={() => removeValue(i)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                                            <div className="grid gap-4">
                                                <div className="flex gap-4">
                                                    <div className="space-y-2 flex-1">
                                                        <label className="text-xs font-bold">Título</label>
                                                        <Input value={v.title} onChange={e => updateValue(i, 'title', e.target.value)} />
                                                    </div>
                                                    <div className="space-y-2 w-24">
                                                        <label className="text-xs font-bold">Icono</label>
                                                        <select
                                                            className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                                            value={v.icon}
                                                            onChange={e => updateValue(i, 'icon', e.target.value)}
                                                        >
                                                            {availableIcons.map(icon => (
                                                                <option key={icon.name} value={icon.name}>{icon.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold">Descripción</label>
                                                    <Textarea value={v.desc} onChange={e => updateValue(i, 'desc', e.target.value)} className="h-20 resize-none" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Benefits Section */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold">¿Por qué elegirnos? (Beneficios)</h3>
                                    <Button size="sm" onClick={addBenefit} className="gap-2"><Plus className="w-4 h-4" /> Añadir Beneficio</Button>
                                </div>
                                <div className="grid gap-3">
                                    {settings.benefits.map((b, i) => (
                                        <div key={i} className="flex gap-2">
                                            <div className="flex-1">
                                                <Input value={b} onChange={e => updateBenefit(i, e.target.value)} placeholder="Ej. Soporte técnico especializado 24/7." />
                                            </div>
                                            <Button size="icon" variant="destructive" onClick={() => removeBenefit(i)} disabled={settings.benefits.length <= 1}>
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminNosotros;
