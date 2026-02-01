import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

const Productos = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('newest');

  const productos = [
    { id: 1, nombre: 'Cámara Domo HD 2MP', categoria: 'Domo', precio: '$299', imagen: '📷', isNew: true },
    { id: 2, nombre: 'Cámara Bullet 4MP', categoria: 'Bullet', precio: '$399', imagen: '🎥', isNew: true },
    { id: 3, nombre: 'Cámara PTZ 5MP', categoria: 'PTZ', precio: '$599', imagen: '📹', isNew: false },
    { id: 4, nombre: 'Cámara Térmica', categoria: 'Térmica', precio: '$899', imagen: '🌡️', isNew: true },
    { id: 5, nombre: 'Cámara IP 8MP', categoria: 'IP', precio: '$499', imagen: '💻', isNew: false },
    { id: 6, nombre: 'Cámara Fisheye 12MP', categoria: 'Fisheye', precio: '$699', imagen: '🔍', isNew: true },
    { id: 7, nombre: 'Cámara Compacta 1080p', categoria: 'Compacta', precio: '$199', imagen: '📸', isNew: false },
    { id: 8, nombre: 'Cámara Panorámica 360°', categoria: 'Panorámica', precio: '$799', imagen: '🌐', isNew: true },
  ];

  const categorias = ['Domo', 'Bullet', 'PTZ', 'Térmica', 'IP', 'Fisheye', 'Compacta', 'Panorámica'];
  const marcas = ['Hikvision', 'Dahua', 'Uniview', 'Axis', 'Canon', 'Sony'];

  const filteredProductos = productos
    .filter(p => 
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (!selectedCategory || p.categoria === selectedCategory) &&
      (!selectedBrand || p.categoria === selectedBrand)
    )
    .sort((a, b) => {
      if (sortBy === 'newest') return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
      if (sortBy === 'price-low') return parseInt(a.precio) - parseInt(b.precio);
      if (sortBy === 'price-high') return parseInt(b.precio) - parseInt(a.precio);
      return 0;
    });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PageHero 
        title="Nuestros Productos"
        subtitle="Descubre nuestra amplia gama de soluciones tecnológicas"
      />
      <main className="pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 py-3 bg-card"
              />
            </div>
          </motion.div>

          <div className="flex gap-8">
            {/* Sidebar Filters */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="hidden lg:block w-64 flex-shrink-0"
            >
              <div className="bg-card rounded-lg border border-border p-6 sticky top-28">
                <div className="flex items-center gap-2 mb-6">
                  <Filter className="w-5 h-5" />
                  <h3 className="font-bold text-lg">Filtros</h3>
                </div>

                {/* Category Filter */}
                <div className="mb-8 pb-8 border-b border-border">
                  <h4 className="font-semibold mb-4 text-sm">Categorías</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={!selectedCategory}
                        onCheckedChange={() => setSelectedCategory(null)}
                      />
                      <label className="text-sm cursor-pointer">Todas</label>
                    </div>
                    {categorias.map(cat => (
                      <div key={cat} className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedCategory === cat}
                          onCheckedChange={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                        />
                        <label className="text-sm cursor-pointer">{cat}</label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Brand Filter */}
                <div>
                  <h4 className="font-semibold mb-4 text-sm">Marcas</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={!selectedBrand}
                        onCheckedChange={() => setSelectedBrand(null)}
                      />
                      <label className="text-sm cursor-pointer">Todas</label>
                    </div>
                    {marcas.map(marca => (
                      <div key={marca} className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedBrand === marca}
                          onCheckedChange={() => setSelectedBrand(selectedBrand === marca ? null : marca)}
                        />
                        <label className="text-sm cursor-pointer">{marca}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Main Content */}
            <div className="flex-1">
              {/* Controls Bar */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-between mb-8 bg-card p-4 rounded-lg border border-border"
              >
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {filteredProductos.length} productos encontrados
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Ordenar:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
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
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                {filteredProductos.map((producto, index) => (
                  <motion.div
                    key={producto.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group bg-card rounded-lg border border-border overflow-hidden hover:border-accent transition-all duration-300 hover:shadow-lg"
                  >
                    {/* Product Image */}
                    <div className="relative bg-secondary p-8 text-center overflow-hidden aspect-square flex items-center justify-center">
                      <div className="text-7xl group-hover:scale-110 transition-transform duration-300">
                        {producto.imagen}
                      </div>
                      {producto.isNew && (
                        <div className="absolute top-3 right-3 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded">
                          NUEVO
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4 text-center">
                      <h3 className="font-bold text-base mb-4 group-hover:text-accent transition-colors line-clamp-2">
                        {producto.nombre}
                      </h3>
                      <Button className="w-full bg-accent hover:bg-accent/90 text-sm">
                        Ver Más
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
                  className="text-center py-16"
                >
                  <p className="text-2xl font-bold mb-2">No se encontraron productos</p>
                  <p className="text-muted-foreground">Intenta con otros filtros o búsqueda</p>
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
