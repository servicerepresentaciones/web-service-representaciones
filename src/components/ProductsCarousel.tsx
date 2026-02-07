import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface ProductsCarouselProps {
  filterCategoryId?: string;
  excludeProductId?: string;
}

import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

const ProductsCarousel = ({ filterCategoryId, excludeProductId }: ProductsCarouselProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const [scrollPosition, setScrollPosition] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Detectar cambios de tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        let query = supabase
          .from('products')
          .select('*, categories(name)')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(10);

        if (filterCategoryId) {
          query = query.eq('category_id', filterCategoryId);
        }

        if (excludeProductId) {
          query = query.neq('id', excludeProductId);
        }

        const { data, error } = await query;
        if (error) throw error;
        setProductos(data || []);
      } catch (error) {
        console.error('Error fetching carousel products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [filterCategoryId, excludeProductId]);

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

  if (loading) return (
    <div className="py-20 flex justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-accent" />
    </div>
  );

  if (productos.length === 0) return null;

  return (
    <section ref={containerRef} className="py-12 bg-background overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
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
                className="flex-none w-[180px] sm:w-[220px] md:w-[260px] snap-start"
              >
                <div
                  className="group bg-card rounded-xl border border-border overflow-hidden hover:border-accent transition-all duration-300 hover:shadow-lg h-full flex flex-col cursor-pointer"
                  onClick={() => navigate(`/productos/${producto.id}`)}
                >
                  {/* Product Image */}
                  <div className="relative bg-white p-6 text-center overflow-hidden aspect-square flex items-center justify-center flex-shrink-0">
                    {producto.main_image_url ? (
                      <img
                        src={producto.main_image_url}
                        alt={producto.name}
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="text-6xl opacity-20">📦</div>
                    )}
                    {producto.is_new && (
                      <div className="absolute top-3 right-3 bg-accent text-accent-foreground text-[10px] font-bold px-2 py-1 rounded">
                        NUEVO
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-3 md:p-4 flex flex-col flex-grow">
                    <p className="text-[10px] text-accent font-bold uppercase mb-1">{producto.categories?.name}</p>
                    <h3 className="font-bold text-sm mb-3 md:mb-4 group-hover:text-accent transition-colors line-clamp-2 flex-grow">
                      {producto.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-primary">{producto.price || 'P.V.R'}</span>
                      <Button
                        size="sm"
                        className="bg-primary hover:bg-accent text-white h-8"
                      >
                        Ver Detalles
                      </Button>
                    </div>
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