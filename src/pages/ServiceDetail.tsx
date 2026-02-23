import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import PageLoading from '@/components/PageLoading';
import LeadModal from '@/components/LeadModal';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { MessageSquare, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useServiceBySlug } from '@/hooks/use-services';
import LazyImage from '@/components/ui/LazyImage';

const ServiceDetail = () => {
    const { slug } = useParams();
    const [activeImage, setActiveImage] = useState(0);
    const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

    const { data: service, isLoading } = useServiceBySlug(slug);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [slug]);

    if (isLoading) {
        return <PageLoading logoUrl={null} />;
    }

    if (!service) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <h2 className="text-2xl font-bold mb-4">Servicio no encontrado</h2>
                <Link to="/servicios">
                    <Button variant="outline">Volver a Servicios</Button>
                </Link>
            </div>
        );
    }

    // Adapt gallery for component
    const allImages = [service.image_url, ...(service.gallery_images || [])].filter(Boolean);

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <PageHero
                title={service.name}
                subtitle={service.subtitle}
                backgroundImage={allImages[0]}
            />

            <main className="pb-24">
                <div className="container mx-auto px-4 lg:px-8">
                    {/* Back Button */}
                    <div className="py-8">
                        <Link to="/servicios" className="inline-flex items-center text-sm text-muted-foreground hover:text-accent transition-colors">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Volver a Servicios
                        </Link>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-16 mb-24">
                        {/* Service Images Section */}
                        <div className="space-y-6">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="aspect-video bg-secondary rounded-2xl overflow-hidden border border-border group"
                            >
                                {allImages[activeImage] && (
                                    <LazyImage
                                        src={allImages[activeImage]}
                                        alt={service.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                )}
                            </motion.div>

                            <div className="grid grid-cols-4 gap-4">
                                {allImages.map((img: string, index: number) => (
                                    <button
                                        key={index}
                                        onClick={() => setActiveImage(index)}
                                        className={`aspect-video rounded-xl overflow-hidden border-2 transition-all ${activeImage === index ? 'border-accent shadow-lg scale-105' : 'border-border'
                                            }`}
                                    >
                                        <LazyImage src={img} alt={`${service.name} ${index}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Service Info Section */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex flex-col"
                        >
                            <h2 className="text-3xl font-bold mb-6">Descripción del Servicio</h2>
                            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                                {service.description}
                            </p>

                            <div className="space-y-4 mb-10">
                                {service.benefits && service.benefits.map((beneficio: string, i: number) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
                                        <span className="text-foreground font-medium">{beneficio}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 mt-auto">
                                <Button
                                    className="flex-1 h-16 bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-lg gap-3 shadow-xl shadow-accent/20"
                                    onClick={() => setIsLeadModalOpen(true)}
                                >
                                    <MessageSquare className="w-6 h-6" />
                                    Solicitar Ahora
                                </Button>
                            </div>
                        </motion.div>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {service.features && service.features.map((item: any, index: number) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="p-6 rounded-2xl bg-card border border-border text-center"
                            >
                                <h4 className="text-xl font-bold mb-2">{item.titulo}</h4>
                                <p className="text-sm text-muted-foreground">{item.detalle}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </main>

            <Footer />

            <LeadModal
                isOpen={isLeadModalOpen}
                onClose={() => setIsLeadModalOpen(false)}
                initialData={{
                    service: service.name,
                    interestType: 'service',
                    subject: `Interés en: ${service.name}`
                }}
            />
        </div>
    );
};

export default ServiceDetail;
