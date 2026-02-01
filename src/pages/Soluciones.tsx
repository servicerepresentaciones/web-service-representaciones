import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';

const Soluciones = () => {
  const soluciones = [
    { id: 1, titulo: 'Solución 1', descripcion: 'Descripción de la solución' },
    { id: 2, titulo: 'Solución 2', descripcion: 'Descripción de la solución' },
    { id: 3, titulo: 'Solución 3', descripcion: 'Descripción de la solución' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Nuestras Soluciones</h1>
            <p className="text-xl text-muted-foreground">Soluciones personalizadas para tu negocio</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {soluciones.map((solucion) => (
              <motion.div
                key={solucion.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: solucion.id * 0.1 }}
                className="p-6 rounded-lg bg-card border border-border hover:border-accent transition-colors"
              >
                <h3 className="text-xl font-bold mb-2">{solucion.titulo}</h3>
                <p className="text-muted-foreground">{solucion.descripcion}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Soluciones;
