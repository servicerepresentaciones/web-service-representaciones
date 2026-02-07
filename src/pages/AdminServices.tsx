import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Loader2, Image as ImageIcon, Save, X, Upload, Layers, Search, CheckCircle2, ListChecks, Star } from 'lucide-react';
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

interface Service {
    id: string;
    name: string;
    slug: string;
    subtitle: string;
    description: string;
    image_url: string | null;
    gallery_images: string[];
    benefits: string[];
    features: { titulo: string; detalle: string }[];
    is_active: boolean;
    order: number;
}

const AdminServices = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [currentService, setCurrentService] = useState<Partial<Service>>({
        gallery_images: [],
        benefits: [],
        features: [],
        is_active: true,
        order: 0
    });
    const [selectedMainFile, setSelectedMainFile] = useState<File | null>(null);
    const [mainPreviewUrl, setMainPreviewUrl] = useState<string | null>(null);
    const [selectedGalleryFiles, setSelectedGalleryFiles] = useState<File[]>([]);
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

    const mainFileInputRef = useRef<HTMLInputElement>(null);
    const galleryFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) {
                setUser(data.session.user);
            }
        });
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .order('order', { ascending: true });

            if (error) throw error;
            setServices(data || []);
        } catch (error) {
            console.error('Error fetching services:', error);
            toast({ title: "Error", description: "No se pudieron cargar los servicios", variant: "destructive" });
        } finally {
            setLoading(false);
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
        setCurrentService(prev => ({ ...prev, name, slug }));
    };

    const handleMainFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedMainFile(file);
            setMainPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setSelectedGalleryFiles(prev => [...prev, ...files]);
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setGalleryPreviews(prev => [...prev, ...newPreviews]);
    };

    const removeMainImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedMainFile(null);
        setMainPreviewUrl(null);
        setCurrentService(prev => ({ ...prev, image_url: null }));
    };

    const removeGalleryImage = async (index: number, isExisting: boolean) => {
        if (isExisting) {
            const imageToRemove = currentService.gallery_images?.[index];
            if (imageToRemove) {
                // Sacar nombre del archivo de la URL
                try {
                    const url = new URL(imageToRemove);
                    const pathParts = url.pathname.split('site-assets/');
                    if (pathParts.length > 1) {
                        const filePath = decodeURIComponent(pathParts[1]);
                        await supabase.storage.from('site-assets').remove([filePath]);
                    }
                } catch (e) {
                    console.error("Error parsing gallery image URL for deletion:", e);
                }
            }
            const newImages = [...(currentService.gallery_images || [])];
            newImages.splice(index, 1);
            setCurrentService({ ...currentService, gallery_images: newImages });
        } else {
            const newFiles = [...selectedGalleryFiles];
            const newPreviews = [...galleryPreviews];
            const adjustedIndex = index - (currentService.gallery_images?.length || 0);
            newFiles.splice(adjustedIndex, 1);
            newPreviews.splice(adjustedIndex, 1);
            setSelectedGalleryFiles(newFiles);
            setGalleryPreviews(newPreviews);
        }
    };

    // Benefits logic
    const addBenefit = () => {
        setCurrentService(prev => ({
            ...prev,
            benefits: [...(prev.benefits || []), '']
        }));
    };

    const updateBenefit = (index: number, value: string) => {
        const newBenefits = [...(currentService.benefits || [])];
        newBenefits[index] = value;
        setCurrentService({ ...currentService, benefits: newBenefits });
    };

    const removeBenefit = (index: number) => {
        const newBenefits = [...(currentService.benefits || [])];
        newBenefits.splice(index, 1);
        setCurrentService({ ...currentService, benefits: newBenefits });
    };

    // Features logic
    const addFeature = () => {
        setCurrentService(prev => ({
            ...prev,
            features: [...(prev.features || []), { titulo: '', detalle: '' }]
        }));
    };

    const updateFeature = (index: number, field: 'titulo' | 'detalle', value: string) => {
        const newFeatures = [...(currentService.features || [])];
        newFeatures[index] = { ...newFeatures[index], [field]: value };
        setCurrentService({ ...currentService, features: newFeatures });
    };

    const removeFeature = (index: number) => {
        const newFeatures = [...(currentService.features || [])];
        newFeatures.splice(index, 1);
        setCurrentService({ ...currentService, features: newFeatures });
    };

    const handleSave = async () => {
        if (!currentService.name || !currentService.slug) {
            toast({ title: "Faltan datos", description: "Nombre y slug son obligatorios", variant: "destructive" });
            return;
        }

        setSaving(true);
        try {
            const serviceId = currentService.id || crypto.randomUUID();
            let finalMainImageUrl = currentService.image_url;
            let finalGalleryImages = [...(currentService.gallery_images || [])];

            // 1. Upload Main Image
            if (selectedMainFile) {
                const fileName = `services/${serviceId}/main`;
                const { error: uploadError } = await supabase.storage.from('site-assets').upload(fileName, selectedMainFile, { upsert: true });
                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage.from('site-assets').getPublicUrl(fileName);
                finalMainImageUrl = `${publicUrl}?t=${Date.now()}`;
            } else if (finalMainImageUrl === null && isEditing) {
                // Borrar imagen principal si se removió
                const fileName = `services/${serviceId}/main`;
                await supabase.storage.from('site-assets').remove([fileName]);
            }

            // 2. Upload Gallery
            if (selectedGalleryFiles.length > 0) {
                for (let i = 0; i < selectedGalleryFiles.length; i++) {
                    const file = selectedGalleryFiles[i];
                    const fileName = `services/${serviceId}/gallery-${Date.now()}-${i}`;
                    const { error: uploadError } = await supabase.storage.from('site-assets').upload(fileName, file);
                    if (uploadError) throw uploadError;
                    const { data: { publicUrl } } = supabase.storage.from('site-assets').getPublicUrl(fileName);
                    finalGalleryImages.push(publicUrl);
                }
            }

            // 3. Upsert Service
            const { error } = await supabase
                .from('services')
                .upsert({
                    id: serviceId,
                    name: currentService.name,
                    slug: currentService.slug,
                    subtitle: currentService.subtitle,
                    description: currentService.description,
                    image_url: finalMainImageUrl,
                    gallery_images: finalGalleryImages,
                    benefits: currentService.benefits,
                    features: currentService.features,
                    is_active: currentService.is_active,
                    order: currentService.order,
                    updated_at: new Date().toISOString()
                } as any);

            if (error) throw error;

            toast({ title: "Servicio guardado correctamente" });
            fetchServices();
            setIsDialogOpen(false);
            resetForm();
        } catch (error: any) {
            console.error(error);
            toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (service: Service) => {
        if (!confirm(`¿Eliminar el servicio "${service.name}"?`)) return;
        try {
            const { error } = await supabase.from('services').delete().eq('id', service.id);
            if (error) throw error;
            setServices(services.filter(s => s.id !== service.id));
            toast({ title: "Servicio eliminado" });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const resetForm = () => {
        setCurrentService({ gallery_images: [], benefits: [], features: [], is_active: true, order: 0 });
        setSelectedMainFile(null);
        setMainPreviewUrl(null);
        setSelectedGalleryFiles([]);
        setGalleryPreviews([]);
        setIsEditing(false);
    };

    const openEdit = (service: Service) => {
        setCurrentService(service);
        setMainPreviewUrl(service.image_url);
        setIsEditing(true);
        setIsDialogOpen(true);
    };

    const filteredServices = services.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.subtitle?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F5F6FA]"><Loader2 className="animate-spin text-accent w-12 h-12" /></div>;

    return (
        <div className="min-h-screen bg-[#F5F6FA] flex">
            <div className="hidden lg:block relative z-20">
                <AdminSidebar onLogout={() => supabase.auth.signOut().then(() => navigate('/admin'))} />
            </div>
            <div className="flex-1 flex flex-col min-w-0">
                <AdminHeader userEmail={user?.email} />
                <main className="p-4 lg:p-8 overflow-y-auto max-h-[calc(100vh-80px)]">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                            <div>
                                <h2 className="text-3xl font-bold text-gray-800">Servicios</h2>
                                <p className="text-gray-500 mt-2">Gestiona las soluciones y servicios empresariales.</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="relative">
                                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <Input placeholder="Buscar servicios..." className="pl-10 w-full md:w-64 bg-white border-none shadow-sm h-11" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                </div>
                                <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="bg-accent hover:bg-accent/90 text-white h-11 gap-2">
                                    <Plus className="w-4 h-4" /> Nuevo Servicio
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredServices.map(service => (
                                <div key={service.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-all">
                                    <div className="h-48 relative overflow-hidden bg-gray-100">
                                        {service.image_url ? (
                                            <img src={service.image_url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center"><Layers className="text-gray-300 w-12 h-12" /></div>
                                        )}
                                        {!service.is_active && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                <span className="text-white text-xs font-bold px-3 py-1 bg-black/50 rounded-full">INACTIVO</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-6">
                                        <h3 className="font-bold text-xl text-gray-800 mb-1 truncate">{service.name}</h3>
                                        <p className="text-gray-500 text-sm mb-4 line-clamp-2">{service.subtitle}</p>
                                        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                            <span className="text-xs font-mono text-gray-400 uppercase">{service.slug}</span>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => openEdit(service)}><Pencil className="w-4 h-4 text-gray-400" /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(service)}><Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" /></Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-5xl max-h-[95vh] flex flex-col p-0">
                    <DialogHeader className="p-6 border-b">
                        <DialogTitle className="text-2xl font-bold">{isEditing ? 'Editar Servicio' : 'Nuevo Servicio'}</DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* Left Column: Media */}
                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold flex items-center gap-2"><ImageIcon className="w-4 h-4 text-accent" /> Imagen Principal</label>
                                    <div onClick={() => mainFileInputRef.current?.click()} className="aspect-video bg-gray-50 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-all overflow-hidden relative group shadow-sm">
                                        {mainPreviewUrl ? (
                                            <>
                                                <img src={mainPreviewUrl} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="flex gap-2">
                                                        <span className="text-white font-medium flex items-center gap-2 bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm">
                                                            <Upload className="w-4 h-4" /> Cambiar Imagen
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={removeMainImage}
                                                            className="bg-red-500/80 hover:bg-red-600 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                                                        >
                                                            <X className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center">
                                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                                                    <Plus className="text-accent" />
                                                </div>
                                                <p className="text-sm font-medium text-gray-700">Subir imagen hero</p>
                                                <p className="text-xs text-gray-400 mt-1">Sugerido: 1920x1080px</p>
                                            </div>
                                        )}
                                    </div>
                                    <input type="file" ref={mainFileInputRef} hidden accept="image/*" onChange={handleMainFileSelect} />
                                </div>

                                <div className="space-y-4">
                                    <label className="text-sm font-bold flex items-center gap-2"><ImageIcon className="w-4 h-4 text-accent" /> Galería Complementaria</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[...(currentService.gallery_images || []), ...galleryPreviews].map((url, i) => (
                                            <div key={i} className="aspect-video rounded-xl border relative group overflow-hidden shadow-sm">
                                                <img src={url} className="w-full h-full object-cover" />
                                                <button onClick={() => removeGalleryImage(i, i < (currentService.gallery_images?.length || 0))} className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                                            </div>
                                        ))}
                                        <button onClick={() => galleryFileInputRef.current?.click()} className="aspect-video border-2 border-dashed rounded-xl flex items-center justify-center text-gray-300 hover:text-accent hover:border-accent transition-all bg-gray-50/50"><Plus className="w-6 h-6" /></button>
                                    </div>
                                    <input type="file" ref={galleryFileInputRef} hidden multiple accept="image/*" onChange={handleGallerySelect} />
                                </div>
                            </div>

                            {/* Right Column: Info */}
                            <div className="space-y-6">
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold">Nombre del Servicio</label>
                                        <Input value={currentService.name || ''} onChange={e => handleNameChange(e.target.value)} placeholder="Ej. Seguridad Electrónica Premium" className="h-11" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold">Subtítulo / Eslogan</label>
                                        <Input value={currentService.subtitle || ''} onChange={e => setCurrentService({ ...currentService, subtitle: e.target.value })} placeholder="Ej. Sistemas avanzados de vigilancia" className="h-11" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold">Slug (URL)</label>
                                        <Input value={currentService.slug || ''} onChange={e => setCurrentService({ ...currentService, slug: e.target.value })} className="h-11 bg-gray-50" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold">Descripción Ampliada</label>
                                        <Textarea value={currentService.description || ''} onChange={e => setCurrentService({ ...currentService, description: e.target.value })} className="min-h-[120px] resize-none" placeholder="Describe detalladamente el servicio..." />
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-accent/5 rounded-xl border border-accent/10">
                                        <div>
                                            <p className="text-sm font-bold">Estado del Servicio</p>
                                            <p className="text-xs text-gray-500">Visible en la web principal</p>
                                        </div>
                                        <Switch checked={currentService.is_active} onCheckedChange={val => setCurrentService({ ...currentService, is_active: val })} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Extra Sections */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-4">
                            {/* Benefits */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-bold flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-accent" /> Beneficios Principales</h4>
                                    <Button type="button" variant="outline" size="sm" onClick={addBenefit} className="h-8 gap-1"><Plus className="w-3 h-3" /> Añadir</Button>
                                </div>
                                <div className="space-y-3">
                                    {currentService.benefits?.map((benefit, i) => (
                                        <div key={i} className="flex gap-2">
                                            <Input value={benefit} onChange={e => updateBenefit(i, e.target.value)} placeholder="Ej. Soporte 24/7 certificado" className="h-10" />
                                            <Button variant="ghost" size="icon" onClick={() => removeBenefit(i)} className="text-gray-400 hover:text-red-500 flex-shrink-0"><X className="w-4 h-4" /></Button>
                                        </div>
                                    ))}
                                    {(!currentService.benefits || currentService.benefits.length === 0) && <p className="text-xs text-gray-400 italic py-2">No hay beneficios añadidos aún.</p>}
                                </div>
                            </div>

                            {/* Features */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-bold flex items-center gap-2"><Star className="w-5 h-5 text-accent" /> Características Técnicas</h4>
                                    <Button type="button" variant="outline" size="sm" onClick={addFeature} className="h-8 gap-1"><Plus className="w-3 h-3" /> Añadir</Button>
                                </div>
                                <div className="space-y-4">
                                    {currentService.features?.map((feat, i) => (
                                        <div key={i} className="p-4 bg-gray-50 rounded-xl relative group border border-transparent hover:border-accent/20 transition-all">
                                            <button onClick={() => removeFeature(i)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                            <div className="space-y-3">
                                                <Input value={feat.titulo} onChange={e => updateFeature(i, 'titulo', e.target.value)} placeholder="Título (Ej. Almacenamiento SSD)" className="bg-white h-9" />
                                                <Input value={feat.detalle} onChange={e => updateFeature(i, 'detalle', e.target.value)} placeholder="Detalle (Ej. 500GB redundante)" className="bg-white h-9" />
                                            </div>
                                        </div>
                                    ))}
                                    {(!currentService.features || currentService.features.length === 0) && <p className="text-xs text-gray-400 italic py-2">No hay características añadidas aún.</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 border-t bg-gray-50/50 flex sm:justify-between items-center">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span className="w-2 h-2 rounded-full bg-accent"></span>
                            Orden de visualización:
                            <input type="number" className="w-12 bg-transparent border-b border-gray-200 text-center font-bold focus:outline-none" value={currentService.order} onChange={e => setCurrentService({ ...currentService, order: parseInt(e.target.value) })} />
                        </div>
                        <div className="flex gap-3">
                            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={saving}>Cancelar</Button>
                            <Button onClick={handleSave} disabled={saving} className="bg-accent text-white hover:bg-accent/90 min-w-[160px] shadow-lg shadow-accent/20">
                                {saving ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                {isEditing ? 'Actualizar Servicio' : 'Publicar Servicio'}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminServices;
