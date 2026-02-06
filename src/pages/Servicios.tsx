import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const Servicios = () => {
  const navigate = useNavigate();

  const servicios = [
    {
      id: 1,
      nombre: 'Seguridad Electrónica',
      descripcion: 'Implementación de sistemas avanzados de vigilancia e inteligencia para proteger lo que más importa.',
      image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?q=80&w=800&auto=format&fit=crop'
    },
    {
      id: 2,
      nombre: 'Mantenimiento Técnico',
      descripcion: 'Soporte preventivo y correctivo especializado para garantizar la continuidad operativa de sus sistemas.',
      image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=800&auto=format&fit=crop'
    },
    {
      id: 3,
      nombre: 'Soluciones IT',
      descripcion: 'Infraestructura robusta de redes, servidores y ciberseguridad adaptada a las necesidades de su empresa.',
      image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc51?q=80&w=800&auto=format&fit=crop'
    },
    {
      id: 4,
      nombre: 'Consultoría Especializada',
      descripcion: 'Asesoramiento estratégico para la optimización y modernización de infraestructuras tecnológicas.',
      image: 'https://images.unsplash.com/photo-1454165833767-027ffea9e78b?q=80&w=800&auto=format&fit=crop'
    },
    {
      id: 5,
      nombre: 'Soporte 24/7',
      descripcion: 'Asistencia técnica ininterrumpida con tiempos de respuesta breves para casos críticos.',
      image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=800&auto=format&fit=crop'
    },
    {
      id: 6,
      nombre: 'Telecomunicaciones',
      descripcion: 'Sistemas de conectividad de alta velocidad y servicios de telefonía IP empresarial.',
      image: 'https://images.unsplash.com/photo-1544669146-6c4d5dd4c58f?q=80&w=800&auto=format&fit=crop'
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PageHero
        title="Nuestros Servicios"
        subtitle="Soluciones integrales diseñadas para potenciar la eficiencia y seguridad de su empresa"
        backgroundImage="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=2000&auto=format&fit=crop"
      />
      <main className="py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {servicios.map((servicio, index) => (
              <motion.div
                key={servicio.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group bg-card border border-border rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-accent/5 transition-all duration-500 flex flex-col"
              >
                {/* Image Container */}
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={servicio.image}
                    alt={servicio.nombre}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                <div className="p-8 flex flex-col flex-grow">
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-accent transition-colors">
                    {servicio.nombre}
                  </h3>
                  <p className="text-muted-foreground mb-8 leading-relaxed line-clamp-3">
                    {servicio.descripcion}
                  </p>

                  <div className="mt-auto">
                    <Button
                      variant="link"
                      className="p-0 h-auto text-accent font-bold group-hover:translate-x-2 transition-transform flex items-center gap-2"
                      onClick={() => navigate(`/servicios/${servicio.id}`)}
                    >
                      Ver Detalles <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
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
