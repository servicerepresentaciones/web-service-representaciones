import Header from '@/components/Header';
import HeroSlider from '@/components/HeroSlider';
import ProductsCarousel from '@/components/ProductsCarousel';
import CTASection from '@/components/CTASection';
import BrandsCarousel from '@/components/BrandsCarousel';
import ContactSection from '@/components/ContactSection';
import Footer from '@/components/Footer';

import PromotionalBanners from '@/components/PromotionalBanners';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSlider />
        <ProductsCarousel />
        <PromotionalBanners />
        <CTASection />
        <BrandsCarousel />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;