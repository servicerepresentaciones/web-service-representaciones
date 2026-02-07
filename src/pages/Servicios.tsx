import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

import { DEFAULT_IMAGES } from '@/lib/constants';

const Servicios = () => {
  const navigate = useNavigate();
  const [servicios, setServicios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroBg, setHeroBg] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch Services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('order', { ascending: true });

      if (servicesError) console.error('Error fetching services:', servicesError);
      else setServicios(servicesData || []);

      // 2. Fetch Page Settings (Background)
      const { data: settingsData, error: settingsError } = await supabase
        .from('site_settings')
        .select('services_bg_url')
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {
        console.error('Error fetching settings:', settingsError);
      } else if (settingsData?.services_bg_url) {
        setHeroBg(settingsData.services_bg_url);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PageHero
        title="Nuestros Servicios"
        subtitle="Soluciones integrales diseñadas para potenciar la eficiencia y seguridad de su empresa"
        backgroundImage={heroBg || DEFAULT_IMAGES.services}
      />
      <main className="py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {servicios.map((servicio, index) => (
              <motion.div
                key={servicio.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group bg-card border border-border rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-accent/5 transition-all duration-500 flex flex-col"
              >
                {/* Image Container */}
                <div className="relative h-64 overflow-hidden">
                  <img
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
                      onClick={() => navigate(`/servicios/${servicio.id}`)}
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
