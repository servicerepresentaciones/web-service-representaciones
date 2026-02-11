import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface ProductsCarouselProps {
  filterCategoryId?: string;
  excludeProductId?: string;
}

import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

const ProductsCarousel = ({ filterCategoryId, excludeProductId }: ProductsCarouselProps) => {
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [capacity, setCapacity] = useState(4);

  // Update capacity based on screen width
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) setCapacity(2);
      else if (width < 1024) setCapacity(3);
      else setCapacity(4);
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalSlides = productos.length;
  // If we have fewer items than capacity, we don't need to loop and should center
  const enableLoop = totalSlides > capacity;
  const showArrows = true; // User requested always visible, but logically only needed if enableLoop. We'll keep them rendered.

  // Fetch categories for the filter (only on homepage)

  // Fetch categories for the filter (only on homepage)
  useEffect(() => {
    if (!filterCategoryId) {
      const fetchCategories = async () => {
        try {
          // First, get all active products to find which categories have products
          const { data: productsData, error: productsError } = await supabase
            .from('products')
            .select('category_id')
            .eq('is_active', true);

          if (productsError) throw productsError;

          // Get unique category IDs that have products
          const categoryIdsWithProducts = [...new Set(productsData?.map(p => p.category_id).filter(Boolean))];

          if (categoryIdsWithProducts.length > 0) {
            // Fetch only categories that have products
            const { data, error } = await supabase
              .from('categories')
              .select('id, name')
              .eq('is_active', true)
              .in('id', categoryIdsWithProducts)
              .order('order', { ascending: true });

            if (error) throw error;
            setCategories(data || []);
          }
        } catch (error) {
          console.error('Error fetching categories:', error);
        }
      };
      fetchCategories();
    }
  }, [filterCategoryId]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        let query = supabase
          .from('products')
          .select('*, categories(name)')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(10);

        // Apply category filter from props (for related products)
        if (filterCategoryId) {
          query = query.eq('category_id', filterCategoryId);
        }
        // Apply category filter from state (for homepage filter)
        else if (selectedCategoryFilter) {
          query = query.eq('category_id', selectedCategoryFilter);
        }

        if (excludeProductId) {
          query = query.neq('id', excludeProductId);
        }

        const { data, error } = await query;
        if (error) throw error;
        console.log('ProductsCarousel - Productos cargados:', data);
        setProductos(data || []);
      } catch (error) {
        console.error('Error fetching carousel products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [filterCategoryId, excludeProductId, selectedCategoryFilter]);

  const navigate = useNavigate();

  if (loading) return (
    <div className="py-20 flex justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-accent" />
    </div>
  );

  // Always show the carousel if there are products, even just one
  if (productos.length === 0) return null;

  return (
    <section className="py-8 md:py-12 bg-background overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Title - Only show on homepage (when not filtering) */}
        {!filterCategoryId && (
          <>
            <div className="text-center mb-6">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3">
                Nuestros Productos Destacados
              </h2>
              <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
                Descubre nuestra selección de soluciones tecnológicas
              </p>
            </div>

            {/* Category Filter Tabs */}
            {categories.length > 0 && (
              <div className="flex justify-center mb-8">
                <div
                  className="inline-flex gap-2 p-1 bg-muted/50 rounded-lg overflow-x-auto max-w-full scrollbar-hide"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  <button
                    onClick={() => setSelectedCategoryFilter(null)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${selectedCategoryFilter === null
                      ? 'bg-accent text-white shadow-md'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background'
                      }`}
                  >
                    Todas
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategoryFilter(category.id)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${selectedCategoryFilter === category.id
                        ? 'bg-accent text-white shadow-md'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background'
                        }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Carousel Container */}
        <div className="relative px-8 md:px-12 lg:px-14">
          <Carousel
            opts={{
              align: 'start',
              loop: enableLoop,
            }}
            className="w-full"
          >
            <CarouselContent className={`-ml-4 ${!enableLoop ? 'justify-center' : ''}`}>
              {productos.map((producto, index) => (
                <CarouselItem key={producto.id} className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="h-full"
                  >
                    <div
                      className="group bg-card rounded-xl border border-border overflow-hidden hover:border-accent transition-all duration-300 hover:shadow-lg h-full flex flex-col cursor-pointer"
                      onClick={() => navigate(`/productos/${producto.slug}`)}
                    >
                      {/* Product Image */}
                      <div className="relative bg-white text-center overflow-hidden aspect-square flex items-center justify-center flex-shrink-0">
                        {producto.main_image_url ? (
                          <img
                            src={producto.main_image_url}
                            alt={producto.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                        <div className="flex items-center justify-end">
                          <Button
                            size="sm"
                            className="bg-accent hover:bg-accent/90 text-white h-8 w-full"
                          >
                            Ver Detalles
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-[-20px] md:left-[-35px] top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full border border-border bg-card text-foreground hover:bg-secondary shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 disabled:opacity-50">
              <ChevronLeft className="h-5 w-5" />
            </CarouselPrevious>
            <CarouselNext className="absolute right-[-20px] md:right-[-35px] top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full border border-border bg-card text-foreground hover:bg-secondary shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 disabled:opacity-50">
              <ChevronRight className="h-5 w-5" />
            </CarouselNext>
          </Carousel>
        </div>
      </div>
    </section>
  );
};

export default ProductsCarousel;