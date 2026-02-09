import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import { motion } from 'framer-motion';
import { Shield, Target, Eye, Gem, CheckCircle2, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { DEFAULT_IMAGES } from '@/lib/constants';

const ICON_MAP: Record<string, any> = {
  Shield,
  Target,
  Eye,
  Gem,
  CheckCircle2,
};

const Nosotros = () => {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<any>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { data, error } = await supabase
          .from('about_settings')
          .select('*')
          .single();

        if (error) throw error;
        setContent(data);
      } catch (error) {
        console.error('Error fetching about page content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  const valores = content?.values || [
    { icon: 'Shield', title: 'Integridad', desc: 'Actuamos con honestidad y transparencia en cada proyecto.' },
    { icon: 'Target', title: 'Innovación', desc: 'Implementamos las últimas tecnologías del mercado.' },
    { icon: 'Gem', title: 'Excelencia', desc: 'Buscamos la perfección en cada detalle de nuestro servicio.' },
    { icon: 'CheckCircle2', title: 'Compromiso', desc: 'La satisfacción de nuestros clientes es nuestra prioridad.' },
  ];

  const beneficios = content?.benefits || [
    'Soporte técnico especializado 24/7.',
    'Tecnología de vanguardia en seguridad y redes.',
    'Garantía extendida en todas nuestras instalaciones.',
    'Asesoría personalizada para cada tipo de negocio.',
    'Reducción de costos operativos mediante eficiencia técnica.',
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* 1. Encabezado con fondo de imagen */}
      <PageHero
        title={content?.hero_title || "Sobre Nosotros"}
        subtitle={content?.hero_subtitle || "Más de 10 años de excelencia en soluciones tecnológicas e industriales"}
        backgroundImage={content?.hero_image_url || DEFAULT_IMAGES.about}
      />

      <main className="pb-24">
        {/* 2. Imagen con título y subtítulo */}
        <section className="py-24 bg-secondary/30">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative rounded-2xl overflow-hidden shadow-2xl"
              >
                <img
                  src={content?.intro_image_url || DEFAULT_IMAGES.aboutTeam}
                  alt="Equipo de trabajo"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-8 left-8 right-8 text-white">
                  <h3 className="text-2xl font-bold mb-2">Nuestro Motor: La Innovación</h3>
                  <p className="text-white/80">Transformando desafíos en oportunidades tecnológicas.</p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <h2 className="text-4xl font-bold text-foreground">{content?.intro_title || "Service Representaciones"}</h2>
                <div className="text-xl text-muted-foreground leading-relaxed whitespace-pre-line">
                  {content?.intro_text || "Somos una compañía líder especializada en la representación, distribución e implementación de soluciones tecnológicas de alta ingeniería. Nuestra trayectoria nos avala como el aliado estratégico ideal para empresas que buscan seguridad, eficiencia y modernización."}
                </div>
              </motion.div>
            </div>
          </div>
        </section>


        {/* 4. Misión, Visión, Valores, Beneficios */}
        <section className="py-24">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-20">
              <div className="space-y-16">
                {/* Misión */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-accent/10 rounded-xl text-accent">
                      <Target className="w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-bold">{content?.mission_title || "Nuestra Misión"}</h2>
                  </div>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {content?.mission_text || "Proveer a nuestros clientes soluciones tecnológicas e industriales de la más alta calidad, superando sus expectativas mediante la innovación constante y un servicio de ingeniería excepcional que garantice la continuidad y seguridad de sus operaciones."}
                  </p>
                </motion.div>

                {/* Visión */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-accent/10 rounded-xl text-accent">
                      <Eye className="w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-bold">{content?.vision_title || "Nuestra Visión"}</h2>
                  </div>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {content?.vision_text || "Ser reconocidos como la empresa líder en Latinoamérica en la integración de tecnologías avanzadas, distinguiéndonos por nuestra integridad ética, capacidad técnica y compromiso inquebrantable con el desarrollo sostenible de nuestros clientes."}
                  </p>
                </motion.div>
              </div>

              <div className="space-y-12">
                <h2 className="text-3xl font-bold">¿Por qué elegirnos?</h2>
                <div className="grid gap-6">
                  {beneficios.map((beneficio: string, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-accent/50 transition-colors"
                    >
                      <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0" />
                      <span className="font-medium">{beneficio}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Valores Grid */}
            <div className="mt-32">
              <h2 className="text-4xl font-bold text-center mb-16">Nuestros Valores</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {valores.map((v: any, i: number) => {
                  const IconComponent = ICON_MAP[v.icon] || Shield;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="p-8 rounded-2xl bg-card border border-border text-center group hover:bg-accent/5 transition-all"
                    >
                      <div className="p-4 bg-secondary rounded-full inline-block mb-6 group-hover:scale-110 transition-transform">
                        <IconComponent className="w-8 h-8 text-accent" />
                      </div>
                      <h3 className="text-xl font-bold mb-3">{v.title || v.titulo}</h3>
                      <p className="text-muted-foreground">{v.desc}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default Nosotros;
