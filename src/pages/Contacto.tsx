import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import ContactSection from '@/components/ContactSection';

import { DEFAULT_IMAGES } from '@/lib/constants';

const Contacto = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PageHero
        title="Contáctanos"
        subtitle="Estamos listos para asesorarte en tu próximo proyecto tecnológico"
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
