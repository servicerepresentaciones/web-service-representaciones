import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import ContactSection from '@/components/ContactSection';
import { supabase } from '@/lib/supabase';
import { DEFAULT_IMAGES } from '@/lib/constants';

const Contacto = () => {
  const [settings, setSettings] = useState({
    title: "Contáctanos",
    subtitle: "Estamos listos para asesorarte en tu próximo proyecto tecnológico"
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase.from('site_settings').select('contact_hero_title, contact_hero_subtitle').single();
        if (data) {
          setSettings({
            title: data.contact_hero_title || "Contáctanos",
            subtitle: data.contact_hero_subtitle || "Estamos listos para asesorarte en tu próximo proyecto tecnológico"
          });
        }
      } catch (error) {
        console.error('Error fetching contact hero settings:', error);
      }
    };
    fetchSettings();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PageHero
        title={settings.title}
        subtitle={settings.subtitle}
        backgroundImage={DEFAULT_IMAGES.contact}
      />
      <main>
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};

export default Contacto;
