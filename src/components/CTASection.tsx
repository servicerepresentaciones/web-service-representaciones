import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Phone, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

interface CtaContent {
  badge: string;
  title: string;
  description: string;
  primaryBtnText: string;
  primaryBtnUrl: string;
  secondaryBtnText: string;
  secondaryBtnUrl: string;
  bgImage: string | null;
}

const CTASection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const navigate = useNavigate();

  const [content, setContent] = useState<CtaContent>({
    badge: '¿Listo para transformar tu empresa?',
    title: 'Impulsa tu negocio con tecnología de vanguardia',
    description: 'Nuestro equipo de expertos está listo para ayudarte a encontrar las mejores soluciones tecnológicas para tus necesidades empresariales.',
    primaryBtnText: 'Solicitar Consulta Gratuita',
    primaryBtnUrl: '/contacto',
    secondaryBtnText: 'Ver Catálogo Completo',
    secondaryBtnUrl: '/productos',
    bgImage: null
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('site_settings').select('*').single();
      if (data) {
        setContent({
          badge: data.cta_badge || '¿Listo para transformar tu empresa?',
          title: data.cta_title || 'Impulsa tu negocio con tecnología de vanguardia',
          description: data.cta_description || 'Nuestro equipo de expertos está listo para ayudarte a encontrar las mejores soluciones tecnológicas para tus necesidades empresariales.',
          primaryBtnText: data.cta_button_primary_text || 'Solicitar Consulta Gratuita',
          primaryBtnUrl: data.cta_button_primary_url || '/contacto',
          secondaryBtnText: data.cta_button_secondary_text || 'Ver Catálogo Completo',
          secondaryBtnUrl: data.cta_button_secondary_url || '/productos',
          bgImage: data.cta_bg_image || null
        });
      }
    };
    fetchSettings();
  }, []);

  return (
    <section ref={containerRef} className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-hero" />

      {/* Custom Background Image if present */}
      {content.bgImage && (
        <>
          <div className="absolute inset-0">
            <img src={content.bgImage} className="w-full h-full object-cover" alt="CTA Background" />
          </div>
          {/* Overlay to ensure text readability */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
        </>
      )}

      {/* Decorative Elements (only if no custom bg, or kept for style?) - Keep them for now as they add nice effects */}
      {!content.bgImage && (
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-electric-light/10 rounded-full blur-[120px]" />
        </div>
      )}

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(217 91% 60%) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative container mx-auto px-4 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-2 rounded-full bg-accent/20 text-accent text-sm font-medium mb-6 backdrop-blur-sm">
              {content.badge}
            </span>

            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight mb-6">
              {content.title}
            </h2>

            <p className="text-lg md:text-xl text-primary-foreground/70 mb-10 max-w-2xl mx-auto">
              {content.description}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-cta group"
                onClick={() => navigate(content.primaryBtnUrl)}
              >
                {content.primaryBtnText}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-outline-hero"
                onClick={() => navigate(content.secondaryBtnUrl)}
              >
                {content.secondaryBtnText}
              </motion.button>
            </div>

            {/* Contact Options */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-8"
            >
              <a href="tel:+1234567890" className="flex items-center gap-3 text-primary-foreground/70 hover:text-accent transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <span className="text-sm">+1 (234) 567-890</span>
              </a>
              <a href="mailto:info@servicerepresentaciones.com" className="flex items-center gap-3 text-primary-foreground/70 hover:text-accent transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <span className="text-sm">info@servicerepresentaciones.com</span>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;