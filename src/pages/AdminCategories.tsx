import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Loader2, Image as ImageIcon, Save, X, Upload, Tags, Search, CornerDownRight, GripVertical, ChevronRight, ChevronDown } from 'lucide-react';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import PageLoading from '@/components/PageLoading';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

interface Category {
    id: string;
    parent_id: string | null;
    name: string;
    slug: string;
    description: string | null;
    image_url: string | null;
    icon: string | null;
    order: number;
    is_active: boolean;
    created_at: string;
}

interface SortableCategoryItemProps {
    category: Category;
    childrenCategories?: Category[];
    onEdit: (category: Category) => void;
    onDelete: (category: Category) => void;
    depth?: number;
}

// Componente para items individuales (Padres o Hijos)
function SortableCategoryItem({ category, childrenCategories = [], onEdit, onDelete, depth = 0 }: SortableCategoryItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: category.id });

    const [isOpen, setIsOpen] = useState(true);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        marginLeft: depth > 0 ? '2rem' : '0', // Indentación visual para hijos
    };

    return (
        <div ref={setNodeRef} style={style} className={cn(
            "rounded-xl transition-all mb-2",
            depth === 0 ? "bg-white shadow-sm border border-gray-100" : "bg-gray-50 border border-gray-100/50 mt-2"
        )}>
            <div className="p-3 flex gap-4 items-center">
                {/* Drag Handle */}
                <button
                    className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical className="w-5 h-5 text-gray-400" />
                </button>

                {/* Collapsible Trigger (Solo si es padre y tiene hijos) */}
                {depth === 0 && childrenCategories.length > 0 ? (
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="p-1 hover:bg-gray-100 rounded text-gray-400 transition-colors"
                    >
                        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                ) : (
                    <div className="w-6" /> // Spacer
                )}

                {/* Imagen */}
                <div className={cn(
                    "bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 relative border border-gray-100 flex items-center justify-center",
                    depth === 0 ? "h-16 w-16" : "h-12 w-12"
                )}>
                    {category.image_url ? (
                        <img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />
                    ) : (
                        <Tags className={cn("text-gray-200", depth === 0 ? "w-8 h-8" : "w-5 h-5")} />
                    )}
                    {!category.is_active && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="text-white text-[8px] font-bold px-1.5 py-0.5 bg-black/50 rounded-full uppercase">Off</span>
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={cn("font-bold text-gray-800 truncate", depth === 0 ? "text-base" : "text-sm")}>
                            {category.name}
                        </h3>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-400 text-[10px] rounded-full font-mono uppercase hidden sm:inline-block">
                            {category.slug}
                        </span>
                        {category.icon && (
                            <span className="text-xs text-gray-400 font-mono bg-blue-50 text-blue-600 px-1.5 rounded">
                                {category.icon}
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(category)}>
                        <Pencil className="w-3.5 h-3.5 text-gray-500 hover:text-accent" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(category)}>
                        <Trash2 className="w-3.5 h-3.5 text-gray-500 hover:text-red-500" />
                    </Button>
                </div>
            </div>

            {/* Renderizar Hijos si existen y está abierto */}
            {depth === 0 && childrenCategories.length > 0 && isOpen && (
                <div className="pl-4 pr-4 pb-4 border-t border-gray-50 bg-gray-50/30 rounded-b-xl">
                    <div className="pt-2 pl-8 border-l-2 border-dashed border-gray-200 ml-5 space-y-2">
                        <SortableContext
                            items={childrenCategories.map(c => c.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {childrenCategories.map(child => (
                                <SortableCategoryItem
                                    key={child.id}
                                    category={child}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    depth={depth + 1}
                                />
                            ))}
                        </SortableContext>
                    </div>
                </div>
            )}
        </div>
    );
}

const AdminCategories = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [currentCategory, setCurrentCategory] = useState<Partial<Category>>({});
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [logoUrl, setLogoUrl] = useState<string>('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Drag and drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) {
                setUser(data.session.user);
            }
        });
        fetchCategories();
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

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('order', { ascending: true }); // Ordenamiento global inicial

            if (error) throw error;
            setCategories(data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast({
                title: "Error",
                description: "No se pudieron cargar las categorías",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // Estructurar categorías en árbol
    const organizedCategories = useMemo(() => {
        // Obtenemos solo las raíces (sin padre) ordenadas por 'order'
        const roots = categories
            .filter(c => !c.parent_id)
            .sort((a, b) => a.order - b.order);

        // Mapeamos hijos a sus padres
        const childrenMap = new Map<string, Category[]>();
        categories
            .filter(c => c.parent_id)
            .forEach(c => {
                if (c.parent_id) {
                    const current = childrenMap.get(c.parent_id) || [];
                    current.push(c);
                    // Ordenamos hijos por su 'order'
                    current.sort((a, b) => a.order - b.order);
                    childrenMap.set(c.parent_id, current);
                }
            });

        return { roots, childrenMap };
    }, [categories]);

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        // Determinar qué lista estamos moviendo
        // 1. ¿Es una categoría raíz moviéndose entre raíces?
        const activeIsRoot = !categories.find(c => c.id === active.id)?.parent_id;
        const overIsRoot = !categories.find(c => c.id === over.id)?.parent_id;

        // 2. ¿Es una categoría hija moviéndose dentro del mismo padre?
        const activeItem = categories.find(c => c.id === active.id);
        const overItem = categories.find(c => c.id === over.id);

        let itemsToUpdate: Category[] = [];

        if (activeIsRoot && overIsRoot) {
            // Reordenando raices
            const currentRoots = organizedCategories.roots;
            const oldIndex = currentRoots.findIndex(c => c.id === active.id);
            const newIndex = currentRoots.findIndex(c => c.id === over.id);

            itemsToUpdate = arrayMove(currentRoots, oldIndex, newIndex);
        } else if (activeItem?.parent_id && overItem?.parent_id && activeItem.parent_id === overItem.parent_id) {
            // Reordenando hijos del mismo padre
            const parentId = activeItem.parent_id;
            const siblings = organizedCategories.childrenMap.get(parentId) || [];
            const oldIndex = siblings.findIndex(c => c.id === active.id);
            const newIndex = siblings.findIndex(c => c.id === over.id);

            itemsToUpdate = arrayMove(siblings, oldIndex, newIndex);
        } else {
            // Movimiento inválido (ej: padre a hijo, o hijo a otro padre)
            // Por ahora no lo soportamos vía Drag&Drop simple
            return;
        }

        // Actualizar estado local optimistamente
        // Estrategia: Actualizar 'order' en los items afectados y reconstruir el estado
        const updatedItems = itemsToUpdate.map((item, index) => ({
            ...item,
            order: index + 1 // Nuevo orden basado en la posición en el array movido
        }));

        setCategories(prev => {
            const next = [...prev];
            updatedItems.forEach(updatedItem => {
                const idx = next.findIndex(c => c.id === updatedItem.id);
                if (idx !== -1) next[idx] = updatedItem;
            });
            return next;
        });

        // Guardar en BD
        try {
            const updatePromises = updatedItems.map(cat =>
                supabase.from('categories').update({ order: cat.order }).eq('id', cat.id)
            );

            await Promise.all(updatePromises);

            toast({
                title: "✅ Orden actualizado",
                description: "Los cambios se han guardado."
            });
        } catch (error) {
            console.error('Error saving order:', error);
            toast({
                title: "❌ Error",
                description: "No se pudo guardar el orden.",
                variant: "destructive"
            });
            fetchCategories(); // Revertir
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
        setCurrentCategory(prev => ({ ...prev, name, slug }));
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit for categories
                toast({
                    title: "Archivo muy grande",
                    description: "La imagen debe ser menor a 2MB",
                    variant: "destructive"
                });
                return;
            }
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleDelete = async (category: Category) => {
        // Verificar si tiene hijos
        const hasChildren = categories.some(c => c.parent_id === category.id);
        if (hasChildren) {
            toast({
                title: "No se puede eliminar",
                description: "Esta categoría tiene subcategorías. Elimínalas o muévelas primero.",
                variant: "destructive"
            });
            return;
        }

        if (!confirm(`¿Estás seguro de eliminar la categoría "${category.name}"?`)) return;

        try {
            // 1. Delete image if exists
            if (category.image_url) {
                try {
                    // Extract clean path from URL
                    const url = new URL(category.image_url);
                    const pathParts = url.pathname.split('/site-assets/');

                    if (pathParts.length > 1) {
                        const filePath = decodeURIComponent(pathParts[1]);
                        const { error: storageError } = await supabase.storage
                            .from('site-assets')
                            .remove([filePath]);

                        if (storageError) console.error('Error removing image by URL:', storageError);
                    } else {
                        // Fallback
                        console.warn('Could not parse storage path from URL, trying ID-based path');
                        const fileName = `categories/${category.id}`;
                        const { error: storageError } = await supabase.storage
                            .from('site-assets')
                            .remove([fileName]);
                        if (storageError) console.error('Error removing image by ID:', storageError);
                    }
                } catch (e) {
                    console.error('Error parsing image URL for deletion:', e);
                    const fileName = `categories/${category.id}`;
                    await supabase.storage.from('site-assets').remove([fileName]);
                }
            }

            // 2. Delete row
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', category.id);

            if (error) throw error;

            setCategories(categories.filter(c => c.id !== category.id));
            toast({ title: "Categoría eliminada correctamente" });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    const removeImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedFile(null);
        setPreviewUrl(null);
        setCurrentCategory(prev => ({ ...prev, image_url: null }));
    };


    const handleSave = async () => {
        if (!currentCategory.name || !currentCategory.slug) {
            toast({ title: "Faltan datos", description: "El nombre y el slug son obligatorios", variant: "destructive" });
            return;
        }

        setSaving(true);
        try {
            const categoryId = currentCategory.id || crypto.randomUUID();
            let finalImageUrl = currentCategory.image_url;

            if (selectedFile) {
                const fileName = `categories/${categoryId}`;
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
            } else if (finalImageUrl === null && isEditing) {
                // Si la imagen fue removida manualmente
                const fileName = `categories/${categoryId}`;
                await supabase.storage
                    .from('site-assets')
                    .remove([fileName]);
            }

            // Orden por defecto para nuevas categorías (al final de su nivel)
            let newOrder = currentCategory.order;
            if (!isEditing && (newOrder === undefined || newOrder === 0)) {
                // Filtrar hermanos del mismo nivel
                const siblings = categories.filter(c => c.parent_id === (currentCategory.parent_id || null));
                if (siblings.length > 0) {
                    const maxOrder = Math.max(...siblings.map(c => c.order));
                    newOrder = maxOrder + 1;
                } else {
                    newOrder = 1;
                }
            }


            const { error } = await supabase
                .from('categories')
                .upsert({
                    id: categoryId,
                    parent_id: currentCategory.parent_id || null, // Guardar parent_id
                    name: currentCategory.name,
                    slug: currentCategory.slug,
                    description: currentCategory.description,
                    image_url: finalImageUrl,
                    icon: currentCategory.icon,
                    is_active: currentCategory.is_active ?? true,
                    order: newOrder,
                    updated_at: new Date().toISOString()
                } as any);

            if (error) throw error;

            toast({ title: "Categoría guardada correctamente" });
            fetchCategories();
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
        setCurrentCategory({});
        setSelectedFile(null);
        setPreviewUrl(null);
        setIsEditing(false);
    };

    const openEdit = (category: Category) => {
        setCurrentCategory(category);
        setPreviewUrl(category.image_url);
        setIsEditing(true);
        setIsDialogOpen(true);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/admin');
    };

    const filteredCategories = useMemo(() => {
        if (!searchTerm) return null;
        return categories.filter(cat =>
            cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cat.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [categories, searchTerm]);

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
                                <h2 className="text-3xl font-bold text-gray-800">Categorías</h2>
                                <p className="text-gray-500 mt-2">Gestiona las categorías de tus productos.</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="relative">
                                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <Input
                                        placeholder="Buscar categorías..."
                                        className="pl-10 w-full md:w-64 bg-white border-none shadow-sm h-11"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Button
                                    onClick={() => { resetForm(); setIsDialogOpen(true); }}
                                    className="bg-accent hover:bg-accent/90 text-white gap-2 h-11"
                                >
                                    <Plus className="w-4 h-4" />
                                    Nueva Categoría
                                </Button>
                            </div>
                        </div>

                        {/* Modificamos renderizado para soportar búsqueda o vista jerárquica */}
                        {searchTerm !== '' && filteredCategories ? (
                            // VISTA DE BÚSQUEDA (Plana)
                            <div className="grid gap-4">
                                {filteredCategories.map((category) => (
                                    <div key={category.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-6 items-center">
                                        {/* Simplificado para búsqueda - mostrar padre si tiene */}
                                        <div className="h-16 w-16 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 relative border border-gray-100 flex items-center justify-center">
                                            {category.image_url ? (
                                                <img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Tags className="w-6 h-6 text-gray-200" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-lg text-gray-800">{category.name}</h3>
                                            {category.parent_id && (
                                                <span className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                                                    <CornerDownRight className="w-3 h-3" />
                                                    {categories.find(c => c.id === category.parent_id)?.name || 'Padre desconocido'}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(category)}>
                                                <Pencil className="w-4 h-4 text-gray-500 hover:text-accent" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            // VISTA JERÁRQUICA CON DND
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={organizedCategories.roots.map(cat => cat.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="grid gap-4">
                                        {organizedCategories.roots.map((category) => (
                                            <SortableCategoryItem
                                                key={category.id}
                                                category={category}
                                                // Pasar hijos correspondientes
                                                childrenCategories={organizedCategories.childrenMap.get(category.id)}
                                                onEdit={openEdit}
                                                onDelete={handleDelete}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        )}

                        {categories.length === 0 && !loading && (
                            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                                <Tags className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                <h3 className="text-xl font-medium text-gray-900">No se encontraron categorías</h3>
                                <p className="text-gray-500 mt-2">Crea una nueva categoría para organizar tus productos.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">{isEditing ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-6 py-4 custom-scrollbar">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full aspect-[21/9] bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-accent hover:bg-gray-100/50 transition-all relative overflow-hidden group shadow-sm"
                        >
                            {previewUrl ? (
                                <>
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="flex gap-2">
                                            <span className="text-white font-medium flex items-center gap-2 bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm">
                                                <Upload className="w-4 h-4" /> Cambiar Imagen
                                            </span>
                                            <button
                                                type="button"
                                                onClick={removeImage}
                                                className="bg-red-500/80 hover:bg-red-600 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center p-6">
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                        <ImageIcon className="w-8 h-8 text-accent" />
                                    </div>
                                    <p className="text-base font-medium text-gray-700">Imagen de Categoría</p>
                                    <p className="text-sm text-gray-400 mt-1">Sugerido: 800x400px</p>
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Nombre</label>
                                    <Input
                                        value={currentCategory.name || ''}
                                        onChange={e => handleNameChange(e.target.value)}
                                        placeholder="Ej. Redes de Datos"
                                        className="h-11 shadow-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Slug (URL)</label>
                                    <Input
                                        value={currentCategory.slug || ''}
                                        onChange={e => setCurrentCategory({ ...currentCategory, slug: e.target.value })}
                                        placeholder="ej-redes-de-datos"
                                        className="h-11 shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Categoría Padre (Opcional)</label>
                                <Select
                                    value={currentCategory.parent_id || "none"}
                                    onValueChange={(value) => setCurrentCategory({ ...currentCategory, parent_id: value === "none" ? null : value })}
                                >
                                    <SelectTrigger className="h-11 shadow-sm">
                                        <SelectValue placeholder="Seleccionar categoría padre" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- Ninguna (Categoría Principal) --</SelectItem>
                                        {categories
                                            .filter(c => c.id !== currentCategory.id && !c.parent_id) // No mostrarse a sí misma ni permitir anidación profunda (max 1 nivel)
                                            .map((category) => (
                                                <SelectItem key={category.id} value={category.id}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-gray-500">Solo se permite un nivel de anidación (Padre -&gt; Hijo).</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Descripción</label>
                                <Textarea
                                    value={currentCategory.description || ''}
                                    onChange={e => setCurrentCategory({ ...currentCategory, description: e.target.value })}
                                    placeholder="Describe brevemente esta categoría..."
                                    className="min-h-[100px] shadow-sm resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Icono (Lucide name)</label>
                                <Input
                                    value={currentCategory.icon || ''}
                                    onChange={e => setCurrentCategory({ ...currentCategory, icon: e.target.value })}
                                    placeholder="Ej. server, wifi, network..."
                                    className="h-11 shadow-sm"
                                />
                            </div>

                            <div className="space-y-2 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                                <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                    <span className="text-blue-600">📊</span> Orden de Visualización
                                </label>
                                <p className="text-xs text-gray-600 mb-2">Define la posición en que aparecerá esta categoría (menor número = aparece primero)</p>
                                <Input
                                    type="number"
                                    min="0"
                                    value={currentCategory.order || 0}
                                    onChange={e => setCurrentCategory({ ...currentCategory, order: parseInt(e.target.value) || 0 })}
                                    className="h-11 shadow-sm bg-white"
                                    placeholder="Ej: 1, 2, 3..."
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-accent/5 rounded-xl border border-accent/10">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${currentCategory.is_active ?? true ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">Estado Activo</p>
                                        <p className="text-xs text-gray-500">Determina si la categoría es visible</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={currentCategory.is_active ?? true}
                                    onCheckedChange={checked => setCurrentCategory({ ...currentCategory, is_active: checked })}
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
                            {isEditing ? 'Actualizar' : 'Crear'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
};

export default AdminCategories;
