import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import { motion } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
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
import { supabase } from '@/lib/supabase';
import { DEFAULT_IMAGES } from '@/lib/constants';

interface Category {
  id: string;
  name: string;
  parent_id: string | null;
}

interface Brand {
  id: string;
  name: string;
}

const Productos = () => {
  const navigate = useNavigate();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('newest');

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageHeader, setPageHeader] = useState<string | undefined>(undefined);
  const [productsTitle, setProductsTitle] = useState('Nuestros Productos');
  const [productsSubtitle, setProductsSubtitle] = useState('Descubre nuestra amplia gama de soluciones tecnológicas de última generación');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, brandRes, settingsRes] = await Promise.all([
          supabase.from('categories').select('id, name, parent_id').eq('is_active', true).order('order', { ascending: true }),
          supabase.from('brands').select('id, name').eq('is_active', true).order('order', { ascending: true }),
          supabase.from('site_settings').select('products_bg_url, products_title, products_subtitle').single()
        ]);

        if (catRes.error) throw catRes.error;
        if (brandRes.error) throw brandRes.error;

        setCategories(catRes.data || []);
        setBrands(brandRes.data || []);
        if (settingsRes.data) {
          setPageHeader(settingsRes.data.products_bg_url || undefined);
          if (settingsRes.data.products_title) setProductsTitle(settingsRes.data.products_title);
          if (settingsRes.data.products_subtitle) setProductsSubtitle(settingsRes.data.products_subtitle);
        }
      } catch (error) {
        console.error('Error fetching filters:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const [productos, setProductos] = useState<any[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        let query = supabase
          .from('products')
          .select('*, product_categories(category_id)')
          .eq('is_active', true);

        const { data, error } = await query;
        if (error) throw error;

        // Procesar productos para tener un array plano de category_ids
        const formattedProducts = (data || []).map((p: any) => ({
          ...p,
          category_ids: [
            ...(p.category_id ? [p.category_id] : []), // Legacy
            ...(p.product_categories?.map((pc: any) => pc.category_id) || [])
          ]
        }));

        setProductos(formattedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, []);

  // Helper recursivo para obtener IDs de categoría y sus descendientes
  const getDescendantIds = (categoryId: string, allCats: Category[]): string[] => {
    const children = allCats.filter(c => c.parent_id === categoryId);
    let ids = [categoryId];
    children.forEach(child => {
      ids = [...ids, ...getDescendantIds(child.id, allCats)];
    });
    return ids;
  };

  // Calcular todos los IDs relevantes basados en la selección (incluyendo hijos de los seleccionados)
  const effectiveCategoryIds = useMemo(() => {
    const ids = new Set<string>();
    selectedCategories.forEach(id => {
      const descendants = getDescendantIds(id, categories);
      descendants.forEach(d => ids.add(d));
    });
    return ids;
  }, [selectedCategories, categories]);

  const filteredProductos = productos
    .filter(p =>
      (selectedCategories.length === 0 || (p.category_ids && p.category_ids.some((cid: string) => effectiveCategoryIds.has(cid)))) &&
      (selectedBrands.length === 0 || selectedBrands.includes(p.brand_id))
    )
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      return 0;
    });

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
  };

  // Organizar categorías en estructura de árbol para renderizado
  const rootCategories = categories.filter(c => !c.parent_id);
  const getChildren = (parentId: string) => categories.filter(c => c.parent_id === parentId);

  // Renderizado recursivo de categorías
  const renderCategoryTree = (category: Category) => {
    const children = getChildren(category.id);
    const isSelected = selectedCategories.includes(category.id);
    const isRoot = !category.parent_id;

    if (children.length > 0) {
      if (isRoot) {
        // CAJA PRINCIPAL ACORDEÓN (Nivel Raíz)
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
        // SUB-ACORDEÓN ANIDADO
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

    // NODOS HOJA (Sin hijos)
    if (isRoot) {
      // Raíz solitaria -> Caja simple
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

    // Hijo hoja simple
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
        {(selectedCategories.length > 0 || selectedBrands.length > 0) && (
          <button
            onClick={clearFilters}
            className="text-xs text-accent hover:underline font-medium transition-all"
          >
            Limpiar
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
        </div>
      ) : (
        <>
          {/* Category Filter */}
          <div className="mb-8 pb-8 border-b border-border">
            <h4 className="font-bold mb-4 text-xs uppercase tracking-wider text-muted-foreground">Categorías</h4>
            <Accordion type="multiple" className="w-full space-y-1">
              {rootCategories.map(cat => renderCategoryTree(cat))}
            </Accordion>
          </div>

          {/* Brand Filter */}
          <div>
            <h4 className="font-bold mb-4 text-xs uppercase tracking-wider text-muted-foreground">Marcas</h4>

            <div className="space-y-3">
              {brands.map(marca => (
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
        title={productsTitle}
        subtitle={productsSubtitle}
        backgroundImage={pageHeader || DEFAULT_IMAGES.products}
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
                className="flex flex-wrap items-center justify-between mb-8 bg-card px-4 md:px-6 py-4 rounded-xl border border-border shadow-sm gap-4"
              >
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                  {/* Mobile Filter Trigger */}
                  <div className="lg:hidden">
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2 border-dashed">
                          <Filter className="w-4 h-4" />
                          Filtros
                          {(selectedCategories.length > 0 || selectedBrands.length > 0) && (
                            <span className="ml-1 rounded-full bg-accent w-5 h-5 text-[10px] text-white flex items-center justify-center">
                              {selectedCategories.length + selectedBrands.length}
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
                    Mostrando <span className="text-primary">{filteredProductos.length}</span> productos
                  </span>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <span className="text-sm font-medium text-muted-foreground sm:hidden">
                    <span className="text-primary">{filteredProductos.length}</span> prods.
                  </span>

                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground whitespace-nowrap hidden sm:inline-block">Ordenar por:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all cursor-pointer"
                    >
                      <option value="newest">Más Nuevo</option>
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
                {filteredProductos.map((producto, index) => (
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
                          if (producto.category_ids && producto.category_ids.length > 0) {
                            const cat = categories.find(c => c.id === producto.category_ids[0]);
                            return cat ? cat.name : 'Sin Categoría';
                          }
                          return 'Sin Categoría';
                        })()}
                      </p>
                      <h3 className="font-bold text-xs md:text-base mb-2 group-hover:text-accent transition-colors line-clamp-2 min-h-[2.5rem] md:min-h-[3rem] px-1 md:px-2 text-gray-800">
                        {producto.name}
                      </h3>

                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm hover:shadow-md transition-all mt-auto h-8 md:h-9 text-[10px] md:text-xs rounded-lg">
                        Ver Detalles
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Empty State */}
              {filteredProductos.length === 0 && (
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
                    onClick={() => { setSelectedCategories([]); setSelectedBrands([]); }}
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
