import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Calendar, User, ArrowLeft, Tag, Share2, Facebook, Twitter, Linkedin, Image as ImageIcon, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import PageLoading from '@/components/PageLoading';
import LazyImage from '@/components/ui/LazyImage';

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

interface BlogSharingSettings {
    share_facebook: boolean;
    share_twitter: boolean;
    share_linkedin: boolean;
    share_whatsapp: boolean;
    logo_facebook: string | null;
    logo_twitter: string | null;
    logo_linkedin: string | null;
    logo_whatsapp: string | null;
}

const BlogPost = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState<BlogPost | null>(null);
    const [sharingSettings, setSharingSettings] = useState<BlogSharingSettings>({
        share_facebook: true,
        share_twitter: true,
        share_linkedin: true,
        share_whatsapp: true,
        logo_facebook: null,
        logo_twitter: null,
        logo_linkedin: null,
        logo_whatsapp: null
    });
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
            const [postRes, settingsRes] = await Promise.all([
                supabase
                    .from('blog_posts')
                    .select('*, blog_categories(name)')
                    .eq('slug', slug)
                    .eq('is_published', true)
                    .single(),
                supabase
                    .from('blog_settings')
                    .select('share_facebook, share_twitter, share_linkedin, share_whatsapp, logo_facebook, logo_twitter, logo_linkedin, logo_whatsapp')
                    .single()
            ]);

            if (postRes.error) throw postRes.error;

            setPost({
                ...postRes.data,
                category: postRes.data.blog_categories?.name || postRes.data.category || 'General'
            });

            if (settingsRes.data) {
                setSharingSettings(settingsRes.data);
            }
        } catch (error) {
            console.error('Error fetching blog post:', error);
            navigate('/blog');
        } finally {
            setLoading(false);
        }
    };

    const handleShare = (network: string) => {
        const url = window.location.href;
        const title = post?.title || '';
        let shareUrl = '';

        switch (network) {
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
                break;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
                break;
            case 'linkedin':
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
                break;
            case 'whatsapp':
                shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' ' + url)}`;
                break;
        }

        if (shareUrl) {
            window.open(shareUrl, '_blank', 'noopener,noreferrer');
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
                                <LazyImage
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

                        <div className="grid grid-cols-1 gap-12 relative">
                            <div className="max-w-4xl">
                                <div
                                    className="prose prose-lg max-w-none text-gray-600 leading-relaxed
                                    prose-headings:text-gray-900 prose-headings:font-bold
                                    prose-p:mb-6 prose-strong:text-gray-900
                                    prose-img:rounded-2xl prose-img:shadow-lg
                                    prose-a:text-accent prose-a:no-underline hover:prose-a:underline"
                                    dangerouslySetInnerHTML={{ __html: post.content }}
                                />

                                {/* Social Sharing Section - Now below content */}
                                <div className="mt-16 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                                    <div className="flex items-center gap-2">
                                        <Share2 className="w-5 h-5 text-accent" />
                                        <span className="text-sm font-bold uppercase tracking-wider text-gray-400">Compartir Artículo</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {sharingSettings.share_facebook && (
                                            <button
                                                onClick={() => handleShare('facebook')}
                                                className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2] transition-all transform hover:-translate-y-1 shadow-sm overflow-hidden"
                                            >
                                                {sharingSettings.logo_facebook ? <img src={sharingSettings.logo_facebook} className="w-full h-full object-contain p-2" /> : <Facebook className="w-5 h-5" />}
                                            </button>
                                        )}
                                        {sharingSettings.share_twitter && (
                                            <button
                                                onClick={() => handleShare('twitter')}
                                                className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-[#1DA1F2] hover:text-white hover:border-[#1DA1F2] transition-all transform hover:-translate-y-1 shadow-sm overflow-hidden"
                                            >
                                                {sharingSettings.logo_twitter ? <img src={sharingSettings.logo_twitter} className="w-full h-full object-contain p-2" /> : <Twitter className="w-5 h-5" />}
                                            </button>
                                        )}
                                        {sharingSettings.share_linkedin && (
                                            <button
                                                onClick={() => handleShare('linkedin')}
                                                className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2] transition-all transform hover:-translate-y-1 shadow-sm overflow-hidden"
                                            >
                                                {sharingSettings.logo_linkedin ? <img src={sharingSettings.logo_linkedin} className="w-full h-full object-contain p-2" /> : <Linkedin className="w-5 h-5" />}
                                            </button>
                                        )}
                                        {sharingSettings.share_whatsapp && (
                                            <button
                                                onClick={() => handleShare('whatsapp')}
                                                className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-[#25D366] hover:text-white hover:border-[#25D366] transition-all transform hover:-translate-y-1 shadow-sm overflow-hidden"
                                            >
                                                {sharingSettings.logo_whatsapp ? <img src={sharingSettings.logo_whatsapp} className="w-full h-full object-contain p-2" /> : <MessageCircle className="w-5 h-5" />}
                                            </button>
                                        )}
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
