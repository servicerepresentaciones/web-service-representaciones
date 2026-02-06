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

interface Slide {
    id: string;
    title: string;
    description: string;
    image_url: string;
    button_text: string;
    button_link: string;
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

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) {
                setUser(data.session.user);
            }
        });
        fetchSlides();
    }, []);

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
                    description: currentSlide.description,
                    button_text: currentSlide.button_text,
                    button_link: currentSlide.button_link,
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
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Editar Slide' : 'Nuevo Slide'}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Image Upload Area */}
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full aspect-video bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-accent transition-all relative overflow-hidden group"
                        >
                            {previewUrl ? (
                                <>
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-white font-medium flex items-center gap-2">
                                            <Upload className="w-4 h-4" /> Cambiar Imagen
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center p-4">
                                    <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">Click para subir imagen</p>
                                    <p className="text-xs text-gray-400 mt-1">Recomendado: 1920x1080px</p>
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            hidden
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={handleFileSelect}
                        />

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Título</label>
                                <Input
                                    value={currentSlide.title || ''}
                                    onChange={e => setCurrentSlide({ ...currentSlide, title: e.target.value })}
                                    placeholder="Ej. Bienvenidos a Service Representaciones"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700">Descripción</label>
                                <Textarea
                                    value={currentSlide.description || ''}
                                    onChange={e => setCurrentSlide({ ...currentSlide, description: e.target.value })}
                                    placeholder="Breve texto descriptivo..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Texto Botón</label>
                                    <Input
                                        value={currentSlide.button_text || ''}
                                        onChange={e => setCurrentSlide({ ...currentSlide, button_text: e.target.value })}
                                        placeholder="Ej. Ver Productos"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Enlace Botón</label>
                                    <Input
                                        value={currentSlide.button_link || ''}
                                        onChange={e => setCurrentSlide({ ...currentSlide, button_link: e.target.value })}
                                        placeholder="Ej. /productos"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <label className="text-sm font-medium text-gray-700">Estado Activo</label>
                                <Switch
                                    checked={currentSlide.is_active ?? true}
                                    onCheckedChange={checked => setCurrentSlide({ ...currentSlide, is_active: checked })}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-accent text-white hover:bg-accent/90">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            {isEditing ? 'Guardar Cambios' : 'Crear Slide'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminSliders;
