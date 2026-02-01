import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import { motion } from 'framer-motion';

const Nosotros = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PageHero 
        title="Sobre Nosotros"
        subtitle="Conoce la historia y valores de Service Representaciones"
      />
      <main className="py-16">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-2xl font-bold mb-3">Nuestra Misión</h2>
              <p className="text-muted-foreground">
                Somos una empresa comprometida con la excelencia, innovación y satisfacción del cliente.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-3">Nuestra Visión</h2>
              <p className="text-muted-foreground">
                Ser líderes en la industria, reconocidos por nuestra calidad, compromiso y excelencia en el servicio.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-3">Nuestros Valores</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li>✓ Integridad y transparencia</li>
                <li>✓ Calidad en cada detalle</li>
                <li>✓ Innovación continua</li>
                <li>✓ Compromiso con el cliente</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Nosotros;
