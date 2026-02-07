import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Loader2, Image as ImageIcon, Save, X, Upload, Package, Search, Filter, PlusCircle, Trash } from 'lucide-react';
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

interface Product {
    id: string;
    name: string;
    slug: string;
    description: string;
    category_id: string | null;
    brand_id: string | null;
    main_image_url: string | null;
    images: string[];
    specifications: { label: string; value: string }[];
    datasheet_url: string | null;
    price: string | null;
    is_new: boolean;
    is_active: boolean;
    order: number;
    category?: { name: string };
    brand?: { name: string };
}

const AdminProducts = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
    const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [productsBgUrl, setProductsBgUrl] = useState<string | null>(null);
    const [settingsId, setSettingsId] = useState<string | null>(null);
    const [uploadingBg, setUploadingBg] = useState(false);
    const headerFileInputRef = useRef<HTMLInputElement>(null);

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({
        images: [],
        specifications: [],
        is_new: false,
        is_active: true,
        order: 0
    });
    const [selectedMainFile, setSelectedMainFile] = useState<File | null>(null);
    const [mainPreviewUrl, setMainPreviewUrl] = useState<string | null>(null);
    const [selectedGalleryFiles, setSelectedGalleryFiles] = useState<File[]>([]);
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
    const [datasheetFile, setDatasheetFile] = useState<File | null>(null);

    const mainFileInputRef = useRef<HTMLInputElement>(null);
    const galleryFileInputRef = useRef<HTMLInputElement>(null);
    const datasheetInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) {
                setUser(data.session.user);
            }
        });
        fetchInitialData();
        fetchPageSettings();
    }, []);

    const fetchPageSettings = async () => {
        const { data } = await supabase.from('site_settings').select('id, products_bg_url').single();
        if (data) {
            setProductsBgUrl(data.products_bg_url);
            setSettingsId(data.id);
        }
    };

    const handleHeaderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingBg(true);
        try {
            const fileName = `page-headers/products-${Date.now()}`;
            const { error: uploadError } = await supabase.storage
                .from('site-assets')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('site-assets')
                .getPublicUrl(fileName);

            const finalUrl = `${publicUrl}?t=${Date.now()}`;

            const { error: dbError } = await supabase
                .from('site_settings')
                .update({ products_bg_url: finalUrl })
                .eq('id', settingsId); // Update using actual ID

            if (dbError) throw dbError;

            setProductsBgUrl(finalUrl);
            toast({ title: "Fondo actualizado", description: "La imagen de cabecera de la página de productos ha sido actualizada." });
        } catch (error: any) {
            console.error(error);
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setUploadingBg(false);
        }
    };

    const handleRemoveBg = async () => {
        if (!productsBgUrl) return;

        try {
            // 1. Get file path from URL
            const urlWithoutQuery = productsBgUrl.split('?')[0];
            const parts = urlWithoutQuery.split('site-assets/');
            const filePath = parts.length > 1 ? parts[1] : null;

            // 2. Remove from database
            const { error: dbError } = await supabase
                .from('site_settings')
                .update({ products_bg_url: null })
                .eq('id', settingsId);

            if (dbError) throw dbError;

            // 3. Remove from storage if path exists
            if (filePath) {
                await supabase.storage
                    .from('site-assets')
                    .remove([filePath]);
            }

            setProductsBgUrl(null);
            toast({ title: "Fondo eliminado", description: "Se ha removido el fondo y el archivo del servidor." });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const fetchInitialData = async () => {
        try {
            const [prodRes, catRes, brandRes] = await Promise.all([
                supabase.from('products').select('*, category:categories(name), brand:brands(name)').order('created_at', { ascending: false }),
                supabase.from('categories').select('id, name').order('name'),
                supabase.from('brands').select('id, name').order('name')
            ]);

            if (prodRes.error) throw prodRes.error;
            if (catRes.error) throw catRes.error;
            if (brandRes.error) throw brandRes.error;

            setProducts(prodRes.data || []);
            setCategories(catRes.data || []);
            setBrands(brandRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast({ title: "Error", description: "No se pudieron cargar los datos", variant: "destructive" });
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
        setCurrentProduct(prev => ({ ...prev, name, slug }));
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

    const removeGalleryImage = (index: number, isExisting: boolean) => {
        if (isExisting) {
            const newImages = [...(currentProduct.images || [])];
            newImages.splice(index, 1);
            setCurrentProduct({ ...currentProduct, images: newImages });
        } else {
            const newFiles = [...selectedGalleryFiles];
            const newPreviews = [...galleryPreviews];
            const adjustedIndex = index - (currentProduct.images?.length || 0);
            newFiles.splice(adjustedIndex, 1);
            newPreviews.splice(adjustedIndex, 1);
            setSelectedGalleryFiles(newFiles);
            setGalleryPreviews(newPreviews);
        }
    };

    const addSpecification = () => {
        const specs = [...(currentProduct.specifications || []), { label: '', value: '' }];
        setCurrentProduct({ ...currentProduct, specifications: specs });
    };

    const updateSpecification = (index: number, field: 'label' | 'value', value: string) => {
        const specs = [...(currentProduct.specifications || [])];
        specs[index] = { ...specs[index], [field]: value };
        setCurrentProduct({ ...currentProduct, specifications: specs });
    };

    const removeSpecification = (index: number) => {
        const specs = [...(currentProduct.specifications || [])];
        specs.splice(index, 1);
        setCurrentProduct({ ...currentProduct, specifications: specs });
    };

    const handleSave = async () => {
        if (!currentProduct.name || !currentProduct.slug) {
            toast({ title: "Faltan datos", description: "Nombre y slug son obligatorios", variant: "destructive" });
            return;
        }

        setSaving(true);
        try {
            const productId = currentProduct.id || crypto.randomUUID();
            let finalMainImageUrl = currentProduct.main_image_url;
            let finalDatasheetUrl = currentProduct.datasheet_url;
            let finalGalleryImages = [...(currentProduct.images || [])];

            // 1. Upload Main Image
            if (selectedMainFile) {
                const fileName = `products/${productId}/main`;
                await supabase.storage.from('site-assets').upload(fileName, selectedMainFile, { upsert: true });
                const { data: { publicUrl } } = supabase.storage.from('site-assets').getPublicUrl(fileName);
                finalMainImageUrl = `${publicUrl}?t=${Date.now()}`;
            }

            // 2. Upload Datasheet
            if (datasheetFile) {
                const fileName = `products/${productId}/datasheet.pdf`;
                await supabase.storage.from('site-assets').upload(fileName, datasheetFile, { upsert: true, contentType: 'application/pdf' });
                const { data: { publicUrl } } = supabase.storage.from('site-assets').getPublicUrl(fileName);
                finalDatasheetUrl = publicUrl;
            }

            // 3. Upload Gallery
            if (selectedGalleryFiles.length > 0) {
                for (let i = 0; i < selectedGalleryFiles.length; i++) {
                    const file = selectedGalleryFiles[i];
                    const fileName = `products/${productId}/gallery-${Date.now()}-${i}`;
                    await supabase.storage.from('site-assets').upload(fileName, file);
                    const { data: { publicUrl } } = supabase.storage.from('site-assets').getPublicUrl(fileName);
                    finalGalleryImages.push(publicUrl);
                }
            }

            // 4. Upsert Product
            const { error } = await supabase
                .from('products')
                .upsert({
                    id: productId,
                    name: currentProduct.name,
                    slug: currentProduct.slug,
                    description: currentProduct.description,
                    category_id: currentProduct.category_id,
                    brand_id: currentProduct.brand_id,
                    main_image_url: finalMainImageUrl,
                    images: finalGalleryImages,
                    specifications: currentProduct.specifications,
                    datasheet_url: finalDatasheetUrl,
                    price: currentProduct.price,
                    is_new: currentProduct.is_new,
                    is_active: currentProduct.is_active,
                    order: currentProduct.order,
                    updated_at: new Date().toISOString()
                } as any);

            if (error) throw error;

            toast({ title: "Producto guardado correctamente" });
            fetchInitialData();
            setIsDialogOpen(false);
            resetForm();
        } catch (error: any) {
            console.error(error);
            toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (product: Product) => {
        if (!confirm(`¿Eliminar "${product.name}"?`)) return;
        try {
            const { error } = await supabase.from('products').delete().eq('id', product.id);
            if (error) throw error;
            setProducts(products.filter(p => p.id !== product.id));
            toast({ title: "Producto eliminado" });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const resetForm = () => {
        setCurrentProduct({ images: [], specifications: [], is_new: false, is_active: true, order: 0 });
        setSelectedMainFile(null);
        setMainPreviewUrl(null);
        setSelectedGalleryFiles([]);
        setGalleryPreviews([]);
        setDatasheetFile(null);
        setIsEditing(false);
    };

    const openEdit = (product: Product) => {
        setCurrentProduct(product);
        setMainPreviewUrl(product.main_image_url);
        setIsEditing(true);
        setIsDialogOpen(true);
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F5F6FA]"><Loader2 className="animate-spin text-accent w-12 h-12" /></div>;

    return (
        <div className="min-h-screen bg-[#F5F6FA] flex">
            <div className="hidden lg:block relative z-20"><AdminSidebar onLogout={() => supabase.auth.signOut().then(() => navigate('/admin'))} /></div>
            <div className="flex-1 flex flex-col min-w-0">
                <AdminHeader userEmail={user?.email} />
                <main className="p-4 lg:p-8 overflow-y-auto max-h-[calc(100vh-80px)]">
                    <div className="max-w-6xl mx-auto">
                        <div className="space-y-6 mb-8">
                            {/* Line 1: Title and Actions Row */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-800">Productos</h2>
                                    <p className="text-gray-500 mt-1">Gestiona el catálogo completo de equipos.</p>
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Products Page Header Manager */}
                                    <div className="bg-white p-2 px-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            className="h-10 px-4 border-accent text-accent hover:bg-accent hover:text-white transition-all gap-2 font-bold text-sm"
                                            onClick={() => headerFileInputRef.current?.click()}
                                            disabled={uploadingBg}
                                        >
                                            {uploadingBg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                            Subir imagen de fondo
                                        </Button>

                                        {productsBgUrl && (
                                            <Button
                                                variant="ghost"
                                                className="h-10 px-3 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors gap-2 text-sm"
                                                onClick={handleRemoveBg}
                                                disabled={uploadingBg}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                        <input type="file" ref={headerFileInputRef} hidden accept="image/*" onChange={handleHeaderUpload} />
                                    </div>

                                    {/* New Product Button */}
                                    <Button
                                        onClick={() => { resetForm(); setIsDialogOpen(true); }}
                                        className="bg-accent hover:bg-accent/90 text-white h-11 px-6 gap-2 shadow-md font-bold"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Nuevo Producto
                                    </Button>
                                </div>
                            </div>

                            {/* Line 2: Full-width Search */}
                            <div className="pt-2">
                                <div className="relative w-full">
                                    <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                    <Input
                                        placeholder="Buscar productos por nombre, categoría o especificaciones..."
                                        className="pl-12 w-full bg-white border-none shadow-sm h-12 rounded-xl text-lg"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-4">
                            {filteredProducts.map(product => (
                                <div key={product.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-6 items-center group hover:shadow-md transition-all">
                                    <div className="h-20 w-20 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border flex items-center justify-center">
                                        {product.main_image_url ? <img src={product.main_image_url} className="w-full h-full object-cover" /> : <Package className="text-gray-200 w-8 h-8" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-gray-800 truncate">{product.name}</h3>
                                            {product.is_new && <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-bold">NUEVO</span>}
                                        </div>
                                        <div className="flex gap-4 mt-1 text-sm text-gray-500">
                                            <span className="flex items-center gap-1"><Filter className="w-3 h-3" /> {product.category?.name || 'Sin catálogo'}</span>
                                            <span>|</span>
                                            <span>{product.price || 'P.V.R'}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(product)}><Pencil className="w-4 h-4 text-gray-400" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(product)}><Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" /></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0">
                    <DialogHeader className="p-6 border-b">
                        <DialogTitle className="text-2xl font-bold">{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold">Imagen Principal</label>
                                    <div onClick={() => mainFileInputRef.current?.click()} className="aspect-square bg-gray-50 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-all overflow-hidden relative group">
                                        {mainPreviewUrl ? <img src={mainPreviewUrl} className="w-full h-full object-cover" /> : <div className="text-center"><ImageIcon className="mx-auto mb-2 text-gray-300" /><p className="text-xs text-gray-400">Click para subir</p></div>}
                                    </div>
                                    <input type="file" ref={mainFileInputRef} hidden accept="image/*" onChange={handleMainFileSelect} />
                                </div>

                                <div className="space-y-4">
                                    <label className="text-sm font-semibold">Galería de Imágenes</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[...(currentProduct.images || []), ...galleryPreviews].map((url, i) => (
                                            <div key={i} className="aspect-square rounded-lg border relative group overflow-hidden">
                                                <img src={url} className="w-full h-full object-cover" />
                                                <button onClick={() => removeGalleryImage(i, i < (currentProduct.images?.length || 0))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                                            </div>
                                        ))}
                                        <button onClick={() => galleryFileInputRef.current?.click()} className="aspect-square border-2 border-dashed rounded-lg flex items-center justify-center text-gray-300 hover:text-accent hover:border-accent transition-all"><Plus className="w-6 h-6" /></button>
                                    </div>
                                    <input type="file" ref={galleryFileInputRef} hidden multiple accept="image/*" onChange={handleGallerySelect} />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold">Nombre del Producto</label>
                                        <Input value={currentProduct.name || ''} onChange={e => handleNameChange(e.target.value)} placeholder="Ej. Cámara Domo 4K" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold">Slug (URL)</label>
                                        <Input value={currentProduct.slug || ''} onChange={e => setCurrentProduct({ ...currentProduct, slug: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold">Categoría</label>
                                            <select className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={currentProduct.category_id || ''} onChange={e => setCurrentProduct({ ...currentProduct, category_id: e.target.value })}>
                                                <option value="">Seleccionar...</option>
                                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold">Marca</label>
                                            <select className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={currentProduct.brand_id || ''} onChange={e => setCurrentProduct({ ...currentProduct, brand_id: e.target.value })}>
                                                <option value="">Seleccionar...</option>
                                                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold">Descripción</label>
                                        <Textarea value={currentProduct.description || ''} onChange={e => setCurrentProduct({ ...currentProduct, description: e.target.value })} className="min-h-[100px]" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold">Precio / Etiqueta</label>
                                            <Input value={currentProduct.price || ''} onChange={e => setCurrentProduct({ ...currentProduct, price: e.target.value })} placeholder="Ej. $1,200.00" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold">Orden</label>
                                            <Input type="number" value={currentProduct.order || 0} onChange={e => setCurrentProduct({ ...currentProduct, order: parseInt(e.target.value) })} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-6 rounded-2xl space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-bold flex items-center gap-2"><Filter className="w-4 h-4 text-accent" /> Especificaciones Técnicas</h4>
                                <Button type="button" variant="outline" size="sm" onClick={addSpecification} className="gap-2"><PlusCircle className="w-4 h-4" /> Añadir</Button>
                            </div>
                            <div className="space-y-3">
                                {currentProduct.specifications?.map((spec, i) => (
                                    <div key={i} className="flex gap-2">
                                        <Input placeholder="Etiqueta (Ej. Sensor)" value={spec.label} onChange={e => updateSpecification(i, 'label', e.target.value)} className="bg-white" />
                                        <Input placeholder="Valor (Ej. CMOS 1/2.8)" value={spec.value} onChange={e => updateSpecification(i, 'value', e.target.value)} className="bg-white" />
                                        <Button variant="ghost" size="icon" onClick={() => removeSpecification(i)} className="text-gray-400 hover:text-red-500"><Trash className="w-4 h-4" /></Button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 border rounded-xl flex items-center justify-between bg-white">
                                <div>
                                    <p className="text-sm font-bold">Ficha Técnica (PDF)</p>
                                    <p className="text-xs text-gray-400">{datasheetFile ? datasheetFile.name : (currentProduct.datasheet_url ? 'PDF subido' : 'No hay archivo')}</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => datasheetInputRef.current?.click()}>Subir PDF</Button>
                                <input type="file" ref={datasheetInputRef} hidden accept=".pdf" onChange={e => setDatasheetFile(e.target.files?.[0] || null)} />
                            </div>
                            <div className="p-4 border rounded-xl flex items-center justify-between bg-white">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${currentProduct.is_new ? 'bg-orange-500' : 'bg-gray-200'}`}></div>
                                    <p className="text-sm font-bold">Marcar como "Nuevo"</p>
                                </div>
                                <Switch checked={currentProduct.is_new} onCheckedChange={val => setCurrentProduct({ ...currentProduct, is_new: val })} />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 border-t bg-gray-50/50">
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={saving}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-accent text-white min-w-[150px]">
                            {saving ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            {isEditing ? 'Guardar Cambios' : 'Crear Producto'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminProducts;
