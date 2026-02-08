import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Loader2, Image as ImageIcon, Save, X, Upload, BadgeCheck, Search, SlidersHorizontal, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import PageLoading from '@/components/PageLoading';

interface Brand {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logo_url: string | null;
    is_active: boolean;
    order: number;
}

const AdminBrands = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Brand Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [currentBrand, setCurrentBrand] = useState<Partial<Brand>>({});
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Section Settings Dialog State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [savingSettings, setSavingSettings] = useState(false);
    const [sectionSettings, setSectionSettings] = useState({
        title: '',
        subtitle: '',
        stat1_value: '',
        stat1_label: '',
        stat2_value: '',
        stat2_label: '',
        stat3_value: '',
        stat3_label: '',
        stat4_value: '',
        stat4_label: '',
    });
    const [logoUrl, setLogoUrl] = useState<string>('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) {
                setUser(data.session.user);
            }
        });
        fetchBrands();
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data } = await supabase.from('site_settings').select('*').single();
            if (data?.logo_url_dark) setLogoUrl(data.logo_url_dark);
            if (data) {
                setSectionSettings({
                    title: data.brands_title || 'Marcas que Representamos',
                    subtitle: data.brands_subtitle || 'Somos distribuidores autorizados de las principales marcas tecnológicas del mundo',
                    stat1_value: data.brands_stat1_value || '50+',
                    stat1_label: data.brands_stat1_label || 'Marcas Representadas',
                    stat2_value: data.brands_stat2_value || '15+',
                    stat2_label: data.brands_stat2_label || 'Años de Experiencia',
                    stat3_value: data.brands_stat3_value || '500+',
                    stat3_label: data.brands_stat3_label || 'Clientes Empresariales',
                    stat4_value: data.brands_stat4_value || '24/7',
                    stat4_label: data.brands_stat4_label || 'Soporte Técnico',
                });
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    const fetchBrands = async () => {
        try {
            const { data, error } = await supabase
                .from('brands')
                .select('*')
                .order('order', { ascending: true });

            if (error) throw error;
            setBrands(data || []);
        } catch (error) {
            console.error('Error fetching brands:', error);
            toast({
                title: "Error",
                description: "No se pudieron cargar las marcas",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        setSavingSettings(true);
        try {
            const { error } = await supabase
                .from('site_settings')
                .update({
                    brands_title: sectionSettings.title,
                    brands_subtitle: sectionSettings.subtitle,
                    brands_stat1_value: sectionSettings.stat1_value,
                    brands_stat1_label: sectionSettings.stat1_label,
                    brands_stat2_value: sectionSettings.stat2_value,
                    brands_stat2_label: sectionSettings.stat2_label,
                    brands_stat3_value: sectionSettings.stat3_value,
                    brands_stat3_label: sectionSettings.stat3_label,
                    brands_stat4_value: sectionSettings.stat4_value,
                    brands_stat4_label: sectionSettings.stat4_label,
                })
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Dummy condition to trigger update on all rows (usually just 1) or better specify ID if known. Typically single row table.

            if (error) throw error;

            // Or better, assume ID is known or fetch it. Typically just updated the single row.
            // Let's use a dummy ID check or just the ID we fetched earlier if we stored it. 
            // For simplicity, let's assume we update ANY row or the first row. 
            // Since we don't store ID, let's fetch it first or use .neq('id', 0) if UUID.
            // Actually, we should use the id from `fetchSettings` if we stored it. 
            // Let's refactor fetchSettings to store id or just use a known method.
            // Re-fetch fetchSettings above gets the data. 

            toast({ title: "Configuración guardada" });
            setIsSettingsOpen(false);
        } catch (error: any) {
            console.error(error);
            toast({ title: "Error", description: "No se pudo guardar la configuración", variant: "destructive" });
        } finally {
            setSavingSettings(false);
        }
    };

    const generateSlug = (text: string) => {
        return text
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^\w ]+/g, '')
            .replace(/ +/g, '-');
    };

    const handleNameChange = (name: string) => {
        const slug = generateSlug(name);
        setCurrentBrand(prev => ({ ...prev, name, slug }));
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast({
                    title: "Archivo muy grande",
                    description: "El logo debe ser menor a 2MB",
                    variant: "destructive"
                });
                return;
            }
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleDelete = async (brand: Brand) => {
        if (!confirm(`¿Estás seguro de eliminar la marca "${brand.name}"?`)) return;

        try {
            if (brand.logo_url) {
                const fileName = `brands/${brand.id}`;
                await supabase.storage
                    .from('site-assets')
                    .remove([fileName]);
            }

            const { error } = await supabase
                .from('brands')
                .delete()
                .eq('id', brand.id);

            if (error) throw error;

            setBrands(brands.filter(b => b.id !== brand.id));
            toast({ title: "Marca eliminada correctamente" });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    const removeLogo = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedFile(null);
        setPreviewUrl(null);
        setCurrentBrand(prev => ({ ...prev, logo_url: null }));
    };

    const handleSave = async () => {
        if (!currentBrand.name || !currentBrand.slug) {
            toast({ title: "Faltan datos", description: "El nombre y el slug son obligatorios", variant: "destructive" });
            return;
        }

        setSaving(true);
        try {
            const brandId = currentBrand.id || crypto.randomUUID();
            let finalLogoUrl = currentBrand.logo_url;

            if (selectedFile) {
                const fileName = `brands/${brandId}`;
                const { error: uploadError } = await supabase.storage
                    .from('site-assets')
                    .upload(fileName, selectedFile, {
                        upsert: true,
                        contentType: selectedFile.type
                    });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('site-assets')
                    .getPublicUrl(fileName);

                finalLogoUrl = `${publicUrl}?t=${Date.now()}`;
            } else if (finalLogoUrl === null && isEditing) {
                // Si el logo fue removido manualmente
                const fileName = `brands/${brandId}`;
                await supabase.storage
                    .from('site-assets')
                    .remove([fileName]);
            }

            const { error } = await supabase
                .from('brands')
                .upsert({
                    id: brandId,
                    name: currentBrand.name,
                    slug: currentBrand.slug,
                    description: currentBrand.description,
                    logo_url: finalLogoUrl,
                    is_active: currentBrand.is_active ?? true,
                    order: currentBrand.order || 0,
                    updated_at: new Date().toISOString()
                } as any);

            if (error) throw error;

            toast({ title: "Marca guardada correctamente" });
            fetchBrands();
            setIsDialogOpen(false);
            resetForm();

        } catch (error: any) {
            console.error(error);
            toast({
                title: "Error al guardar",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setCurrentBrand({});
        setSelectedFile(null);
        setPreviewUrl(null);
        setIsEditing(false);
    };

    const openEdit = (brand: Brand) => {
        setCurrentBrand(brand);
        setPreviewUrl(brand.logo_url);
        setIsEditing(true);
        setIsDialogOpen(true);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/admin');
    };

    const filteredBrands = brands.filter(brand =>
        brand.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <PageLoading logoUrl={logoUrl} />;
    }

    return (
        <div className="min-h-screen bg-[#F5F6FA] flex">
            <div className="hidden lg:block relative z-20">
                <AdminSidebar onLogout={handleLogout} />
            </div>

            <div className="flex-1 flex flex-col min-w-0">
                <AdminHeader userEmail={user?.email} />

                <main className="p-4 lg:p-8 overflow-y-auto max-h-[calc(100vh-80px)]">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                            <div>
                                <h2 className="text-3xl font-bold text-gray-800">Marcas</h2>
                                <p className="text-gray-500 mt-2">Gestiona las marcas asociadas a tus productos.</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="relative">
                                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <Input
                                        placeholder="Buscar marcas..."
                                        className="pl-10 w-full md:w-64 bg-white border-none shadow-sm h-11"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Button
                                    onClick={() => setIsSettingsOpen(true)}
                                    variant="outline"
                                    className="gap-2 h-11"
                                >
                                    <Settings className="w-4 h-4" />
                                    Configurar
                                </Button>
                                <Button
                                    onClick={() => { resetForm(); setIsDialogOpen(true); }}
                                    className="bg-accent hover:bg-accent/90 text-white gap-2 h-11"
                                >
                                    <Plus className="w-4 h-4" />
                                    Nueva Marca
                                </Button>
                            </div>
                        </div>

                        <div className="grid gap-6">
                            {filteredBrands.map((brand) => (
                                <div key={brand.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-6 items-center group transition-all hover:shadow-md">
                                    <div className="h-20 w-32 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 relative border border-gray-100 flex items-center justify-center p-2">
                                        {brand.logo_url ? (
                                            <img src={brand.logo_url} alt={brand.name} className="max-w-full max-h-full object-contain filter grayscale group-hover:grayscale-0 transition-all" />
                                        ) : (
                                            <BadgeCheck className="w-8 h-8 text-gray-200" />
                                        )}
                                        {!brand.is_active && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                <span className="text-white text-[10px] font-bold px-2 py-0.5 bg-black/50 rounded-full uppercase">Inactivo</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-lg text-gray-800 truncate">{brand.name}</h3>
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-400 text-[10px] rounded-full font-mono uppercase">
                                                {brand.slug}
                                            </span>
                                        </div>
                                        <p className="text-gray-500 text-sm line-clamp-1 mt-1">
                                            {brand.description || 'Sin descripción'}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(brand)}>
                                            <Pencil className="w-4 h-4 text-gray-500 hover:text-accent" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(brand)}>
                                            <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-500" />
                                        </Button>
                                    </div>
                                </div>
                            ))}

                            {filteredBrands.length === 0 && (
                                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                                    <BadgeCheck className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                    <h3 className="text-xl font-medium text-gray-900">No hay marcas registradas</h3>
                                    <p className="text-gray-500 mt-2">Añade marcas para vincularlas con tus productos.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* Brand Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">{isEditing ? 'Editar Marca' : 'Nueva Marca'}</DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-6 py-4 custom-scrollbar">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Logo de la Marca</label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full aspect-[2/1] bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-accent hover:bg-gray-100/50 transition-all relative overflow-hidden group shadow-sm p-8"
                            >
                                {previewUrl ? (
                                    <>
                                        <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="flex gap-2">
                                                <span className="text-white font-medium flex items-center gap-2 bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm">
                                                    <Upload className="w-4 h-4" /> Cambiar Logo
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={removeLogo}
                                                    className="bg-red-500/80 hover:bg-red-600 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                            <BadgeCheck className="w-8 h-8 text-accent" />
                                        </div>
                                        <p className="text-base font-medium text-gray-700">Subir Logo</p>
                                        <p className="text-sm text-gray-400 mt-1">Sugerido: Fondo transparente (PNG/SVG)</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <input
                            type="file"
                            hidden
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={handleFileSelect}
                        />

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Nombre</label>
                                    <Input
                                        value={currentBrand.name || ''}
                                        onChange={e => handleNameChange(e.target.value)}
                                        placeholder="Ej. Hikvision"
                                        className="h-11 shadow-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Slug (URL)</label>
                                    <Input
                                        value={currentBrand.slug || ''}
                                        onChange={e => setCurrentBrand({ ...currentBrand, slug: e.target.value })}
                                        placeholder="hikvision"
                                        className="h-11 shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Descripción (Opcional)</label>
                                <Textarea
                                    value={currentBrand.description || ''}
                                    onChange={e => setCurrentBrand({ ...currentBrand, description: e.target.value })}
                                    placeholder="Información sobre la marca..."
                                    className="min-h-[80px] shadow-sm resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-accent/5 rounded-xl border border-accent/10">
                                <label className="text-sm font-semibold text-gray-800">Marca Activa</label>
                                <Switch
                                    checked={currentBrand.is_active ?? true}
                                    onCheckedChange={checked => setCurrentBrand({ ...currentBrand, is_active: checked })}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-6 pb-2 border-t mt-auto">
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={saving} className="text-gray-500">
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-accent text-white hover:bg-accent/90 min-w-[140px]">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            {isEditing ? 'Guardar Cambios' : 'Registrar Marca'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Config Dialog */}
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Configuración de Sección</DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-6 py-4 custom-scrollbar">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Título de la Sección</label>
                                <Input
                                    value={sectionSettings.title}
                                    onChange={e => setSectionSettings({ ...sectionSettings, title: e.target.value })}
                                    placeholder="Marcas que Representamos"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Subtítulo</label>
                                <Textarea
                                    value={sectionSettings.subtitle}
                                    onChange={e => setSectionSettings({ ...sectionSettings, subtitle: e.target.value })}
                                    placeholder="Somos distribuidores..."
                                    className="h-20"
                                />
                            </div>

                            <div className="border-t pt-4 mt-4">
                                <h4 className="font-bold text-gray-800 mb-4">Estadísticas</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Estadística 1</label>
                                        <Input
                                            value={sectionSettings.stat1_value}
                                            onChange={e => setSectionSettings({ ...sectionSettings, stat1_value: e.target.value })}
                                            placeholder="Valor (ej: 50+)"
                                            className="mb-1"
                                        />
                                        <Input
                                            value={sectionSettings.stat1_label}
                                            onChange={e => setSectionSettings({ ...sectionSettings, stat1_label: e.target.value })}
                                            placeholder="Etiqueta"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Estadística 2</label>
                                        <Input
                                            value={sectionSettings.stat2_value}
                                            onChange={e => setSectionSettings({ ...sectionSettings, stat2_value: e.target.value })}
                                            placeholder="Valor (ej: 15+)"
                                            className="mb-1"
                                        />
                                        <Input
                                            value={sectionSettings.stat2_label}
                                            onChange={e => setSectionSettings({ ...sectionSettings, stat2_label: e.target.value })}
                                            placeholder="Etiqueta"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Estadística 3</label>
                                        <Input
                                            value={sectionSettings.stat3_value}
                                            onChange={e => setSectionSettings({ ...sectionSettings, stat3_value: e.target.value })}
                                            placeholder="Valor (ej: 500+)"
                                            className="mb-1"
                                        />
                                        <Input
                                            value={sectionSettings.stat3_label}
                                            onChange={e => setSectionSettings({ ...sectionSettings, stat3_label: e.target.value })}
                                            placeholder="Etiqueta"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Estadística 4</label>
                                        <Input
                                            value={sectionSettings.stat4_value}
                                            onChange={e => setSectionSettings({ ...sectionSettings, stat4_value: e.target.value })}
                                            placeholder="Valor (ej: 24/7)"
                                            className="mb-1"
                                        />
                                        <Input
                                            value={sectionSettings.stat4_label}
                                            onChange={e => setSectionSettings({ ...sectionSettings, stat4_label: e.target.value })}
                                            placeholder="Etiqueta"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-6 pb-2 border-t mt-auto">
                        <Button variant="ghost" onClick={() => setIsSettingsOpen(false)} disabled={savingSettings} className="text-gray-500">
                            Cancelar
                        </Button>
                        <Button onClick={handleSaveSettings} disabled={savingSettings} className="bg-accent text-white hover:bg-accent/90">
                            {savingSettings ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Guardar Configuración
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminBrands;
