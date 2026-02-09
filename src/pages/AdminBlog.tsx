import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Pencil, Trash2, Loader2, Image as ImageIcon,
    Save, X, Upload, FileText, Calendar, User,
    Tag, Eye, CheckCircle2, AlertCircle, Settings as SettingsIcon,
    Layers, Search as SearchIcon, Globe, MessageSquare
} from 'lucide-react';
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
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import PageLoading from '@/components/PageLoading';
import Editor from '@/components/admin/Editor';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    image_url: string | null;
    category_id: string | null;
    category: string;
    author: string;
    is_published: boolean;
    published_at: string | null;
    created_at: string;
    // SEO Fields
    meta_title: string | null;
    meta_description: string | null;
    meta_keywords: string | null;
}

interface BlogCategory {
    id: string;
    name: string;
    slug: string;
}

interface BlogSettings {
    id: string;
    hero_title: string;
    hero_subtitle: string;
    hero_image_url: string | null;
    share_facebook: boolean;
    share_twitter: boolean;
    share_linkedin: boolean;
    share_whatsapp: boolean;
    logo_facebook: string | null;
    logo_twitter: string | null;
    logo_linkedin: string | null;
    logo_whatsapp: string | null;
}

const AdminBlog = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [categories, setCategories] = useState<BlogCategory[]>([]);
    const [settings, setSettings] = useState<BlogSettings | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [logoUrl, setLogoUrl] = useState<string>('');

    // Dialog State - Posts
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [currentPost, setCurrentPost] = useState<Partial<BlogPost>>({});
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);

    // Dialog State - Categories
    const [isCatDialogOpen, setIsCatDialogOpen] = useState(false);
    const [catSaving, setCatSaving] = useState(false);
    const [currentCat, setCurrentCat] = useState<Partial<BlogCategory>>({});

    // Dialog State - Settings
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [tempSettings, setTempSettings] = useState<Partial<BlogSettings>>({});
    const [settingsFile, setSettingsFile] = useState<File | null>(null);
    const [settingsPreview, setSettingsPreview] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const settingsFileRef = useRef<HTMLInputElement>(null);
    const facebookLogoRef = useRef<HTMLInputElement>(null);
    const twitterLogoRef = useRef<HTMLInputElement>(null);
    const linkedinLogoRef = useRef<HTMLInputElement>(null);
    const whatsappLogoRef = useRef<HTMLInputElement>(null);

    // Temp logo files for settings
    const [logoFiles, setLogoFiles] = useState<{ [key: string]: File | null }>({
        facebook: null,
        twitter: null,
        linkedin: null,
        whatsapp: null
    });
    const [logoPreviews, setLogoPreviews] = useState<{ [key: string]: string | null }>({
        facebook: null,
        twitter: null,
        linkedin: null,
        whatsapp: null
    });

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) {
                setUser(data.session.user);
            }
        });
        fetchInitialData();
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

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchPosts(),
                fetchCategories(),
                fetchSettings()
            ]);
        } catch (error) {
            console.error('Error fetching initial data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPosts = async () => {
        const { data, error } = await supabase
            .from('blog_posts')
            .select('*, blog_categories(name)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        const mappedData = data?.map(p => ({
            ...p,
            category: p.blog_categories?.name || p.category || 'Sin categoría'
        })) || [];
        setPosts(mappedData);
    };

    const fetchCategories = async () => {
        const { data, error } = await supabase
            .from('blog_categories')
            .select('*')
            .order('name');
        if (error) throw error;
        setCategories(data || []);
    };

    const fetchSettings = async () => {
        const { data, error } = await supabase
            .from('blog_settings')
            .select('*')
            .single();
        if (error && error.code !== 'PGRST116') throw error;
        if (data) setSettings(data);
    };

    const generateSlug = (text: string) => {
        return text
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^\w ]+/g, '')
            .replace(/ +/g, '-');
    };

    const handleTitleChange = (title: string) => {
        const slug = generateSlug(title);
        setCurrentPost(prev => ({
            ...prev,
            title,
            slug,
            meta_title: prev.meta_title ? prev.meta_title : title
        }));
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast({ title: "Archivo muy grande", variant: "destructive" });
                return;
            }
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSettingsFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSettingsFile(file);
            setSettingsPreview(URL.createObjectURL(file));
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
            const { error } = await supabase.storage
                .from('site-assets')
                .remove([filePath]);
            if (error) console.error('Error deleting file from storage:', error);
        }
    };

    const removeImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedFile(null);
        setPreviewUrl(null);
        setCurrentPost(prev => ({ ...prev, image_url: null }));
    };

    const handleSave = async () => {
        if (!currentPost.title || !currentPost.slug || !currentPost.content) {
            toast({ title: "Faltan datos", variant: "destructive" });
            return;
        }

        setSaving(true);
        try {
            const postId = currentPost.id || crypto.randomUUID();
            let finalImageUrl = currentPost.image_url;

            if (selectedFile) {
                const fileName = `blog/${postId}-${Date.now()}`;
                const { error: uploadError } = await supabase.storage
                    .from('site-assets')
                    .upload(fileName, selectedFile, { upsert: true, contentType: selectedFile.type });

                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage.from('site-assets').getPublicUrl(fileName);
                finalImageUrl = `${publicUrl}?t=${Date.now()}`;
                if (originalImageUrl && originalImageUrl !== finalImageUrl) await deleteFromStorage(originalImageUrl);
            } else if (finalImageUrl === null && originalImageUrl) {
                await deleteFromStorage(originalImageUrl);
            }

            const now = new Date().toISOString();
            const { error } = await supabase
                .from('blog_posts')
                .upsert({
                    id: postId,
                    title: currentPost.title,
                    slug: currentPost.slug,
                    excerpt: currentPost.excerpt || '',
                    content: currentPost.content,
                    image_url: finalImageUrl,
                    category_id: currentPost.category_id || null,
                    author: currentPost.author || user?.email?.split('@')[0] || 'Admin',
                    is_published: currentPost.is_published ?? false,
                    published_at: currentPost.is_published ? (currentPost.published_at || now) : null,
                    updated_at: now,
                    // SEO
                    meta_title: currentPost.meta_title || currentPost.title,
                    meta_description: currentPost.meta_description || currentPost.excerpt,
                    meta_keywords: currentPost.meta_keywords || ''
                } as any);

            if (error) throw error;
            toast({ title: "Post guardado correctamente" });
            fetchPosts();
            setIsDialogOpen(false);
            resetForm();
        } catch (error: any) {
            toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleSaveCategory = async () => {
        if (!currentCat.name) return;
        setCatSaving(true);
        try {
            const slug = generateSlug(currentCat.name);
            const { error } = await supabase
                .from('blog_categories')
                .upsert({
                    id: currentCat.id || crypto.randomUUID(),
                    name: currentCat.name,
                    slug
                });
            if (error) throw error;
            toast({ title: "Categoría guardada" });
            fetchCategories();
            setCurrentCat({});
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setCatSaving(false);
        }
    };

    const deleteCategory = async (id: string) => {
        if (!confirm('¿Eliminar esta categoría? Los posts asociados quedarán sin categoría.')) return;
        try {
            const { error } = await supabase.from('blog_categories').delete().eq('id', id);
            if (error) throw error;
            fetchCategories();
            toast({ title: "Categoría eliminada" });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleSaveSettings = async () => {
        setSettingsSaving(true);
        try {
            let finalHeroUrl = tempSettings.hero_image_url;

            // Clean up and upload Hero Image
            if (settingsFile) {
                const fileName = `blog/settings-hero-${Date.now()}`;
                const { error: uploadError } = await supabase.storage
                    .from('site-assets')
                    .upload(fileName, settingsFile, { upsert: true, contentType: settingsFile.type });

                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage.from('site-assets').getPublicUrl(fileName);
                finalHeroUrl = publicUrl;

                // Cleanup old hero image
                if (settings?.hero_image_url) await deleteFromStorage(settings.hero_image_url);
            }

            // Handle Social Logos with cleanup
            const socialLogos = { ...tempSettings };
            const networks = ['facebook', 'twitter', 'linkedin', 'whatsapp'];

            for (const network of networks) {
                const file = logoFiles[network];
                if (file) {
                    const fileName = `blog/share-${network}-${Date.now()}`;
                    const { error: uploadError } = await supabase.storage
                        .from('site-assets')
                        .upload(fileName, file, { upsert: true, contentType: file.type });

                    if (uploadError) throw uploadError;
                    const { data: { publicUrl } } = supabase.storage.from('site-assets').getPublicUrl(fileName);

                    // Cleanup old logo
                    const oldUrl = (settings as any)?.[`logo_${network}`];
                    if (oldUrl) await deleteFromStorage(oldUrl);

                    (socialLogos as any)[`logo_${network}`] = publicUrl;
                }
            }

            const { error } = await supabase
                .from('blog_settings')
                .upsert({
                    id: settings?.id || crypto.randomUUID(),
                    hero_title: tempSettings.hero_title,
                    hero_subtitle: tempSettings.hero_subtitle,
                    hero_image_url: finalHeroUrl,
                    share_facebook: tempSettings.share_facebook ?? true,
                    share_twitter: tempSettings.share_twitter ?? true,
                    share_linkedin: tempSettings.share_linkedin ?? true,
                    share_whatsapp: tempSettings.share_whatsapp ?? true,
                    logo_facebook: socialLogos.logo_facebook,
                    logo_twitter: socialLogos.logo_twitter,
                    logo_linkedin: socialLogos.logo_linkedin,
                    logo_whatsapp: socialLogos.logo_whatsapp,
                    updated_at: new Date().toISOString()
                } as any);

            if (error) throw error;
            toast({ title: "Configuración actualizada" });
            fetchSettings();
            setIsSettingsOpen(false);
            setLogoFiles({ facebook: null, twitter: null, linkedin: null, whatsapp: null });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setSettingsSaving(false);
        }
    };

    const handleLogoSelect = (network: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFiles(prev => ({ ...prev, [network]: file }));
            setLogoPreviews(prev => ({ ...prev, [network]: URL.createObjectURL(file) }));
        }
    };

    const handleRemoveLogo = async (network: string) => {
        const oldUrl = (tempSettings as any)[`logo_${network}`];
        if (oldUrl) await deleteFromStorage(oldUrl);

        setTempSettings(prev => ({ ...prev, [`logo_${network}`]: null }));
        setLogoFiles(prev => ({ ...prev, [network]: null }));
        setLogoPreviews(prev => ({ ...prev, [network]: null }));
    };

    const handleRemoveHero = async () => {
        if (tempSettings.hero_image_url) await deleteFromStorage(tempSettings.hero_image_url);
        setTempSettings(prev => ({ ...prev, hero_image_url: null }));
        setSettingsFile(null);
        setSettingsPreview(null);
    };

    const handleDelete = async (post: BlogPost) => {
        if (!confirm(`¿Estás seguro de eliminar el post "${post.title}"?`)) return;
        try {
            if (post.image_url) await deleteFromStorage(post.image_url);
            const { error } = await supabase.from('blog_posts').delete().eq('id', post.id);
            if (error) throw error;
            setPosts(posts.filter(p => p.id !== post.id));
            toast({ title: "Post eliminado correctamente" });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const resetForm = () => {
        setCurrentPost({});
        setSelectedFile(null);
        setPreviewUrl(null);
        setOriginalImageUrl(null);
        setIsEditing(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/admin');
    };

    const filteredPosts = posts.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <PageLoading logoUrl={logoUrl} />;

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
                                <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                                    <FileText className="w-8 h-8 text-accent" /> Blog
                                </h2>
                                <p className="text-gray-500 mt-2">Gestiona las noticias, categorías y diseño del blog.</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => { setTempSettings(settings || {}); setSettingsPreview(settings?.hero_image_url || null); setIsSettingsOpen(true); }}
                                    className="gap-2 h-11 border-gray-200"
                                >
                                    <SettingsIcon className="w-4 h-4" /> Diseño
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsCatDialogOpen(true)}
                                    className="gap-2 h-11 border-gray-200"
                                >
                                    <Layers className="w-4 h-4" /> Categorías
                                </Button>
                                <Button
                                    onClick={() => { resetForm(); setIsDialogOpen(true); }}
                                    className="bg-accent hover:bg-accent/90 text-white gap-2 h-11 shadow-lg shadow-accent/20 transition-all hover:scale-105"
                                >
                                    <Plus className="w-4 h-4" /> Nueva Entrada
                                </Button>
                            </div>
                        </div>

                        <div className="relative mb-6">
                            <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <Input
                                placeholder="Buscar posts..."
                                className="pl-10 w-full bg-white border-none shadow-sm h-11"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-6">
                            {filteredPosts.map((post) => (
                                <div key={post.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-6 items-center group transition-all hover:shadow-md">
                                    <div className="h-24 w-40 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 relative border border-gray-100 flex items-center justify-center">
                                        {post.image_url ? (
                                            <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <ImageIcon className="w-8 h-8 text-gray-200" />
                                        )}
                                        <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${post.is_published ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                                            {post.is_published ? 'Publicado' : 'Borrador'}
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2 py-0.5 bg-accent/10 text-accent text-[10px] rounded-full font-bold uppercase">
                                                {post.category}
                                            </span>
                                            <span className="text-gray-400 text-xs">•</span>
                                            <span className="text-gray-400 text-xs flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {format(new Date(post.created_at), 'dd MMM, yyyy', { locale: es })}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-lg text-gray-800 truncate group-hover:text-accent transition-colors">{post.title}</h3>
                                        <p className="text-gray-500 text-sm line-clamp-1 mt-1">{post.excerpt || 'Sin extracto'}</p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => { setCurrentPost(post); setPreviewUrl(post.image_url); setOriginalImageUrl(post.image_url); setIsEditing(true); setIsDialogOpen(true); }} className="hover:bg-accent/10 hover:text-accent">
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(post)} className="hover:bg-red-50 hover:text-red-600">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
            </div>

            {/* DIALOG: EDIT POST */}
            <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open); }}>
                <DialogContent className="sm:max-w-5xl max-h-[95vh] flex flex-col overflow-hidden p-0 gap-0">
                    <DialogHeader className="p-6 border-b bg-gray-50/50">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            {isEditing ? <Pencil className="w-6 h-6 text-accent" /> : <Plus className="w-6 h-6 text-accent" />}
                            {isEditing ? 'Editar Artículo' : 'Nuevo Artículo'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden flex flex-col">
                        <Tabs defaultValue="content" className="flex-1 flex flex-col overflow-hidden">
                            <div className="px-6 bg-gray-50/50 border-b">
                                <TabsList className="bg-transparent h-12 w-full justify-start gap-8">
                                    <TabsTrigger value="content" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-accent data-[state=active]:text-accent rounded-none h-full font-bold">
                                        Contenido
                                    </TabsTrigger>
                                    <TabsTrigger value="seo" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-accent data-[state=active]:text-accent rounded-none h-full font-bold">
                                        SEO y Configuración
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="content" className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar mt-0">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700">Título del Post</label>
                                            <Input
                                                value={currentPost.title || ''}
                                                onChange={e => handleTitleChange(e.target.value)}
                                                placeholder="Ej. El futuro de la tecnología"
                                                className="h-12 shadow-sm text-lg font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700">Extracto (Resumen)</label>
                                            <Textarea
                                                value={currentPost.excerpt || ''}
                                                onChange={e => setCurrentPost({ ...currentPost, excerpt: e.target.value })}
                                                placeholder="Resumen corto..."
                                                className="min-h-[80px] shadow-sm resize-none"
                                            />
                                        </div>
                                        <div className="space-y-2 flex-1 flex flex-col min-h-[500px]">
                                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">Cuerpo del Artículo</label>
                                            <Editor
                                                content={currentPost.content || ''}
                                                onChange={(html) => setCurrentPost(prev => ({ ...prev, content: html }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="space-y-2 cursor-pointer">
                                            <label className="text-sm font-bold text-gray-700">Imagen de Portada</label>
                                            <div
                                                onClick={() => fileInputRef.current?.click()}
                                                className="w-full aspect-video bg-gray-100 rounded-3xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-accent overflow-hidden relative group transition-all"
                                            >
                                                {previewUrl ? (
                                                    <>
                                                        <img src={previewUrl} className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <div className="flex gap-2">
                                                                <button type="button" onClick={removeImage} className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg">
                                                                    <X className="w-5 h-5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-center">
                                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm text-accent">
                                                            <Upload className="w-6 h-6" />
                                                        </div>
                                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Subir Imagen</p>
                                                    </div>
                                                )}
                                            </div>
                                            <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleFileSelect} />
                                        </div>

                                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Categoría</label>
                                                <Select value={currentPost.category_id || "none"} onValueChange={(val) => setCurrentPost({ ...currentPost, category_id: val === "none" ? null : val })}>
                                                    <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">Sin categoría</SelectItem>
                                                        {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Autor</label>
                                                <Input value={currentPost.author || ''} onChange={e => setCurrentPost({ ...currentPost, author: e.target.value })} placeholder="Nombre" className="h-11 rounded-xl" />
                                            </div>
                                            <div className="flex items-center justify-between p-4 bg-accent/5 rounded-2xl border border-accent/10">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("w-2.5 h-2.5 rounded-full", currentPost.is_published ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-gray-300")} />
                                                    <label className="text-xs font-bold text-gray-700">Estado: {currentPost.is_published ? 'Publicado' : 'Borrador'}</label>
                                                </div>
                                                <Switch checked={currentPost.is_published || false} onCheckedChange={checked => setCurrentPost({ ...currentPost, is_published: checked })} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="seo" className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar mt-0">
                                <div className="max-w-3xl mx-auto space-y-8">
                                    <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 space-y-4">
                                        <div className="flex items-center gap-3 text-blue-600 mb-2">
                                            <Globe className="w-5 h-5" />
                                            <h3 className="font-bold">Vista previa en buscadores</h3>
                                        </div>
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 space-y-1">
                                            <span className="text-xs text-green-700">service-representaciones.com/blog/{currentPost.slug || 'slug-del-post'}</span>
                                            <h4 className="text-xl text-blue-800 font-medium hover:underline cursor-pointer">
                                                {currentPost.meta_title || currentPost.title || 'Título del post'}
                                            </h4>
                                            <p className="text-sm text-gray-600 line-clamp-2">
                                                {currentPost.meta_description || currentPost.excerpt || 'Escribe una descripción breve para los buscadores...'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                                Meta Título <span className="text-[10px] text-gray-400 font-normal">(Recomendado 50-60 caracteres)</span>
                                            </label>
                                            <Input
                                                value={currentPost.meta_title || ''}
                                                onChange={e => setCurrentPost({ ...currentPost, meta_title: e.target.value })}
                                                placeholder="Título optimizado para buscadores"
                                                className="h-11"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                                Meta Descripción <span className="text-[10px] text-gray-400 font-normal">(Recomendado 150-160 caracteres)</span>
                                            </label>
                                            <Textarea
                                                value={currentPost.meta_description || ''}
                                                onChange={e => setCurrentPost({ ...currentPost, meta_description: e.target.value })}
                                                placeholder="Descripción breve que aparecerá en los resultados de Google."
                                                className="min-h-[100px]"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                                Palabras Clave (Separadas por comas)
                                            </label>
                                            <Input
                                                value={currentPost.meta_keywords || ''}
                                                onChange={e => setCurrentPost({ ...currentPost, meta_keywords: e.target.value })}
                                                placeholder="tecnologia, innovacion, servicios, etc."
                                                className="h-11"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    <DialogFooter className="p-6 border-t bg-gray-50/50">
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={saving} className="font-bold text-gray-500">Cancelar</Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-accent text-white px-12 h-11 rounded-xl shadow-lg shadow-accent/20">
                            {saving ? <Loader2 className="animate-spin w-5 h-5" /> : 'Guardar Artículo'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DIALOG: CATEGORIES */}
            <Dialog open={isCatDialogOpen} onOpenChange={setIsCatDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Gestionar Categorías</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex gap-2">
                            <Input placeholder="Nueva categoría..." value={currentCat.name || ''} onChange={e => setCurrentCat({ name: e.target.value })} />
                            <Button onClick={handleSaveCategory} disabled={catSaving} className="bg-accent text-white"><Plus className="w-4 h-4" /></Button>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto space-y-2">
                            {categories.map(cat => (
                                <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 group">
                                    <span className="font-medium text-gray-700">{cat.name}</span>
                                    <Button variant="ghost" size="icon" onClick={() => deleteCategory(cat.id)} className="text-red-400 opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* DIALOG: BLOG SETTINGS */}
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2rem]">
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle className="text-2xl font-black text-gray-900">Diseño del Blog</DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto px-6 py-2 space-y-8 scrollbar-hide">
                        {/* Hero Section */}
                        <div className="space-y-4">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Imagen de Portada (Hero)</label>
                            <div className="relative group">
                                <div
                                    onClick={() => settingsFileRef.current?.click()}
                                    className="w-full aspect-[21/9] bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-accent hover:bg-gray-100 transition-all overflow-hidden shadow-inner overflow-hidden"
                                >
                                    {settingsPreview || tempSettings.hero_image_url ? (
                                        <img src={settingsPreview || tempSettings.hero_image_url!} className="w-full h-full object-cover" />
                                    ) : (
                                        <>
                                            <Upload className="w-8 h-8 text-gray-300 mb-2" />
                                            <span className="text-xs font-bold text-gray-400">Subir imagen principal</span>
                                        </>
                                    )}
                                </div>
                                {(settingsPreview || tempSettings.hero_image_url) && (
                                    <Button
                                        size="icon"
                                        variant="destructive"
                                        className="absolute top-4 right-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => { e.stopPropagation(); handleRemoveHero(); }}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                            <input type="file" hidden ref={settingsFileRef} accept="image/*" onChange={handleSettingsFile} />
                        </div>

                        {/* Text Settings */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Título Hero</label>
                                <Input
                                    value={tempSettings.hero_title || ''}
                                    onChange={e => setTempSettings({ ...tempSettings, hero_title: e.target.value })}
                                    className="h-12 rounded-2xl bg-gray-50 border-gray-100 focus:bg-white transition-all font-bold"
                                    placeholder="Ej: Nuestro Blog"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Subtítulo Hero</label>
                                <Textarea
                                    value={tempSettings.hero_subtitle || ''}
                                    onChange={e => setTempSettings({ ...tempSettings, hero_subtitle: e.target.value })}
                                    className="rounded-2xl bg-gray-50 border-gray-100 focus:bg-white transition-all min-h-[100px]"
                                    placeholder="Breve descripción para la cabecera del blog..."
                                />
                            </div>
                        </div>

                        {/* Sharing Options */}
                        <div className="space-y-6 pt-6 border-t border-gray-100 pb-8">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Opciones de Compartido</label>
                            <div className="grid grid-cols-1 gap-4">
                                {[
                                    { id: 'facebook', label: 'Facebook', icon: facebookLogoRef },
                                    { id: 'twitter', label: 'Twitter (X)', icon: twitterLogoRef },
                                    { id: 'linkedin', label: 'LinkedIn', icon: linkedinLogoRef },
                                    { id: 'whatsapp', label: 'WhatsApp', icon: whatsappLogoRef }
                                ].map((net) => (
                                    <div key={net.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-[1.5rem] border border-gray-100 group transition-all hover:bg-white hover:shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="relative group/logo">
                                                <div
                                                    onClick={() => net.icon.current?.click()}
                                                    className="w-14 h-14 rounded-2xl bg-white border border-gray-200 flex items-center justify-center cursor-pointer hover:border-accent overflow-hidden shadow-sm transition-all"
                                                >
                                                    {logoPreviews[net.id] || (tempSettings as any)[`logo_${net.id}`] ? (
                                                        <img src={logoPreviews[net.id] || (tempSettings as any)[`logo_${net.id}`]} className="w-full h-full object-contain p-1" />
                                                    ) : (
                                                        <ImageIcon className="w-6 h-6 text-gray-300" />
                                                    )}
                                                </div>
                                                {(logoPreviews[net.id] || (tempSettings as any)[`logo_${net.id}`]) && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleRemoveLogo(net.id); }}
                                                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity shadow-lg"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                            <input type="file" hidden ref={net.icon} accept="image/*" onChange={(e) => handleLogoSelect(net.id, e)} />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-700">{net.label}</span>
                                                <span className="text-[10px] text-gray-400 uppercase tracking-tighter font-black">Personalizar Logo</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] font-black uppercase text-gray-400">{(tempSettings as any)[`share_${net.id}`] ? 'Visible' : 'Oculto'}</span>
                                            <Switch
                                                checked={(tempSettings as any)[`share_${net.id}`] ?? true}
                                                onCheckedChange={(checked) => setTempSettings({ ...tempSettings, [`share_${net.id}`]: checked })}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3 rounded-b-[2rem]">
                        <Button variant="ghost" onClick={() => setIsSettingsOpen(false)} className="rounded-xl font-bold">Cancelar</Button>
                        <Button
                            onClick={handleSaveSettings}
                            disabled={settingsSaving}
                            className="bg-accent text-white rounded-xl px-10 h-12 font-bold shadow-lg shadow-accent/20 hover:shadow-accent/40 transition-all"
                        >
                            {settingsSaving ? <Loader2 className="animate-spin w-5 h-5" /> : 'Guardar Cambios'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminBlog;
