import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Loader2, Image as ImageIcon, Save, X, Upload, Package, Search, Filter, PlusCircle, Trash, Settings, Layout } from 'lucide-react';
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
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import PageLoading from '@/components/PageLoading';

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
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<{ id: string; name: string; parent_id?: string | null }[]>([]);
    const [productCategoriesMap, setProductCategoriesMap] = useState<Record<string, string[]>>({});
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
    const [openCategoriesParams, setOpenCategoriesParams] = useState(false); // State para el popover
    const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [productsBgUrl, setProductsBgUrl] = useState<string | null>(null);
    const [productsTitle, setProductsTitle] = useState('');
    const [productsSubtitle, setProductsSubtitle] = useState('');
    const [originalSettings, setOriginalSettings] = useState<{ bgUrl: string | null }>({ bgUrl: null });
    const [settingsId, setSettingsId] = useState<string | null>(null);
    const [uploadingBg, setUploadingBg] = useState(false);

    // Page Settings Dialog
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [savingSettings, setSavingSettings] = useState(false);
    const settingsFileInputRef = useRef<HTMLInputElement>(null);

    // Product Dialog State
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
        const { data } = await supabase.from('site_settings').select('id, products_bg_url, products_title, products_subtitle').single();
        if (data) {
            setSettingsId(data.id);
            setProductsBgUrl(data.products_bg_url);
            setProductsTitle(data.products_title || '');
            setProductsSubtitle(data.products_subtitle || '');
            setOriginalSettings({ bgUrl: data.products_bg_url });
        }
    };

    const handleSettingsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

            // Just update state. We don't delete the old image yet.
            // If we replaced a "newly uploaded but unsaved" image, we could delete it here
            // but let's keep it simple. Garbage collection of orphans is better handled separately 
            // or we could track "tempUploadedImages" to clean up on cancel. 
            // For now, we trust HandleSave to clean up the *original* image if needed.
            setProductsBgUrl(finalUrl);
        } catch (error: any) {
            console.error(error);
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setUploadingBg(false);
        }
    };

    const handleSaveSettings = async () => {
        setSavingSettings(true);
        try {
            // 1. Update DB
            const { error } = await supabase
                .from('site_settings')
                .update({
                    products_bg_url: productsBgUrl,
                    products_title: productsTitle,
                    products_subtitle: productsSubtitle
                })
                .eq('id', settingsId);

            if (error) throw error;

            // 2. Clean up old image if it was changed/removed
            // Only delete if the original URL is NOT null, AND it's different from the new URL.
            if (originalSettings.bgUrl && originalSettings.bgUrl !== productsBgUrl) {
                await deleteFromStorage(originalSettings.bgUrl);
            }

            // 3. Update original settings to match new state
            setOriginalSettings({ bgUrl: productsBgUrl });

            toast({ title: "Configuración guardada", description: "Los cambios de la página han sido actualizados." });
            setIsSettingsOpen(false);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setSavingSettings(false);
        }
    };

    const extractFilePath = (url: string) => {
        if (!url) return null;
        const urlWithoutQuery = url.split('?')[0];
        const parts = urlWithoutQuery.split('site-assets/');
        return parts.length > 1 ? parts[1] : null;
    };

    const deleteFromStorage = async (url: string) => {
        const filePath = extractFilePath(url);
        if (filePath) {
            await supabase.storage.from('site-assets').remove([filePath]);
        }
    };

    const handleRemoveBg = async () => {
        // Just clear from state. Actual deletion happens on Save.
        setProductsBgUrl(null);
    };

    const handleRemoveMainImage = async () => {
        if (!currentProduct.main_image_url) return;

        try {
            if (isEditing) {
                await deleteFromStorage(currentProduct.main_image_url);
                await supabase.from('products').update({ main_image_url: null }).eq('id', currentProduct.id);
            }
            setCurrentProduct(prev => ({ ...prev, main_image_url: null }));
            setMainPreviewUrl(null);
            setSelectedMainFile(null);
        } catch (error: any) {
            toast({ title: "Error", description: "No se pudo eliminar la imagen", variant: "destructive" });
        }
    };

    const handleRemoveDatasheet = async () => {
        if (!currentProduct.datasheet_url && !datasheetFile) return;

        try {
            if (isEditing && currentProduct.datasheet_url) {
                await deleteFromStorage(currentProduct.datasheet_url);
                await supabase.from('products').update({ datasheet_url: null }).eq('id', currentProduct.id);
            }
            setCurrentProduct(prev => ({ ...prev, datasheet_url: null }));
            setDatasheetFile(null);
            toast({ title: "Ficha técnica eliminada" });
        } catch (error: any) {
            toast({ title: "Error", description: "No se pudo eliminar el archivo", variant: "destructive" });
        }
    };

    const fetchInitialData = async () => {
        try {
            const [prodRes, catRes, brandRes, settingsRes, prodCatsRes] = await Promise.all([
                supabase.from('products').select('*, brand:brands(name)').order('created_at', { ascending: false }),
                supabase.from('categories').select('id, name, parent_id').order('name'),
                supabase.from('brands').select('id, name').order('name'),
                supabase.from('site_settings').select('logo_url_dark').single(),
                supabase.from('product_categories').select('*')
            ]);

            if (prodRes.error) throw prodRes.error;
            if (catRes.error) throw catRes.error;
            if (brandRes.error) throw brandRes.error;
            if (prodCatsRes.error) throw prodCatsRes.error;

            // Map product categories
            const pcMap: Record<string, string[]> = {};
            prodCatsRes.data.forEach((pc: any) => {
                if (!pcMap[pc.product_id]) pcMap[pc.product_id] = [];
                pcMap[pc.product_id].push(pc.category_id);
            });
            setProductCategoriesMap(pcMap);

            // Mapear category principal visualmente (solo para display en tabla, tomamos la primera o category_id legacy)
            const productsWithCat = (prodRes.data || []).map((p: any) => ({
                ...p,
                category: {
                    name: pcMap[p.id]?.length > 0
                        ? catRes.data.find((c: any) => c.id === pcMap[p.id][0])?.name + (pcMap[p.id].length > 1 ? ` (+${pcMap[p.id].length - 1})` : '')
                        : (p.category_id ? catRes.data.find((c: any) => c.id === p.category_id)?.name : null)
                }
            }));

            setProducts(productsWithCat);
            setCategories(catRes.data || []);
            setBrands(brandRes.data || []);
            if (settingsRes.data?.logo_url_dark) {
                setLogoUrl(settingsRes.data.logo_url_dark);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast({ title: "Error", description: "No se pudieron cargar los datos", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    // Helper para obtener el nombre completo jerárquico
    const getFullCategoryName = (cat: { id: string, name: string, parent_id?: string | null }, allCats: { id: string, name: string, parent_id?: string | null }[]) => {
        if (!cat.parent_id) return cat.name;
        const parent = allCats.find(c => c.id === cat.parent_id);
        return parent ? `${getFullCategoryName(parent, allCats)} > ${cat.name}` : cat.name;
    };

    const sortedCategories = useMemo(() => {
        return [...categories].sort((a, b) => {
            const nameA = getFullCategoryName(a, categories);
            const nameB = getFullCategoryName(b, categories);
            return nameA.localeCompare(nameB);
        });
    }, [categories]);

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

    const removeGalleryImage = async (index: number, isExisting: boolean) => {
        if (isExisting) {
            const imageUrl = currentProduct.images?.[index];
            if (imageUrl) {
                try {
                    await deleteFromStorage(imageUrl);
                    const newImages = [...(currentProduct.images || [])];
                    newImages.splice(index, 1);

                    if (isEditing) {
                        await supabase.from('products').update({ images: newImages }).eq('id', currentProduct.id);
                    }

                    setCurrentProduct({ ...currentProduct, images: newImages });
                } catch (error) {
                    toast({ title: "Error", description: "No se pudo eliminar la imagen de la galería", variant: "destructive" });
                }
            }
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

            // LIMPIAR CATEGORIAS ANTERIORES (Para update)
            if (currentProduct.id) {
                await supabase.from('product_categories').delete().eq('product_id', currentProduct.id);
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
            // Nota: Mantenemos category_id como null o la primera seleccionada para compatibilidad legacy si se desea, 
            // pero idealmente deberiamos ignorarlo. Lo pondré como la primera para no romper código viejo que dependa de ello.
            const primaryCategoryId = selectedCategoryIds.length > 0 ? selectedCategoryIds[0] : null;

            const { error } = await supabase
                .from('products')
                .upsert({
                    id: productId,
                    name: currentProduct.name,
                    slug: currentProduct.slug,
                    description: currentProduct.description,
                    category_id: primaryCategoryId, // Legacy support
                    brand_id: currentProduct.brand_id,
                    main_image_url: finalMainImageUrl,
                    images: finalGalleryImages,
                    specifications: currentProduct.specifications,
                    datasheet_url: finalDatasheetUrl,
                    is_new: currentProduct.is_new,
                    is_active: currentProduct.is_active,
                    order: currentProduct.order,
                    updated_at: new Date().toISOString()
                } as any);

            if (error) throw error;

            // 5. Insert Product Categories (AFTER Product Upsert to satisfy FK)
            if (selectedCategoryIds.length > 0) {
                const relations = selectedCategoryIds.map(catId => ({
                    product_id: productId,
                    category_id: catId
                }));
                // Usar upsert o ignore por si acaso se ejecuta dos veces, aunque borramos antes.
                // Pero como borramos por ID, y esto es insert nuevo...
                // Si es producto nuevo, no borramos nada.
                const { error: relError } = await supabase.from('product_categories').upsert(relations, { onConflict: 'product_id, category_id' });
                if (relError) throw relError;
            }

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
        if (!confirm(`¿Eliminar "${product.name}"? Esta acción borrará permanentemente todos sus archivos.`)) return;
        try {
            // 1. Delete Main Image from Storage
            if (product.main_image_url) {
                await deleteFromStorage(product.main_image_url);
            }

            // 2. Delete Gallery from Storage
            if (product.images && product.images.length > 0) {
                for (const img of product.images) {
                    await deleteFromStorage(img);
                }
            }

            // 3. Delete Datasheet from Storage
            if (product.datasheet_url) {
                await deleteFromStorage(product.datasheet_url);
            }

            // 4. Delete Database Record
            const { error } = await supabase.from('products').delete().eq('id', product.id);
            if (error) throw error;

            setProducts(products.filter(p => p.id !== product.id));
            toast({ title: "Producto y archivos eliminados correctamente" });
        } catch (error: any) {
            toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
        }
    };

    const resetForm = () => {
        setCurrentProduct({ images: [], specifications: [], is_new: false, is_active: true, order: 0 });
        setSelectedMainFile(null);
        setMainPreviewUrl(null);
        setSelectedGalleryFiles([]);
        setGalleryPreviews([]);
        setSelectedCategoryIds([]);
        setDatasheetFile(null);
        setDatasheetFile(null);
        setIsEditing(false);
    };

    const openEdit = (product: Product) => {
        setCurrentProduct(product);
        setMainPreviewUrl(product.main_image_url);

        // Cargar categorías seleccionadas desde el mapa o legacy
        const associatedIds = productCategoriesMap[product.id] || [];
        if (associatedIds.length === 0 && product.category_id) {
            associatedIds.push(product.category_id);
        }
        setSelectedCategoryIds(associatedIds);

        setIsEditing(true);
        setIsDialogOpen(true);
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <PageLoading logoUrl={logoUrl} />;

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
                                    {/* Products Page Header Manager */}
                                    <Button
                                        variant="outline"
                                        className="h-10 px-4 border-gray-200 text-gray-700 hover:bg-gray-50 transition-all gap-2 font-bold text-sm shadow-sm"
                                        onClick={() => setIsSettingsOpen(true)}
                                    >
                                        <Layout className="w-4 h-4 text-accent" />
                                        Configurar Página
                                    </Button>

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
                                    <div className="aspect-square bg-gray-50 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-all overflow-hidden relative group">
                                        {mainPreviewUrl ? (
                                            <>
                                                <img src={mainPreviewUrl} className="w-full h-full object-cover" />
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleRemoveMainImage(); }}
                                                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        ) : (
                                            <div onClick={() => mainFileInputRef.current?.click()} className="text-center">
                                                <ImageIcon className="mx-auto mb-2 text-gray-300" />
                                                <p className="text-xs text-gray-400">Click para subir</p>
                                            </div>
                                        )}
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
                                            <label className="text-sm font-semibold">Categorías</label>
                                            <Popover open={openCategoriesParams} onOpenChange={setOpenCategoriesParams}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        aria-expanded={openCategoriesParams}
                                                        className="w-full justify-between h-11 font-normal text-left px-3 border-input bg-transparent"
                                                    >
                                                        {selectedCategoryIds.length > 0
                                                            ? `${selectedCategoryIds.length} seleccionada${selectedCategoryIds.length > 1 ? 's' : ''}`
                                                            : "Seleccionar..."}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                                    <Command>
                                                        <CommandInput placeholder="Buscar categoría..." />
                                                        <CommandList>
                                                            <CommandEmpty>No encontrada.</CommandEmpty>
                                                            <CommandGroup className="max-h-64 overflow-y-auto">
                                                                {sortedCategories.map((category) => (
                                                                    <CommandItem
                                                                        key={category.id}
                                                                        value={getFullCategoryName(category, categories)}
                                                                        onSelect={() => {
                                                                            setSelectedCategoryIds(prev =>
                                                                                prev.includes(category.id)
                                                                                    ? prev.filter(id => id !== category.id)
                                                                                    : [...prev, category.id]
                                                                            );
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                selectedCategoryIds.includes(category.id) ? "opacity-100" : "opacity-0"
                                                                            )}
                                                                        />
                                                                        {getFullCategoryName(category, categories)}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
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
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold">Orden de Visualización</label>
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
                                <div className="flex gap-2">
                                    {(datasheetFile || currentProduct.datasheet_url) && (
                                        <Button variant="ghost" size="sm" onClick={handleRemoveDatasheet} className="text-red-500 hover:bg-red-50">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                    <Button variant="outline" size="sm" onClick={() => datasheetInputRef.current?.click()}>
                                        {currentProduct.datasheet_url || datasheetFile ? 'Reemplazar' : 'Subir'}
                                    </Button>
                                </div>
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
            {/* Page Settings Dialog */}
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <Layout className="w-6 h-6 text-accent" /> Configuración de Página
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* 1. Header Image */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold flex items-center gap-2"><ImageIcon className="w-4 h-4 text-accent" /> Imagen de Fondo (Header)</label>
                            <div className="aspect-[21/9] bg-gray-50 border-2 border-dashed rounded-xl flex flex-col items-center justify-center relative group overflow-hidden">
                                {productsBgUrl ? (
                                    <>
                                        <img src={productsBgUrl} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="secondary" onClick={() => settingsFileInputRef.current?.click()}>Cambiar</Button>
                                                <Button size="sm" variant="destructive" onClick={handleRemoveBg}>Quitar</Button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center cursor-pointer p-6" onClick={() => settingsFileInputRef.current?.click()}>
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
                                            {uploadingBg ? <Loader2 className="animate-spin text-accent" /> : <Upload className="text-accent" />}
                                        </div>
                                        <p className="text-sm font-medium text-gray-600">Click para subir imagen</p>
                                    </div>
                                )}
                            </div>
                            <input type="file" ref={settingsFileInputRef} hidden accept="image/*" onChange={handleSettingsUpload} />
                        </div>

                        {/* 2. Text Fields */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold">Título Principal</label>
                                <Input
                                    value={productsTitle}
                                    onChange={e => setProductsTitle(e.target.value)}
                                    placeholder="Ej. Nuestros Productos"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold">Subtítulo / Misión</label>
                                <Textarea
                                    value={productsSubtitle}
                                    onChange={e => setProductsSubtitle(e.target.value)}
                                    placeholder="Ej. Descubre nuestra amplia gama de soluciones..."
                                    className="resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsSettingsOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveSettings} disabled={savingSettings} className="bg-accent text-white">
                            {savingSettings ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Guardar Configuración
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminProducts;
