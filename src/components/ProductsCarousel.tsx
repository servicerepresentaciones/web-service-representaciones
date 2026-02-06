import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const productos = [
  { id: 1, nombre: 'Cámara Domo HD 2MP', categoria: 'Domo', imagen: '📷', isNew: true },
  { id: 2, nombre: 'Cámara Bullet 4MP', categoria: 'Bullet', imagen: '🎥', isNew: true },
  { id: 3, nombre: 'Cámara PTZ 5MP', categoria: 'PTZ', imagen: '📹', isNew: false },
  { id: 4, nombre: 'Cámara Térmica', categoria: 'Térmica', imagen: '🌡️', isNew: true },
  { id: 5, nombre: 'Cámara IP 8MP', categoria: 'IP', imagen: '💻', isNew: false },
  { id: 6, nombre: 'Cámara Fisheye 12MP', categoria: 'Fisheye', imagen: '🔍', isNew: true },
  { id: 7, nombre: 'Cámara Compacta 1080p', categoria: 'Compacta', imagen: '📸', isNew: false },
  { id: 8, nombre: 'Cámara Panorámica 360°', categoria: 'Panorámica', imagen: '🌐', isNew: true },
];

const ProductsCarousel = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const [scrollPosition, setScrollPosition] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Detectar cambios de tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const cardWidth = isMobile ? 200 : 240;
      const scrollAmount = cardWidth + 24; // card width + gap
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

  const navigate = useNavigate();

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

          <h2 className="section-title text-foreground mb-4">
            Soluciones Tecnológicas
          </h2>
          <p className="section-subtitle mx-auto">
            Descubre nuestra amplia gama de productos y soluciones diseñadas para potenciar tu empresa.
          </p>
        </motion.div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Navigation Buttons - Hidden on mobile */}
          <button
            onClick={() => scroll('left')}
            className="hidden md:flex absolute -left-4 lg:-left-6 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-card shadow-lg border border-border text-foreground hover:bg-secondary transition-all duration-300"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="hidden md:flex absolute -right-4 lg:-right-6 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-card shadow-lg border border-border text-foreground hover:bg-secondary transition-all duration-300"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Products Grid */}
          <div
            ref={carouselRef}
            className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory px-2 md:px-0"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            onScroll={(e) => setScrollPosition(e.currentTarget.scrollLeft)}
          >
            {productos.map((producto, index) => (
              <motion.div
                key={producto.id}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex-none w-[160px] sm:w-[200px] md:w-[240px] snap-start"
              >
                <div className="group bg-card rounded-lg border border-border overflow-hidden hover:border-accent transition-all duration-300 hover:shadow-lg h-full flex flex-col">
                  {/* Product Image */}
                  <div className="relative bg-secondary p-6 text-center overflow-hidden aspect-square flex items-center justify-center flex-shrink-0">
                    <div className="text-6xl group-hover:scale-110 transition-transform duration-300">
                      {producto.imagen}
                    </div>
                    {producto.isNew && (
                      <div className="absolute top-3 right-3 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded">
                        NUEVO
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-3 md:p-4 text-center flex flex-col flex-grow">
                    <h3 className="font-bold text-xs sm:text-sm mb-3 md:mb-4 group-hover:text-accent transition-colors line-clamp-2 flex-grow">
                      {producto.nombre}
                    </h3>
                    <Button
                      className="w-full bg-accent hover:bg-accent/90 text-xs sm:text-sm py-1.5"
                      onClick={() => navigate(`/productos/${producto.id}`)}
                    >
                      Ver Más
                    </Button>
                  </div>
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