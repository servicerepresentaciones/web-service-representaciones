import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import { motion } from 'framer-motion';

const Servicios = () => {
  const servicios = [
    { id: 1, nombre: 'Servicio 1', descripcion: 'Descripción del servicio' },
    { id: 2, nombre: 'Servicio 2', descripcion: 'Descripción del servicio' },
    { id: 3, nombre: 'Servicio 3', descripcion: 'Descripción del servicio' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PageHero 
        title="Nuestros Servicios"
        subtitle="Servicios profesionales diseñados para tu empresa"
      />
      <main className="py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {servicios.map((servicio) => (
              <motion.div
                key={servicio.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: servicio.id * 0.1 }}
                className="p-6 rounded-lg bg-card border border-border hover:border-accent transition-colors"
              >
                <h3 className="text-xl font-bold mb-2">{servicio.nombre}</h3>
                <p className="text-muted-foreground">{servicio.descripcion}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Servicios;
