import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import PageLoading from '@/components/PageLoading';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

const Legal = () => {
    const [legalPages, setLegalPages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchData = async () => {
            try {
                const [pagesRes, settingsRes] = await Promise.all([
                    supabase
                        .from('legal_pages')
                        .select('*')
                        .eq('is_active', true)
                        .order('slug'),
                    supabase
                        .from('site_settings')
                        .select('logo_url_dark')
                        .single()
                ]);

                if (pagesRes.data) setLegalPages(pagesRes.data);
                if (settingsRes.data?.logo_url_dark) setLogoUrl(settingsRes.data.logo_url_dark);
            } catch (error) {
                console.error('Error fetching legal content:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <PageLoading logoUrl={logoUrl} />;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />
            <PageHero
                title="Información Legal"
                subtitle="Términos, Condiciones y Políticas de Privacidad de Service Representaciones"
            />
            <main className="py-20">
                <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
                    <div className="space-y-16">
                        {legalPages.map((page, index) => (
                            <motion.section
                                key={page.id}
                                id={page.slug}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-card border border-border rounded-3xl p-8 lg:p-12 shadow-sm scroll-mt-32"
                            >
                                <h2 className="text-3xl font-bold mb-8 text-accent border-b border-border pb-4">
                                    {page.title}
                                </h2>
                                <div className="prose prose-blue dark:prose-invert max-w-none text-muted-foreground leading-relaxed whitespace-pre-line">
                                    {page.content || "Contenido en desarrollo..."}
                                </div>
                            </motion.section>
                        ))}

                        {legalPages.length === 0 && (
                            <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-border">
                                <p className="text-muted-foreground">No se ha encontrado contenido legal configurado.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Legal;
