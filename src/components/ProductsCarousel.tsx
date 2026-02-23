import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useProducts } from '@/hooks/use-products';
import { useCategories } from '@/hooks/use-meta-data';
import LazyImage from '@/components/ui/LazyImage';

interface ProductsCarouselProps {
  filterCategoryId?: string;
  excludeProductId?: string;
}

const ProductsCarousel = ({ filterCategoryId, excludeProductId }: ProductsCarouselProps) => {
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [capacity, setCapacity] = useState(4);
  const navigate = useNavigate();

  // Fetch categories only if we are on the homepage (no filterCategoryId prop)
  const { data: allCategories } = useCategories();

  // Filter categories that have products would typically be done server side 
  // or by checking product counts. For now, we show all active categories if available.
  const categories = allCategories || [];

  // Helper to get all category IDs including children recursively
  const getRecursiveCategoryIds = (categoryId: string, categoriesList: any[]): string[] => {
    const children = categoriesList.filter(cat => cat.parent_id === categoryId);
    let ids = [categoryId];

    children.forEach(child => {
      ids = [...ids, ...getRecursiveCategoryIds(child.id, categoriesList)];
    });

    return ids;
  };

  const activeCategoryId = filterCategoryId || selectedCategoryFilter;
  const categoryIdsToFilter = activeCategoryId
    ? getRecursiveCategoryIds(activeCategoryId, categories)
    : undefined;

  const { data, isLoading } = useProducts({
    categoryIds: categoryIdsToFilter,
    excludeId: excludeProductId,
    limit: 10,
    sortBy: 'newest'
  });

  const productos = (data || []) as any[];

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
  const enableLoop = totalSlides > capacity;

  if (isLoading) return (
    <div className="py-20 flex justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-accent" />
    </div>
  );

  // if (productos.length === 0) return null; // Removed check to allow showing filters even with no products

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

            {/* Category Filter Carousel */}
            {categories.length > 0 && (
              <div className="w-full max-w-5xl mx-auto mb-8 px-4 md:px-12 relative overflow-visible">
                <Carousel
                  opts={{
                    align: 'center',
                    dragFree: true,
                  }}
                  className="w-full"
                >
                  <CarouselContent className="-ml-3 py-2"> {/* Balanced padding for alignment */}
                    <CarouselItem className="pl-3 basis-auto">
                      <button
                        onClick={() => setSelectedCategoryFilter(null)}
                        className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all border whitespace-nowrap ${selectedCategoryFilter === null
                          ? 'bg-accent text-white border-accent shadow-md scale-105'
                          : 'bg-white text-muted-foreground border-gray-200 hover:border-accent hover:text-accent hover:shadow-sm'
                          }`}
                      >
                        Todas
                      </button>
                    </CarouselItem>
                    {categories.map((category) => (
                      <CarouselItem key={category.id} className="pl-3 basis-auto">
                        <button
                          onClick={() => setSelectedCategoryFilter(category.id)}
                          className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all border whitespace-nowrap ${selectedCategoryFilter === category.id
                            ? 'bg-accent text-white border-accent shadow-md scale-105'
                            : 'bg-white text-muted-foreground border-gray-200 hover:border-accent hover:text-accent hover:shadow-sm'
                            }`}
                        >
                          {category.name}
                        </button>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="flex lg:hidden absolute -left-3 h-8 w-8 border-none bg-white hover:bg-white text-foreground shadow-md top-1/2 -translate-y-1/2 z-10" />
                  <CarouselNext className="flex lg:hidden absolute -right-3 h-8 w-8 border-none bg-white hover:bg-white text-foreground shadow-md top-1/2 -translate-y-1/2 z-10" />

                  <CarouselPrevious className="hidden lg:flex absolute -left-12 h-9 w-9 border-none bg-white hover:bg-white text-foreground shadow-md top-1/2 -translate-y-1/2 z-10" />
                  <CarouselNext className="hidden lg:flex absolute -right-12 h-9 w-9 border-none bg-white hover:bg-white text-foreground shadow-md top-1/2 -translate-y-1/2 z-10" />
                </Carousel>
              </div>
            )}
          </>
        )}

        {/* Carousel Container */}
        {productos.length > 0 ? (
          <div className="relative px-4 md:px-12 lg:px-14 py-4">
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
                      className="h-full py-2" // Add padding for hover movement
                    >
                      <div
                        className="group bg-card rounded-xl border border-border overflow-hidden hover:border-accent transition-all duration-300 hover:shadow-lg h-full flex flex-col cursor-pointer"
                        onClick={() => navigate(`/productos/${producto.slug}`)}
                      >
                        {/* Product Image */}
                        <div className="relative bg-white text-center overflow-hidden aspect-square flex items-center justify-center flex-shrink-0">
                          {producto.main_image_url ? (
                            <LazyImage
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
                          <p className="text-[10px] text-accent font-bold uppercase mb-1">
                            {Array.isArray(producto.categories)
                              ? producto.categories[0]?.name
                              : (producto.categories as any)?.name || 'Producto'}
                          </p>
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
              <CarouselPrevious className="hidden sm:flex absolute left-[-20px] md:left-[-35px] top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full border border-border bg-card text-foreground hover:bg-secondary shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 disabled:opacity-50">
                <ChevronLeft className="h-5 w-5" />
              </CarouselPrevious>
              <CarouselNext className="hidden sm:flex absolute right-[-20px] md:right-[-35px] top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full border border-border bg-card text-foreground hover:bg-secondary shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 disabled:opacity-50">
                <ChevronRight className="h-5 w-5" />
              </CarouselNext>
            </Carousel>
          </div>
        ) : (
          <div className="text-center py-12 animate-in fade-in duration-500">
            <p className="text-muted-foreground text-lg mb-4">No se encontraron productos en esta categoría.</p>
            <Button
              variant="outline"
              onClick={() => setSelectedCategoryFilter(null)}
              className="hover:bg-accent hover:text-white transition-colors"
            >
              Ver todos los productos
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductsCarousel;