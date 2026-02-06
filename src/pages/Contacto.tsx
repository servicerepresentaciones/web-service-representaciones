import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import ContactSection from '@/components/ContactSection';

const Contacto = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PageHero
        title="Contáctanos"
        subtitle="Estamos listos para asesorarte en tu próximo proyecto tecnológico"
        backgroundImage="https://images.unsplash.com/photo-1423666639041-f56000c27a9a?q=80&w=2000&auto=format&fit=crop"
      />
      <main>
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};

export default Contacto;
