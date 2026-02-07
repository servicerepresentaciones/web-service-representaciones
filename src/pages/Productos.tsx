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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('newest');

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageHeader, setPageHeader] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, brandRes, settingsRes] = await Promise.all([
          supabase.from('categories').select('id, name').eq('is_active', true).order('order', { ascending: true }),
          supabase.from('brands').select('id, name').eq('is_active', true).order('order', { ascending: true }),
          supabase.from('site_settings').select('products_bg_url').single()
        ]);

        if (catRes.error) throw catRes.error;
        if (brandRes.error) throw brandRes.error;

        setCategories(catRes.data || []);
        setBrands(brandRes.data || []);
        if (settingsRes.data?.products_bg_url) {
          setPageHeader(settingsRes.data.products_bg_url);
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
      (!selectedCategory || p.category_id === selectedCategory) &&
      (!selectedBrand || p.brand_id === selectedBrand)
    )
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      if (sortBy === 'price-low') {
        const valA = parseFloat(a.price?.replace(/[$,]/g, '') || '0');
        const valB = parseFloat(b.price?.replace(/[$,]/g, '') || '0');
        return valA - valB;
      }
      if (sortBy === 'price-high') {
        const valA = parseFloat(a.price?.replace(/[$,]/g, '') || '0');
        const valB = parseFloat(b.price?.replace(/[$,]/g, '') || '0');
        return valB - valA;
      }
      return 0;
    });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <PageHero
        title="Nuestros Productos"
        subtitle="Descubre nuestra amplia gama de soluciones tecnológicas de última generación"
        backgroundImage={pageHeader || "https://images.unsplash.com/photo-1557597774-9d273605dfa9?q=80&w=2000&auto=format&fit=crop"}
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
                  {(selectedCategory || selectedBrand) && (
                    <button
                      onClick={() => { setSelectedCategory(null); setSelectedBrand(null); }}
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
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="cat-all"
                            checked={!selectedCategory}
                            onCheckedChange={() => setSelectedCategory(null)}
                          />
                          <label htmlFor="cat-all" className="text-sm cursor-pointer hover:text-accent transition-colors">Todas</label>
                        </div>
                        {categories.map(cat => (
                          <div key={cat.id} className="flex items-center gap-3">
                            <Checkbox
                              id={`cat-${cat.id}`}
                              checked={selectedCategory === cat.id}
                              onCheckedChange={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
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
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="brand-all"
                            checked={!selectedBrand}
                            onCheckedChange={() => setSelectedBrand(null)}
                          />
                          <label htmlFor="brand-all" className="text-sm cursor-pointer hover:text-accent transition-colors">Todas</label>
                        </div>
                        {brands.map(marca => (
                          <div key={marca.id} className="flex items-center gap-3">
                            <Checkbox
                              id={`brand-${marca.id}`}
                              checked={selectedBrand === marca.id}
                              onCheckedChange={() => setSelectedBrand(selectedBrand === marca.id ? null : marca.id)}
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
                      <option value="price-low">Menor Precio</option>
                      <option value="price-high">Mayor Precio</option>
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
                    <div className="relative bg-muted/30 p-8 text-center overflow-hidden aspect-square flex items-center justify-center">
                      {producto.main_image_url ? (
                        <img
                          src={producto.main_image_url}
                          alt={producto.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
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
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-lg font-black text-primary">{producto.price || 'P.V.R'}</span>
                        <Button
                          className="bg-primary hover:bg-accent text-white text-xs px-4 h-9 rounded-lg transition-all"
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
                    onClick={() => { setSelectedCategory(null); setSelectedBrand(null); }}
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
