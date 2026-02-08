import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Loader2, Image as ImageIcon, Save, X, GripVertical, Upload } from 'lucide-react';
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

interface Slide {
    id: string;
    title: string;
    subtitle?: string;
    description: string;
    image_url: string;
    button_text: string;
    button_link: string;
    secondary_button_text?: string;
    secondary_button_link?: string;
    is_active: boolean;
    order: number;
}

const AdminSliders = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [slides, setSlides] = useState<Slide[]>([]);

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [currentSlide, setCurrentSlide] = useState<Partial<Slide>>({});
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
        fetchSlides();
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

    const fetchSlides = async () => {
        try {
            const { data, error } = await supabase
                .from('hero_slides')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSlides(data || []);
        } catch (error) {
            console.error('Error fetching slides:', error);
            toast({
                title: "Error",
                description: "No se pudieron cargar los sliders",
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

    const handleDelete = async (slide: Slide) => {
        if (!confirm('¿Estás seguro de eliminar este slide?')) return;

        try {
            // 1. Delete image from storage
            if (slide.image_url) {
                const fileName = `hero-slides/${slide.id}`;
                const { error: storageError } = await supabase.storage
                    .from('site-assets')
                    .remove([fileName]);

                if (storageError) console.error('Error removing image:', storageError);
            }

            // 2. Delete row from DB
            const { error } = await supabase
                .from('hero_slides')
                .delete()
                .eq('id', slide.id);

            if (error) throw error;

            setSlides(slides.filter(s => s.id !== slide.id));
            toast({ title: "Slide eliminado correctamente" });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    const handleSave = async () => {
        if (!currentSlide.title && !selectedFile && !currentSlide.image_url) {
            toast({ title: "Faltan datos", description: "Debes añadir al menos una imagen", variant: "destructive" });
            return;
        }

        setSaving(true);
        try {
            // Generate ID if new
            const slideId = currentSlide.id || crypto.randomUUID();
            let finalImageUrl = currentSlide.image_url;

            // Upload Image if selected
            if (selectedFile) {
                const fileName = `hero-slides/${slideId}`;
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
                .from('hero_slides')
                .upsert({
                    id: slideId,
                    title: currentSlide.title,
                    subtitle: currentSlide.subtitle,
                    description: currentSlide.description,
                    button_text: currentSlide.button_text,
                    button_link: currentSlide.button_link,
                    secondary_button_text: currentSlide.secondary_button_text,
                    secondary_button_link: currentSlide.secondary_button_link,
                    is_active: currentSlide.is_active ?? true,
                    image_url: finalImageUrl,
                    updated_at: new Date().toISOString()
                } as any);

            if (error) throw error;

            toast({ title: "Slide guardado correctamente" });
            fetchSlides();
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
        setCurrentSlide({});
        setSelectedFile(null);
        setPreviewUrl(null);
        setIsEditing(false);
    };

    const openEdit = (slide: Slide) => {
        setCurrentSlide(slide);
        setPreviewUrl(slide.image_url);
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
                                <h2 className="text-3xl font-bold text-gray-800">Sliders Principales</h2>
                                <p className="text-gray-500 mt-2">Gestiona las imágenes rotativas de la página de inicio.</p>
                            </div>
                            <Button
                                onClick={() => { resetForm(); setIsDialogOpen(true); }}
                                className="bg-accent hover:bg-accent/90 text-white gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Nuevo Slide
                            </Button>
                        </div>

                        <div className="grid gap-6">
                            {slides.map((slide) => (
                                <div key={slide.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-6 items-center group">
                                    <div className="h-32 w-48 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative border">
                                        {slide.image_url ? (
                                            <img src={slide.image_url} alt={slide.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <ImageIcon className="w-8 h-8 text-gray-300" />
                                            </div>
                                        )}
                                        {!slide.is_active && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <span className="text-white text-xs font-bold px-2 py-1 bg-black/50 rounded-full">INACTIVO</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-lg text-gray-800 truncate">{slide.title || '(Sin título)'}</h3>
                                        <p className="text-gray-500 text-sm line-clamp-2">{slide.description}</p>
                                        <div className="flex gap-2 mt-2">
                                            {slide.button_text && (
                                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md border border-gray-200">
                                                    Btn: {slide.button_text}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(slide)}>
                                            <Pencil className="w-4 h-4 text-gray-500 hover:text-accent" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(slide)}>
                                            <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-500" />
                                        </Button>
                                    </div>
                                </div>
                            ))}

                            {slides.length === 0 && (
                                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                                    <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-xl font-medium text-gray-900">No hay sliders creados</h3>
                                    <p className="text-gray-500 mt-2">Añade tu primer slider para la página de inicio.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
                    <DialogHeader className="px-1">
                        <DialogTitle className="text-2xl font-bold">{isEditing ? 'Editar Slide' : 'Nuevo Slide'}</DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-8 py-4 custom-scrollbar">
                        {/* Image Upload Area */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Imagen del Slide</label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full aspect-[21/9] bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-accent hover:bg-gray-100/50 transition-all relative overflow-hidden group shadow-sm"
                            >
                                {previewUrl ? (
                                    <>
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
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
                                        <p className="text-sm text-gray-400 mt-1">Sugerido: 1920x1080px (Máx 5MB)</p>
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

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Título Principal</label>
                                    <Input
                                        value={currentSlide.title || ''}
                                        onChange={e => setCurrentSlide({ ...currentSlide, title: e.target.value })}
                                        placeholder="Ej. Infraestructura Tecnológica"
                                        className="h-11 shadow-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Subtítulo / Eslogan</label>
                                    <Input
                                        value={currentSlide.subtitle || ''}
                                        onChange={e => setCurrentSlide({ ...currentSlide, subtitle: e.target.value })}
                                        placeholder="Ej. de Última Generación"
                                        className="h-11 shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Descripción Corta</label>
                                <Textarea
                                    value={currentSlide.description || ''}
                                    onChange={e => setCurrentSlide({ ...currentSlide, description: e.target.value })}
                                    placeholder="Explica brevemente de qué trata este slide..."
                                    className="min-h-[100px] shadow-sm resize-none"
                                />
                            </div>

                            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-6">
                                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                    <div className="w-1 h-4 bg-accent rounded-full"></div>
                                    Configuración de Botones
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    {/* Botón 1 */}
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Texto Botón 1</label>
                                            <Input
                                                value={currentSlide.button_text || ''}
                                                onChange={e => setCurrentSlide({ ...currentSlide, button_text: e.target.value })}
                                                placeholder="Ej. Conocer más"
                                                className="h-10 bg-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Enlace Botón 1</label>
                                            <Input
                                                value={currentSlide.button_link || ''}
                                                onChange={e => setCurrentSlide({ ...currentSlide, button_link: e.target.value })}
                                                placeholder="Ej. /servicios"
                                                className="h-10 bg-white"
                                            />
                                        </div>
                                    </div>

                                    {/* Botón 2 */}
                                    <div className="space-y-4 border-t md:border-t-0 md:border-l md:pl-8 pt-4 md:pt-0 border-gray-200">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Texto Botón 2</label>
                                            <Input
                                                value={currentSlide.secondary_button_text || ''}
                                                onChange={e => setCurrentSlide({ ...currentSlide, secondary_button_text: e.target.value })}
                                                placeholder="Ej. Contactar"
                                                className="h-10 bg-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Enlace Botón 2</label>
                                            <Input
                                                value={currentSlide.secondary_button_link || ''}
                                                onChange={e => setCurrentSlide({ ...currentSlide, secondary_button_link: e.target.value })}
                                                placeholder="Ej. /contacto"
                                                className="h-10 bg-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-accent/5 rounded-xl border border-accent/10">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${currentSlide.is_active ?? true ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">Estado de visibilidad</p>
                                        <p className="text-xs text-gray-500">Define si este slide se muestra en el inicio</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={currentSlide.is_active ?? true}
                                    onCheckedChange={checked => setCurrentSlide({ ...currentSlide, is_active: checked })}
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
                                <><Save className="w-4 h-4 mr-2" /> {isEditing ? 'Actualizar Slide' : 'Crear Slide'}</>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminSliders;
