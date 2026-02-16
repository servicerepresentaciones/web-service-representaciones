import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DEFAULT_IMAGES } from '@/lib/constants';
import { useCategories, useBrands } from '@/hooks/use-meta-data';
import { useProducts } from '@/hooks/use-products';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';



const Productos = () => {
  const navigate = useNavigate();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [showOnlyNew, setShowOnlyNew] = useState(false);

  // Fetch meta data using optimized hooks
  const { data: categories = [], isLoading: isLoadingCats } = useCategories();
  const { data: brands = [], isLoading: isLoadingBrands } = useBrands();

  // Fetch settings separately
  const { data: siteSettings } = useQuery({
    queryKey: ['site_settings_products'],
    queryFn: async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('products_bg_url, products_title, products_subtitle')
        .single();
      return data;
    },
    staleTime: 60 * 60 * 1000 // 1 hour
  });

  // Calculate descendant IDs for filtering
  const getDescendantIds = (categoryId: string, allCats: any[]): string[] => {
    const children = allCats.filter(c => c.parent_id === categoryId);
    let ids = [categoryId];
    children.forEach(child => {
      ids = [...ids, ...getDescendantIds(child.id, allCats)];
    });
    return ids;
  };

  const effectiveCategoryIds = useMemo(() => {
    if (selectedCategories.length === 0) return undefined;
    const ids = new Set<string>();
    selectedCategories.forEach(id => {
      const descendants = getDescendantIds(id, categories);
      descendants.forEach(d => ids.add(d));
    });
    return Array.from(ids);
  }, [selectedCategories, categories]);

  // Fetch products with server-side filtering
  const { data: productos = [], isLoading: isLoadingProducts } = useProducts({
    categoryIds: effectiveCategoryIds,
    brandIds: selectedBrands.length > 0 ? selectedBrands : undefined,
    sortBy,
    limit: 100,
    isNew: showOnlyNew
  });

  const isLoading = isLoadingCats || isLoadingBrands || isLoadingProducts;

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleBrand = (brandId: string) => {
    setSelectedBrands(prev =>
      prev.includes(brandId)
        ? prev.filter(id => id !== brandId)
        : [...prev, brandId]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setShowOnlyNew(false);
  };

  // Organize categories for UI
  const rootCategories = categories.filter((c: any) => !c.parent_id);
  const getChildren = (parentId: string) => categories.filter((c: any) => c.parent_id === parentId);

  // Render Functions
  const renderCategoryTree = (category: any) => {
    const children = getChildren(category.id);
    const isSelected = selectedCategories.includes(category.id);
    const isRoot = !category.parent_id;

    if (children.length > 0) {
      if (isRoot) {
        return (
          <AccordionItem
            key={category.id}
            value={category.id}
            className="border border-gray-200 rounded-lg mb-3 overflow-hidden bg-white data-[state=open]:border-accent/30 data-[state=open]:shadow-sm transition-all shadow-sm"
          >
            <div className="flex items-center px-4 hover:bg-gray-50/50 transition-colors">
              <Checkbox
                id={`cat-${category.id}`}
                checked={isSelected}
                onCheckedChange={() => toggleCategory(category.id)}
                className="mr-3 data-[state=checked]:bg-accent data-[state=checked]:border-accent"
              />
              <div className="flex-1">
                <AccordionTrigger className="w-full py-4 text-sm font-bold text-gray-800 hover:text-accent hover:no-underline [&[data-state=open]]:text-accent text-left justify-between">
                  {category.name}
                </AccordionTrigger>
              </div>
            </div>
            <AccordionContent className="px-4 pb-4 pt-0 bg-gray-50/30 border-t border-gray-100/50">
              <div className="pt-3">
                <Accordion type="multiple" className="w-full space-y-1">
                  {children.map(child => renderCategoryTree(child))}
                </Accordion>
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      } else {
        return (
          <AccordionItem
            key={category.id}
            value={category.id}
            className="border-none mb-1"
          >
            <div className="flex items-center px-2 py-1 rounded-md hover:bg-gray-100/50 transition-colors">
              <Checkbox
                id={`cat-${category.id}`}
                checked={isSelected}
                onCheckedChange={() => toggleCategory(category.id)}
                className="mr-3 scale-90"
              />
              <div className="flex-1">
                <AccordionTrigger className="w-full py-1 text-sm font-medium text-gray-700 hover:text-accent hover:no-underline [&[data-state=open]]:text-accent text-left justify-between">
                  {category.name}
                </AccordionTrigger>
              </div>
            </div>
            <AccordionContent className="pl-4 pb-1 pt-1">
              <div className="pl-4 border-l-2 border-gray-100">
                <Accordion type="multiple" className="w-full space-y-1">
                  {children.map(child => renderCategoryTree(child))}
                </Accordion>
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      }
    }

    if (isRoot) {
      return (
        <div key={category.id} className="border border-gray-200 rounded-lg mb-3 p-4 flex items-center gap-3 bg-white shadow-sm hover:border-accent/30 transition-all">
          <Checkbox
            id={`cat-${category.id}`}
            checked={isSelected}
            onCheckedChange={() => toggleCategory(category.id)}
            className="data-[state=checked]:bg-accent data-[state=checked]:border-accent"
          />
          <label htmlFor={`cat-${category.id}`} className="text-sm font-bold text-gray-800 cursor-pointer hover:text-accent flex-1">
            {category.name}
          </label>
        </div>
      );
    }

    return (
      <div key={category.id} className={`flex items-center gap-3 py-2 px-2 rounded-md hover:bg-gray-100/50 transition-colors ${isSelected ? 'bg-accent/5' : ''}`}>
        <Checkbox
          id={`cat-${category.id}`}
          checked={isSelected}
          onCheckedChange={() => toggleCategory(category.id)}
          className="data-[state=checked]:bg-accent data-[state=checked]:border-accent scale-90"
        />
        <label htmlFor={`cat-${category.id}`} className={`text-sm cursor-pointer hover:text-accent transition-colors flex-1 ${isSelected ? 'text-accent font-medium' : 'text-gray-600'}`}>
          {category.name}
        </label>
      </div>
    );
  };

  const renderFilters = () => (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-accent" />
          <h3 className="font-bold text-lg">Filtros</h3>
        </div>
        {(selectedCategories.length > 0 || selectedBrands.length > 0 || showOnlyNew) && (
          <button
            onClick={clearFilters}
            className="text-xs text-accent hover:underline font-medium transition-all"
          >
            Limpiar
          </button>
        )}
      </div>

      {isLoadingCats || isLoadingBrands ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
        </div>
      ) : (
        <>


          <div className="mb-8 pb-8 border-b border-border">
            <h4 className="font-bold mb-4 text-xs uppercase tracking-wider text-muted-foreground">Todas las Categorías</h4>
            <Accordion type="multiple" className="w-full space-y-1">
              {rootCategories.map((cat: any) => renderCategoryTree(cat))}
            </Accordion>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-xs uppercase tracking-wider text-muted-foreground">Marcas</h4>
            <div className="space-y-3">
              {brands.map((marca: any) => (
                <div key={marca.id} className="flex items-center gap-3">
                  <Checkbox
                    id={`brand-${marca.id}`}
                    checked={selectedBrands.includes(marca.id)}
                    onCheckedChange={() => toggleBrand(marca.id)}
                  />
                  <label htmlFor={`brand-${marca.id}`} className="text-sm cursor-pointer hover:text-accent transition-colors">{marca.name}</label>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <PageHero
        title={siteSettings?.products_title || 'Nuestros Productos'}
        subtitle={siteSettings?.products_subtitle || 'Descubre nuestra amplia gama de soluciones tecnológicas de última generación'}
        backgroundImage={siteSettings?.products_bg_url || DEFAULT_IMAGES.products}
      />
      <main className="pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8 mt-8">
            {/* Sidebar Filters (Desktop) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="hidden lg:block w-64 flex-shrink-0"
            >
              <div className="bg-card rounded-lg border border-border p-6 sticky top-28 shadow-sm">
                {renderFilters()}
              </div>
            </motion.div>

            {/* Main Content */}
            <div className="flex-1">
              {/* Controls Bar */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="sticky top-24 z-30 flex flex-wrap items-center justify-between mb-8 bg-card px-4 md:px-6 py-4 rounded-xl border border-border shadow-sm gap-4"
              >
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                  {/* Mobile Trigger */}
                  <div className="lg:hidden">
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2 border-dashed">
                          <Filter className="w-4 h-4" />
                          Filtros
                          {(selectedCategories.length > 0 || selectedBrands.length > 0 || showOnlyNew) && (
                            <span className="ml-1 rounded-full bg-accent w-5 h-5 text-[10px] text-white flex items-center justify-center">
                              {selectedCategories.length + selectedBrands.length + (showOnlyNew ? 1 : 0)}
                            </span>
                          )}
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="w-[300px] sm:w-[400px] overflow-y-auto">
                        <SheetHeader>
                          <SheetTitle>Filtros</SheetTitle>
                          <SheetDescription>
                            Refina tu búsqueda seleccionando categorías y marcas.
                          </SheetDescription>
                        </SheetHeader>
                        <div className="mt-6">
                          {renderFilters()}
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>

                  <span className="text-sm font-medium text-muted-foreground hidden sm:inline-block">
                    Mostrando <span className="text-primary">{productos.length}</span> productos
                  </span>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <span className="text-sm font-medium text-muted-foreground sm:hidden">
                    <span className="text-primary">{productos.length}</span> prods.
                  </span>

                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground whitespace-nowrap hidden sm:inline-block">Ver:</span>
                    <select
                      value={showOnlyNew ? 'new_products' : (selectedCategories.length === 1 && ['Radios Portátiles', 'Radios Móviles', 'Radios Intrínsecos', 'Accesorios', 'Video Seguridad'].some(name => categories.find((c: any) => c.name === name)?.id === selectedCategories[0]) ? `cat_${selectedCategories[0]}` : 'default')}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'default') {
                          clearFilters();
                        } else if (val === 'new_products') {
                          clearFilters();
                          setShowOnlyNew(true);
                        } else if (val.startsWith('cat_')) {
                          clearFilters();
                          setSelectedCategories([val.replace('cat_', '')]);
                        }
                      }}
                      className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all cursor-pointer"
                    >
                      <option value="default">Todos los Productos</option>
                      <option value="new_products">Productos Nuevos</option>
                      {['Radios Portátiles', 'Radios Móviles', 'Radios Intrínsecos', 'Accesorios', 'Video Seguridad'].map(name => {
                        const cat = categories.find((c: any) => c.name === name);
                        if (!cat) return null;
                        return <option key={cat.id} value={`cat_${cat.id}`}>{cat.name}</option>;
                      })}
                    </select>
                  </div>
                </div>
              </motion.div>

              {/* Products Grid */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
              >
                {productos.map((producto: any, index: number) => (
                  <motion.div
                    key={producto.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group bg-card rounded-2xl border border-border overflow-hidden hover:border-accent/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer flex flex-col h-full"
                    onClick={() => navigate(`/productos/${producto.slug}`)}
                  >
                    {/* Product Image */}
                    <div className="relative bg-muted/30 text-center overflow-hidden aspect-square flex items-center justify-center">
                      {producto.main_image_url ? (
                        <img
                          src={producto.main_image_url}
                          alt={producto.name}
                          loading="lazy"
                          width="300"
                          height="300"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="text-4xl md:text-7xl opacity-20">📦</div>
                      )}
                      {producto.is_new && (
                        <div className="absolute top-2 left-2 md:top-4 md:left-4 bg-accent text-white text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded-full shadow-lg shadow-accent/20 z-10">
                          NUEVO
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-3 md:p-4 flex flex-col items-center text-center flex-grow">
                      <p className="text-[8px] md:text-[10px] font-bold text-accent uppercase tracking-widest mb-1 md:mb-2 px-2 py-0.5 bg-accent/5 rounded w-fit mx-auto truncate max-w-full">
                        {(() => {
                          const catName = producto.categories?.name;
                          return catName || 'Sin Categoría';
                        })()}
                      </p>
                      <h3 className="font-bold text-xs md:text-base mb-2 group-hover:text-accent transition-colors min-h-[2.5rem] md:min-h-[3rem] px-1 md:px-2 text-gray-800 flex items-center justify-center text-center">
                        {producto.name.length > 60 ? `${producto.name.substring(0, 60)}...` : producto.name}
                      </h3>

                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm hover:shadow-md transition-all mt-auto h-8 md:h-9 text-[10px] md:text-xs rounded-lg">
                        Ver Detalles
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Empty State */}
              {productos.length === 0 && !isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20 bg-muted/10 rounded-3xl border-2 border-dashed border-border mt-8"
                >
                  <Filter className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-xl font-bold mb-2">No se encontraron productos</p>
                  <p className="text-muted-foreground">Intenta ajustando los filtros o selecciona otra categoría.</p>
                  <Button
                    variant="link"
                    className="mt-4 text-accent"
                    onClick={() => { setSelectedCategories([]); setSelectedBrands([]); setShowOnlyNew(false); }}
                  >
                    Limpiar todos los filtros
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Productos;
