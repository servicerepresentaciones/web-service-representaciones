import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const brands = [
  { name: 'Cisco', logo: 'CISCO' },
  { name: 'HP Enterprise', logo: 'HPE' },
  { name: 'Dell Technologies', logo: 'DELL' },
  { name: 'Lenovo', logo: 'LENOVO' },
  { name: 'Microsoft', logo: 'MICROSOFT' },
  { name: 'VMware', logo: 'VMWARE' },
  { name: 'Fortinet', logo: 'FORTINET' },
  { name: 'Palo Alto', logo: 'PALO ALTO' },
  { name: 'Ubiquiti', logo: 'UBIQUITI' },
  { name: 'Aruba', logo: 'ARUBA' },
];

const BrandsCarousel = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

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
          <h3 className="font-display text-2xl font-bold text-foreground mb-3">
            Marcas que Representamos
          </h3>
          <p className="text-muted-foreground">
            Somos distribuidores autorizados de las principales marcas tecnológicas del mundo
          </p>
        </motion.div>

        {/* Infinite Carousel */}
        <div className="relative">
          {/* Gradient Masks */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-secondary to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-secondary to-transparent z-10" />

          {/* Carousel Track */}
          <div className="flex overflow-hidden">
            <motion.div
              animate={{ x: [0, '-50%'] }}
              transition={{
                x: {
                  duration: 25,
                  repeat: Infinity,
                  ease: 'linear',
                },
              }}
              className="flex gap-12 items-center"
            >
              {/* Double the brands for seamless loop */}
              {[...brands, ...brands].map((brand, index) => (
                <div
                  key={`${brand.name}-${index}`}
                  className="flex-none w-40 h-20 flex items-center justify-center px-4"
                >
                  <div className="brand-logo font-display text-lg md:text-xl font-bold text-muted-foreground tracking-wider select-none">
                    {brand.logo}
                  </div>
                </div>
              ))}
            </motion.div>
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
            { value: '50+', label: 'Marcas Representadas' },
            { value: '15+', label: 'Años de Experiencia' },
            { value: '500+', label: 'Clientes Empresariales' },
            { value: '24/7', label: 'Soporte Técnico' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
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