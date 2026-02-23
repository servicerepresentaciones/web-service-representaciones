import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Calendar, User, ArrowRight, BookOpen,
    Image as ImageIcon, Filter, Check, ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import PageLoading from '@/components/PageLoading';
import { cn } from '@/lib/utils';
import LazyImage from '@/components/ui/LazyImage';

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    image_url: string;
    category_id: string;
    category: string;
    author: string;
    published_at: string;
}

interface BlogCategory {
    id: string;
    name: string;
    slug: string;
}

interface BlogSettings {
    hero_title: string;
    hero_subtitle: string;
    hero_image_url: string | null;
}

const Blog = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [categories, setCategories] = useState<BlogCategory[]>([]);
    const [settings, setSettings] = useState<BlogSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [postsRes, catsRes, settingsRes] = await Promise.all([
                supabase
                    .from('blog_posts')
                    .select('*, blog_categories(name)')
                    .eq('is_published', true)
                    .order('published_at', { ascending: false }),
                supabase
                    .from('blog_categories')
                    .select('*')
                    .order('name'),
                supabase
                    .from('blog_settings')
                    .select('*')
                    .single()
            ]);

            if (postsRes.data) {
                setPosts(postsRes.data.map(p => ({
                    ...p,
                    category: p.blog_categories?.name || 'General'
                })));
            }
            if (catsRes.data) setCategories(catsRes.data);
            if (settingsRes.data) setSettings(settingsRes.data);

        } catch (error) {
            console.error('Error fetching blog data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredPosts = selectedCategory
        ? posts.filter(post => post.category_id === selectedCategory)
        : posts;

    if (loading) return <PageLoading />;

    return (
        <div className="min-h-screen bg-neutral-50">
            <Header />
            <PageHero
                title={settings?.hero_title || "Nuestro Blog"}
                subtitle={settings?.hero_subtitle || "Noticias, tendencias y tecnología de última generación."}
                backgroundImage={settings?.hero_image_url || "https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=2070&auto=format&fit=crop"}
            />

            <section className="py-20 container mx-auto px-4 lg:px-8">
                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Sidebar / Filters */}
                    <aside className="lg:w-72 flex-shrink-0">
                        <div className="sticky top-32 space-y-8">
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-neutral-100">
                                <h3 className="text-sm font-black uppercase tracking-widest text-neutral-400 mb-6 flex items-center gap-2">
                                    <Filter className="w-4 h-4 text-accent" />
                                    Filtrar por
                                </h3>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => setSelectedCategory(null)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-bold text-sm group",
                                            !selectedCategory
                                                ? "bg-accent text-white shadow-lg shadow-accent/20"
                                                : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
                                        )}
                                    >
                                        <span>Todas</span>
                                        {!selectedCategory && <Check className="w-4 h-4" />}
                                        {selectedCategory && <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                    </button>
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setSelectedCategory(cat.id)}
                                            className={cn(
                                                "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-bold text-sm group",
                                                selectedCategory === cat.id
                                                    ? "bg-accent text-white shadow-lg shadow-accent/20"
                                                    : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
                                            )}
                                        >
                                            <span className="truncate">{cat.name}</span>
                                            {selectedCategory === cat.id && <Check className="w-4 h-4" />}
                                            {selectedCategory !== cat.id && <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </aside>

                    {/* Posts Grid */}
                    <div className="flex-1">
                        {filteredPosts.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <AnimatePresence mode="popLayout">
                                    {filteredPosts.map((post, index) => (
                                        <motion.div
                                            key={post.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ duration: 0.4, delay: index * 0.05 }}
                                        >
                                            <Card
                                                className="group h-full flex flex-col overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer rounded-3xl bg-white"
                                                onClick={() => navigate(`/blog/${post.slug}`)}
                                            >
                                                <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100 flex items-center justify-center">
                                                    {post.image_url ? (
                                                        <LazyImage
                                                            src={post.image_url}
                                                            alt={post.title}
                                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                        />
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-2 p-4 text-center">
                                                            <ImageIcon className="w-10 h-10 text-neutral-200" />
                                                            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Estamos trabajando en la imagen</p>
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                                    <Badge className="absolute top-4 left-4 bg-accent/90 backdrop-blur-md text-white border-none px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                                        {post.category}
                                                    </Badge>
                                                </div>

                                                <CardContent className="p-8 flex-1 flex flex-col">
                                                    <div className="flex items-center gap-4 text-[10px] text-neutral-400 mb-4 font-black uppercase tracking-widest">
                                                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-accent" /> {format(new Date(post.published_at), 'dd MMM, yyyy', { locale: es })}</span>
                                                        <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-accent" /> {post.author}</span>
                                                    </div>
                                                    <h3 className="text-xl font-bold mb-4 line-clamp-2 text-neutral-900 group-hover:text-accent transition-colors duration-300 leading-tight">
                                                        {post.title}
                                                    </h3>
                                                    <p className="text-neutral-500 mb-8 line-clamp-3 text-sm leading-relaxed">
                                                        {post.excerpt}
                                                    </p>
                                                    <div className="mt-auto flex items-center gap-2 text-accent font-black text-xs uppercase tracking-widest group-hover:gap-4 transition-all duration-300">
                                                        Leer artículo completo <ArrowRight className="w-4 h-4" />
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border border-dashed border-neutral-200">
                                <BookOpen className="w-16 h-16 text-neutral-100 mb-6" />
                                <h3 className="text-2xl font-bold text-neutral-800">No hay entradas en esta categoría</h3>
                                <p className="text-neutral-500 mt-2">Prueba seleccionando otra categoría o vuelve pronto.</p>
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectedCategory(null)}
                                    className="mt-8 rounded-xl font-bold"
                                >
                                    Ver todas las entradas
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Blog;
