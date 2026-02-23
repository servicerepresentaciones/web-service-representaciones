import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import PageLoading from '@/components/PageLoading';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { DEFAULT_IMAGES } from '@/lib/constants';
import { useServices, useServiceSettings } from '@/hooks/use-services';
import LazyImage from '@/components/ui/LazyImage';

const Servicios = () => {
  const navigate = useNavigate();

  const { data: servicios = [], isLoading: isLoadingServices } = useServices();
  const { data: settings, isLoading: isLoadingSettings } = useServiceSettings();

  const loading = isLoadingServices || isLoadingSettings;

  if (loading) {
    return <PageLoading logoUrl={null} />; // Or pass a default while loading
  }

  const heroBg = settings?.services_bg_url || DEFAULT_IMAGES.services;
  const servicesTitle = settings?.services_title || 'Nuestros Servicios';
  const servicesSubtitle = settings?.services_subtitle || 'Soluciones integrales diseñadas para potenciar la eficiencia y seguridad de su empresa';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PageHero
        title={servicesTitle}
        subtitle={servicesSubtitle}
        backgroundImage={heroBg}
      />
      <main className="py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {servicios.map((servicio: any, index: number) => (
              <motion.div
                key={servicio.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group bg-card border border-border rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-accent/5 transition-all duration-500 flex flex-col"
              >
                {/* Image Container */}
                <div className="relative h-64 overflow-hidden">
                  <LazyImage
                    src={servicio.image_url}
                    alt={servicio.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                <div className="p-8 flex flex-col flex-grow">
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-accent transition-colors">
                    {servicio.name}
                  </h3>
                  <p className="text-muted-foreground mb-8 leading-relaxed line-clamp-3">
                    {servicio.description}
                  </p>

                  <div className="mt-auto">
                    <Button
                      variant="link"
                      className="p-0 h-auto text-accent font-bold group-hover:translate-x-2 transition-transform flex items-center gap-2"
                      onClick={() => navigate(`/servicios/${servicio.slug}`)}
                    >
                      Ver Detalles <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Servicios;
