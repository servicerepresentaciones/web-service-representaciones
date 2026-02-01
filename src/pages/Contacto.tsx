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
        subtitle="Estamos aquí para ayudarte"
      />
      <main>
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};

export default Contacto;
