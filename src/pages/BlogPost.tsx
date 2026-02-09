import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Calendar, User, ArrowLeft, Tag, Share2, Facebook, Twitter, Linkedin, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import PageLoading from '@/components/PageLoading';

interface BlogPost {
    title: string;
    content: string;
    image_url: string;
    category: string;
    author: string;
    published_at: string;
    // SEO
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
}

const BlogPost = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPost();
    }, [slug]);

    useEffect(() => {
        if (post) {
            // Update SEO Metadata
            document.title = post.meta_title || `${post.title} | Service Representaciones`;

            const setMeta = (name: string, content: string) => {
                let element = document.querySelector(`meta[name="${name}"]`);
                if (element) {
                    element.setAttribute('content', content);
                } else {
                    element = document.createElement('meta');
                    element.setAttribute('name', name);
                    element.setAttribute('content', content);
                    document.head.appendChild(element);
                }
            };

            if (post.meta_description) setMeta('description', post.meta_description);
            if (post.meta_keywords) setMeta('keywords', post.meta_keywords);

            // Cleanup on unmount
            return () => {
                document.title = 'Service Representaciones | Soluciones Tecnológicas';
            };
        }
    }, [post]);

    const fetchPost = async () => {
        try {
            const { data, error } = await supabase
                .from('blog_posts')
                .select('*, blog_categories(name)')
                .eq('slug', slug)
                .eq('is_published', true)
                .single();

            if (error) throw error;
            setPost({
                ...data,
                category: data.blog_categories?.name || data.category || 'General'
            });
        } catch (error) {
            console.error('Error fetching blog post:', error);
            navigate('/blog');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <PageLoading />;
    if (!post) return null;

    return (
        <div className="min-h-screen bg-white">
            <Header forceDarkText={true} />

            <main className="pt-32 pb-20">
                <article className="container mx-auto px-4 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-4xl mx-auto"
                    >
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/blog')}
                            className="mb-8 hover:bg-accent/10 hover:text-accent gap-2 group p-0 hover:bg-transparent"
                        >
                            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                            Volver al blog
                        </Button>

                        <div className="space-y-6 mb-12">
                            <div className="flex items-center gap-3">
                                <span className="px-4 py-1.5 bg-accent/10 text-accent text-xs font-bold rounded-full uppercase tracking-widest">
                                    {post.category}
                                </span>
                            </div>

                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 leading-tight">
                                {post.title}
                            </h1>

                            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 font-medium pt-4 border-t">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <span>Por <span className="text-gray-900">{post.author}</span></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-accent" />
                                    {format(new Date(post.published_at), "d 'de' MMMM, yyyy", { locale: es })}
                                </div>
                            </div>
                        </div>

                        <div className="aspect-[21/9] rounded-[2rem] overflow-hidden mb-12 shadow-2xl bg-gray-100 flex items-center justify-center">
                            {post.image_url ? (
                                <img
                                    src={post.image_url}
                                    alt={post.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-4 p-8 text-center">
                                    <ImageIcon className="w-16 h-16 text-gray-300" />
                                    <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Estamos trabajando en la imagen de este artículo</p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative">
                            <div className="lg:col-span-8">
                                <div
                                    className="prose prose-lg max-w-none text-gray-600 leading-relaxed
                    prose-headings:text-gray-900 prose-headings:font-bold
                    prose-p:mb-6 prose-strong:text-gray-900
                    prose-img:rounded-2xl prose-img:shadow-lg
                    prose-a:text-accent prose-a:no-underline hover:prose-a:underline"
                                    dangerouslySetInnerHTML={{ __html: post.content }}
                                />
                            </div>

                            <div className="lg:col-span-4">
                                <div className="sticky top-40 space-y-8">
                                    <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100">
                                        <h4 className="text-lg font-bold mb-6 flex items-center gap-2 uppercase tracking-wider text-xs text-gray-400">
                                            Compartir Artículo
                                        </h4>
                                        <div className="flex items-center gap-4">
                                            <button className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2] transition-all transform hover:-translate-y-1 shadow-sm">
                                                <Facebook className="w-5 h-5" />
                                            </button>
                                            <button className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-[#1DA1F2] hover:text-white hover:border-[#1DA1F2] transition-all transform hover:-translate-y-1 shadow-sm">
                                                <Twitter className="w-5 h-5" />
                                            </button>
                                            <button className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2] transition-all transform hover:-translate-y-1 shadow-sm">
                                                <Linkedin className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </article>
            </main>

            <Footer />
        </div>
    );
};

export default BlogPost;
