import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Phone, MessageSquare, ArrowLeft, CheckCircle2 } from 'lucide-react';

const ServiceDetail = () => {
    const { id } = useParams();
    const [activeImage, setActiveImage] = useState(0);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (service) {
            document.title = `${service.nombre} | Service Representaciones`;
        }
    }, [id]);

    // Lista de servicios para simular la base de datos
    const allServices: Record<string, any> = {
        '1': { nombre: 'Seguridad Electrónica', subtitulo: 'Sistemas avanzados de vigilancia y control' },
        '2': { nombre: 'Mantenimiento Técnico', subtitulo: 'Soporte preventivo y correctivo de alto nivel' },
        '3': { nombre: 'Soluciones IT', subtitulo: 'Infraestructura y ciberseguridad empresarial' },
        '4': { nombre: 'Consultoría Especializada', subtitulo: 'Optimización de procesos tecnológicos' },
        '5': { nombre: 'Soporte 24/7', subtitulo: 'Asistencia técnica inmediata y garantizada' },
        '6': { nombre: 'Telecomunicaciones', subtitulo: 'Conectividad y redes de alto rendimiento' },
    };

    const serviceData = allServices[id || '1'] || allServices['1'];

    // Datos simulados (esto vendrá de Supabase después)
    const service = {
        id: id,
        nombre: serviceData.nombre,
        subtitulo: serviceData.subtitulo,
        descripcion: `Nuestro servicio de ${serviceData.nombre.toLowerCase()} ofrece una protección integral para su empresa o residencia. Utilizamos tecnología de vanguardia en videovigilancia, sistemas de alarma y control de acceso inteligente. Diseñamos soluciones personalizadas que se adaptan a las necesidades específicas de cada cliente, garantizando tranquilidad y seguridad las 24 horas del día.`,
        imagenes: [
            'https://images.unsplash.com/photo-1557597774-9d273605dfa9?q=80&w=1000&auto=format&fit=crop', // Principal
            'https://images.unsplash.com/photo-1557597774-a6e5454687ed?q=80&w=1000&auto=format&fit=crop', // Galería 1
            'https://images.unsplash.com/photo-1521791136064-7986c2923216?q=80&w=1000&auto=format&fit=crop', // Galería 2
            'https://images.unsplash.com/photo-1541888946425-d81bb19480c5?q=80&w=1000&auto=format&fit=crop', // Galería 3
        ],
        beneficios: [
            'Monitoreo remoto en tiempo real desde cualquier dispositivo.',
            'Detección inteligente de movimiento y alerta temprana.',
            'Soporte técnico especializado disponible 24/7.',
            'Integración con otros sistemas de domótica y seguridad.',
            'Reportes detallados de incidentes y accesos.'
        ],
        caracteristicas: [
            { titulo: 'Cámaras 4K', detalle: 'Resolución ultra alta para detalles precisos.' },
            { titulo: 'IA Integrada', detalle: 'Reconocimiento facial y de matrículas.' },
            { titulo: 'Nube Segura', detalle: 'Almacenamiento de grabaciones con cifrado bancario.' },
            { titulo: 'App Móvil', detalle: 'Control total desde la palma de su mano.' },
        ]
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <PageHero
                title={service.nombre}
                subtitle={service.subtitulo}
                backgroundImage={service.imagenes[0]}
            />

            <main className="pb-24">
                <div className="container mx-auto px-4 lg:px-8">
                    {/* Back Button */}
                    <div className="py-8">
                        <Link to="/servicios" className="inline-flex items-center text-sm text-muted-foreground hover:text-accent transition-colors">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Volver a Servicios
                        </Link>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-16 mb-24">
                        {/* Service Images Section */}
                        <div className="space-y-6">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="aspect-video bg-secondary rounded-2xl overflow-hidden border border-border group"
                            >
                                <img
                                    src={service.imagenes[activeImage]}
                                    alt={service.nombre}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                            </motion.div>

                            <div className="grid grid-cols-4 gap-4">
                                {service.imagenes.map((img, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setActiveImage(index)}
                                        className={`aspect-video rounded-xl overflow-hidden border-2 transition-all ${activeImage === index ? 'border-accent shadow-lg scale-105' : 'border-border'
                                            }`}
                                    >
                                        <img src={img} alt={`${service.nombre} ${index}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Service Info Section */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex flex-col"
                        >
                            <h2 className="text-3xl font-bold mb-6">Descripción del Servicio</h2>
                            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                                {service.descripcion}
                            </p>

                            <div className="space-y-4 mb-10">
                                {service.beneficios.map((beneficio, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
                                        <span className="text-foreground font-medium">{beneficio}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto">
                                <Button className="h-16 bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-lg gap-3 shadow-xl shadow-accent/20">
                                    <MessageSquare className="w-6 h-6" />
                                    Solicitar Ahora
                                </Button>
                                <Button variant="outline" className="h-16 border-accent text-accent hover:bg-accent/5 font-bold text-lg gap-3">
                                    <Phone className="w-6 h-6" />
                                    Llamar Ahora
                                </Button>
                            </div>
                        </motion.div>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {service.caracteristicas.map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="p-6 rounded-2xl bg-card border border-border text-center"
                            >
                                <h4 className="text-xl font-bold mb-2">{item.titulo}</h4>
                                <p className="text-sm text-muted-foreground">{item.detalle}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ServiceDetail;
