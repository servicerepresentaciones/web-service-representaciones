import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Loader2, Image as ImageIcon, Save, Upload, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

interface Banner {
    id: string;
    title: string;
    image_url: string;
    link: string;
    is_active: boolean;
    sort_order: number;
}

const AdminBanners = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [banners, setBanners] = useState<Banner[]>([]);

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [currentBanner, setCurrentBanner] = useState<Partial<Banner>>({});
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [logoUrl, setLogoUrl] = useState<string>('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) {
                setUser(data.session.user);
            }
        });
        fetchBanners();
        fetchLogo();
    }, []);

    const fetchLogo = async () => {
        try {
            const { data } = await supabase.from('site_settings').select('logo_url_dark').single();
            if (data?.logo_url_dark) setLogoUrl(data.logo_url_dark);
        } catch (error) {
            console.error('Error fetching logo:', error);
        }
    };

    const fetchBanners = async () => {
        try {
            const { data, error } = await supabase
                .from('promotional_banners')
                .select('*')
                .order('sort_order', { ascending: true })
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBanners(data || []);
        } catch (error) {
            console.error('Error fetching banners:', error);
            toast({
                title: "Error",
                description: "No se pudieron cargar los banners",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast({
                    title: "Archivo muy grande",
                    description: "La imagen debe ser menor a 5MB",
                    variant: "destructive"
                });
                return;
            }
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleDelete = async (banner: Banner) => {
        if (!confirm('¿Estás seguro de eliminar este banner?')) return;

        try {
            // 1. Delete image from storage
            if (banner.image_url) {
                // Extract filename from URL or use ID if naming convention is strict
                // Assuming URL structure contains the filename at the end
                // But better to use the ID as per saving logic
                const fileName = `banners/${banner.id}`;
                const { error: storageError } = await supabase.storage
                    .from('site-assets')
                    .remove([fileName]);

                if (storageError) console.error('Error removing image:', storageError);
            }

            // 2. Delete row from DB
            const { error } = await supabase
                .from('promotional_banners')
                .delete()
                .eq('id', banner.id);

            if (error) throw error;

            setBanners(banners.filter(b => b.id !== banner.id));
            toast({ title: "Banner eliminado correctamente" });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    const handleSave = async () => {
        if (!selectedFile && !currentBanner.image_url) {
            toast({ title: "Faltan datos", description: "Debes añadir una imagen", variant: "destructive" });
            return;
        }

        setSaving(true);
        try {
            // Generate ID if new
            const bannerId = currentBanner.id || crypto.randomUUID();
            let finalImageUrl = currentBanner.image_url;

            // Upload Image if selected
            if (selectedFile) {
                const fileName = `banners/${bannerId}`;
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

                finalImageUrl = `${publicUrl}?t=${Date.now()}`;
            }

            // Upsert Data
            const { error } = await supabase
                .from('promotional_banners')
                .upsert({
                    id: bannerId,
                    title: currentBanner.title,
                    link: currentBanner.link,
                    is_active: currentBanner.is_active ?? true,
                    image_url: finalImageUrl,
                    sort_order: currentBanner.sort_order ?? 0,
                    // created_at is handled by default on insert, but we can update if needed.
                    // usually better to have updated_at column but created_at is fine for now
                } as any);

            if (error) throw error;

            toast({ title: "Banner guardado correctamente" });
            fetchBanners();
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
        setCurrentBanner({});
        setSelectedFile(null);
        setPreviewUrl(null);
        setIsEditing(false);
    };

    const openEdit = (banner: Banner) => {
        setCurrentBanner(banner);
        setPreviewUrl(banner.image_url);
        setIsEditing(true);
        setIsDialogOpen(true);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/admin');
    };

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
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-3xl font-bold text-gray-800">Banners Promocionales</h2>
                                <p className="text-gray-500 mt-2">Gestiona los banners que aparecen debajo del carrusel de productos.</p>
                            </div>
                            <Button
                                onClick={() => { resetForm(); setIsDialogOpen(true); }}
                                className="bg-accent hover:bg-accent/90 text-white gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Nuevo Banner
                            </Button>
                        </div>

                        <div className="grid gap-6">
                            {banners.map((banner) => (
                                <div key={banner.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-6 items-center group">
                                    <div className="h-32 w-48 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative border">
                                        {banner.image_url ? (
                                            <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <ImageIcon className="w-8 h-8 text-gray-300" />
                                            </div>
                                        )}
                                        {!banner.is_active && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <span className="text-white text-xs font-bold px-2 py-1 bg-black/50 rounded-full">INACTIVO</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-lg text-gray-800 truncate">{banner.title || '(Sin título)'}</h3>
                                        {banner.link && (
                                            <div className="flex items-center gap-2 mt-1 text-sm text-blue-600">
                                                <LinkIcon className="w-3 h-3" />
                                                <span className="truncate">{banner.link}</span>
                                            </div>
                                        )}
                                        <div className="mt-2 flex gap-4 text-xs text-gray-500">
                                            <span>Orden: {banner.sort_order}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(banner)}>
                                            <Pencil className="w-4 h-4 text-gray-500 hover:text-accent" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(banner)}>
                                            <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-500" />
                                        </Button>
                                    </div>
                                </div>
                            ))}

                            {banners.length === 0 && (
                                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                                    <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-xl font-medium text-gray-900">No hay banners creados</h3>
                                    <p className="text-gray-500 mt-2">Añade tu primer banner para mostrarlo en la web.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
                    <DialogHeader className="px-1">
                        <DialogTitle className="text-2xl font-bold">{isEditing ? 'Editar Banner' : 'Nuevo Banner'}</DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-6 py-4 custom-scrollbar">
                        {/* Image Upload Area */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Imagen del Banner</label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full aspect-video bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-accent hover:bg-gray-100/50 transition-all relative overflow-hidden group shadow-sm"
                            >
                                {previewUrl ? (
                                    <>
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-white font-medium flex items-center gap-2 bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm">
                                                <Upload className="w-4 h-4" /> Cambiar Imagen
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center p-6">
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                            <ImageIcon className="w-8 h-8 text-accent" />
                                        </div>
                                        <p className="text-base font-medium text-gray-700">Haz clic para subir una imagen</p>
                                        <p className="text-sm text-gray-400 mt-1">Sugerido: Formato Horizontal (Máx 5MB)</p>
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
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Título (Opcional, referencia interna)</label>
                                <Input
                                    value={currentBanner.title || ''}
                                    onChange={e => setCurrentBanner({ ...currentBanner, title: e.target.value })}
                                    placeholder="Ej. Oferta Radios"
                                    className="h-11 shadow-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Enlace (Opcional)</label>
                                <div className="relative">
                                    <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input
                                        value={currentBanner.link || ''}
                                        onChange={e => setCurrentBanner({ ...currentBanner, link: e.target.value })}
                                        placeholder="Ej. /productos/radio-motorola"
                                        className="h-11 shadow-sm pl-10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Orden de Visualización</label>
                                <Input
                                    type="number"
                                    value={currentBanner.sort_order || 0}
                                    onChange={e => setCurrentBanner({ ...currentBanner, sort_order: parseInt(e.target.value) || 0 })}
                                    placeholder="0"
                                    className="h-11 shadow-sm"
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-accent/5 rounded-xl border border-accent/10">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${currentBanner.is_active ?? true ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">Estado de visibilidad</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={currentBanner.is_active ?? true}
                                    onCheckedChange={checked => setCurrentBanner({ ...currentBanner, is_active: checked })}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-6 pb-2 border-t mt-auto px-1 flex sm:justify-between items-center gap-4">
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={saving} className="text-gray-500 hover:bg-gray-100">
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-accent text-white hover:bg-accent/90 h-11 px-8 min-w-[160px] shadow-lg shadow-accent/20">
                            {saving ? (
                                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Guardando...</>
                            ) : (
                                <><Save className="w-4 h-4 mr-2" /> {isEditing ? 'Actualizar Banner' : 'Crear Banner'}</>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminBanners;
