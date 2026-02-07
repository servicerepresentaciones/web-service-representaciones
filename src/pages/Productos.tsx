import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/lib/supabase';
import { DEFAULT_IMAGES } from '@/lib/constants';

interface Category {
  id: string;
  name: string;
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
  const [productsTitle, setProductsTitle] = useState('Nuestros Productos'); // Default
  const [productsSubtitle, setProductsSubtitle] = useState('Descubre nuestra amplia gama de soluciones tecnológicas de última generación'); // Default

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, brandRes, settingsRes] = await Promise.all([
          supabase.from('categories').select('id, name').eq('is_active', true).order('order', { ascending: true }),
          supabase.from('brands').select('id, name').eq('is_active', true).order('order', { ascending: true }),
          supabase.from('site_settings').select('products_bg_url, products_title, products_subtitle').single()
        ]);

        if (catRes.error) throw catRes.error;
        if (brandRes.error) throw brandRes.error;

        setCategories(catRes.data || []);
        setBrands(brandRes.data || []);
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
          .select('*, categories(name), brands(name)')
          .eq('is_active', true);

        const { data, error } = await query;
        if (error) throw error;
        setProductos(data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, []);

  const filteredProductos = productos
    .filter(p =>
      (selectedCategories.length === 0 || selectedCategories.includes(p.category_id)) &&
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

  // ... (existing imports, but make sure DEFAULT_IMAGES is imported)

  // ...

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
          <div className="flex gap-8 mt-8">
            {/* Sidebar Filters */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="hidden lg:block w-64 flex-shrink-0"
            >
              <div className="bg-card rounded-lg border border-border p-6 sticky top-28 shadow-sm">
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
                      <div className="space-y-3">
                        {categories.map(cat => (
                          <div key={cat.id} className="flex items-center gap-3">
                            <Checkbox
                              id={`cat-${cat.id}`}
                              checked={selectedCategories.includes(cat.id)}
                              onCheckedChange={() => toggleCategory(cat.id)}
                            />
                            <label htmlFor={`cat-${cat.id}`} className="text-sm cursor-pointer hover:text-accent transition-colors">{cat.name}</label>
                          </div>
                        ))}
                      </div>
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
              </div>
            </motion.div>

            {/* Main Content */}
            <div className="flex-1">
              {/* Controls Bar */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-between mb-8 bg-card px-6 py-4 rounded-xl border border-border shadow-sm gap-4"
              >
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    Mostrando <span className="text-primary">{filteredProductos.length}</span> productos
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Ordenar por:</span>
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
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {filteredProductos.map((producto, index) => (
                  <motion.div
                    key={producto.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group bg-card rounded-2xl border border-border overflow-hidden hover:border-accent/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
                    onClick={() => navigate(`/productos/${producto.id}`)}
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
                        <div className="text-7xl opacity-20">📦</div>
                      )}
                      {producto.is_new && (
                        <div className="absolute top-4 left-4 bg-accent text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg shadow-accent/20 z-10">
                          NUEVO
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-5">
                      <p className="text-[10px] font-bold text-accent uppercase tracking-widest mb-1">
                        {producto.categories?.name || 'Sin catálogo'}
                      </p>
                      <h3 className="font-bold text-base mb-4 group-hover:text-accent transition-colors line-clamp-2 min-h-[3rem]">
                        {producto.name}
                      </h3>
                      <div className="flex items-center justify-end">
                        <Button
                          className="bg-accent hover:bg-accent/90 text-white text-xs px-4 h-9 rounded-lg transition-all w-full"
                        >
                          Ver Detalles
                        </Button>
                      </div>
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
