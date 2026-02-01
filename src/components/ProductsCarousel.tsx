import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { ChevronLeft, ChevronRight, Wifi, Server, Monitor, Shield, Cloud, Cpu } from 'lucide-react';

const products = [
  {
    icon: Server,
    title: 'Servidores Enterprise',
    description: 'Soluciones de servidor de alto rendimiento para centros de datos empresariales.',
    category: 'Infraestructura',
  },
  {
    icon: Wifi,
    title: 'Redes Inalámbricas',
    description: 'Sistemas WiFi 6E y soluciones de conectividad de última generación.',
    category: 'Conectividad',
  },
  {
    icon: Shield,
    title: 'Ciberseguridad',
    description: 'Protección integral contra amenazas con firewalls y sistemas de detección.',
    category: 'Seguridad',
  },
  {
    icon: Cloud,
    title: 'Cloud Computing',
    description: 'Migración y gestión de infraestructura en la nube híbrida.',
    category: 'Cloud',
  },
  {
    icon: Monitor,
    title: 'Videoconferencia',
    description: 'Equipos profesionales para comunicación empresarial unificada.',
    category: 'Colaboración',
  },
  {
    icon: Cpu,
    title: 'IoT Industrial',
    description: 'Sensores y gateways para la industria 4.0 e IoT empresarial.',
    category: 'IoT',
  },
];

const ProductsCarousel = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const [scrollPosition, setScrollPosition] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 400;
      const newPosition = direction === 'left' 
        ? scrollPosition - scrollAmount 
        : scrollPosition + scrollAmount;
      
      carouselRef.current.scrollTo({
        left: newPosition,
        behavior: 'smooth',
      });
      setScrollPosition(newPosition);
    }
  };

  return (
    <section ref={containerRef} className="py-24 bg-background overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            Catálogo de Productos
          </span>
          <h2 className="section-title text-foreground mb-4">
            Soluciones Tecnológicas
          </h2>
          <p className="section-subtitle mx-auto">
            Descubre nuestra amplia gama de productos y soluciones diseñadas para potenciar tu empresa.
          </p>
        </motion.div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Navigation Buttons */}
          <button
            onClick={() => scroll('left')}
            className="absolute -left-4 lg:-left-6 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-card shadow-lg border border-border text-foreground hover:bg-secondary transition-all duration-300"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="absolute -right-4 lg:-right-6 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-card shadow-lg border border-border text-foreground hover:bg-secondary transition-all duration-300"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Products Grid */}
          <div
            ref={carouselRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            onScroll={(e) => setScrollPosition(e.currentTarget.scrollLeft)}
          >
            {products.map((product, index) => (
              <motion.div
                key={product.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex-none w-[320px] snap-start"
              >
                <div className="card-product group h-full p-8">
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-6 group-hover:bg-accent transition-colors duration-300">
                    <product.icon className="w-7 h-7 text-accent group-hover:text-accent-foreground transition-colors duration-300" />
                  </div>

                  {/* Category */}
                  <span className="text-xs font-medium text-accent uppercase tracking-wider">
                    {product.category}
                  </span>

                  {/* Title */}
                  <h3 className="font-display text-xl font-bold text-foreground mt-2 mb-3 group-hover:text-accent transition-colors duration-300">
                    {product.title}
                  </h3>

                  {/* Description */}
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                    {product.description}
                  </p>

                  {/* Link */}
                  <a
                    href="#"
                    className="inline-flex items-center text-sm font-medium text-accent hover:gap-3 gap-2 transition-all duration-300"
                  >
                    Ver detalles
                    <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductsCarousel;