import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { BadgeCheck } from 'lucide-react';
import LazyImage from '@/components/ui/LazyImage';

interface Brand {
  id: string;
  name: string;
  logo_url: string | null;
}

const BrandsCarousel = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const [brands, setBrands] = useState<Brand[]>([]);
  const [settings, setSettings] = useState({
    title: 'Marcas que Representamos',
    subtitle: 'Somos distribuidores autorizados de las principales marcas tecnológicas del mundo',
    stat1_value: '50+',
    stat1_label: 'Marcas Representadas',
    stat2_value: '15+',
    stat2_label: 'Años de Experiencia',
    stat3_value: '500+',
    stat3_label: 'Clientes Empresariales',
    stat4_value: '24/7',
    stat4_label: 'Soporte Técnico',
  });

  useEffect(() => {
    const fetchData = async () => {
      // Fetch Brands
      const { data: brandsData } = await supabase
        .from('brands')
        .select('id, name, logo_url')
        .eq('is_active', true)
        .order('order', { ascending: true });

      if (brandsData && brandsData.length > 0) {
        setBrands(brandsData);
      } else {
        // Fallback or empty? keeping state empty will show nothing or we could keep defaults.
        // If empty, the carousel will just be empty.
      }

      // Fetch Settings
      const { data: settingsData } = await supabase.from('site_settings').select('*').single();
      if (settingsData) {
        setSettings({
          title: settingsData.brands_title || 'Marcas que Representamos',
          subtitle: settingsData.brands_subtitle || 'Somos distribuidores autorizados de las principales marcas tecnológicas del mundo',
          stat1_value: settingsData.brands_stat1_value || '50+',
          stat1_label: settingsData.brands_stat1_label || 'Marcas Representadas',
          stat2_value: settingsData.brands_stat2_value || '15+',
          stat2_label: settingsData.brands_stat2_label || 'Años de Experiencia',
          stat3_value: settingsData.brands_stat3_value || '500+',
          stat3_label: settingsData.brands_stat3_label || 'Clientes Empresariales',
          stat4_value: settingsData.brands_stat4_value || '24/7',
          stat4_label: settingsData.brands_stat4_label || 'Soporte Técnico',
        });
      }
    };

    fetchData();
  }, []);

  // Prepare items for infinite loop (double the array)
  // If few brands, we might need to triple or quadruple to fill screen width
  const carouselItems = brands.length > 0 ? [...brands, ...brands, ...brands, ...brands] : []; // Quadruple to be safe for wide screens if few brands

  return (
    <section ref={containerRef} className="py-20 bg-secondary overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3">
            {settings.title}
          </h3>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            {settings.subtitle}
          </p>
        </motion.div>

        {/* Infinite Carousel */}
        <div className="relative">
          {/* Gradient Masks */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-secondary to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-secondary to-transparent z-10" />

          {/* Carousel Track */}
          <div className="flex overflow-hidden">
            {carouselItems.length > 0 ? (
              <motion.div
                animate={{ x: [0, '-50%'] }}
                transition={{
                  x: {
                    duration: Math.max(25, brands.length * 5), // Adjust speed based on count
                    repeat: Infinity,
                    ease: 'linear',
                  },
                }}
                className="flex gap-12 items-center"
              >
                {carouselItems.map((brand, index) => (
                  <div
                    key={`${brand.id}-${index}`}
                    className="flex-none w-64 h-36 flex items-center justify-center px-4 grayscale hover:grayscale-0 transition-all opacity-60 hover:opacity-100"
                  >
                    {brand.logo_url ? (
                      <LazyImage
                        src={brand.logo_url}
                        alt={brand.name}
                        className="max-h-28 w-auto object-contain"
                      />
                    ) : (
                      <div className="brand-logo font-display text-2xl md:text-3xl font-bold text-muted-foreground tracking-wider select-none text-center">
                        {brand.name}
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            ) : (
              <div className="w-full text-center py-8 text-gray-400">
                <p>Agregue marcas desde el panel de administración.</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-16 border-t border-border"
        >
          {[
            { value: settings.stat1_value, label: settings.stat1_label },
            { value: settings.stat2_value, label: settings.stat2_label },
            { value: settings.stat3_value, label: settings.stat3_label },
            { value: settings.stat4_value, label: settings.stat4_label },
          ].map((stat, index) => (
            <motion.div
              key={`${stat.label}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
              className="text-center"
            >
              <div className="font-display text-3xl md:text-4xl font-bold text-accent mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default BrandsCarousel;