import Header from '@/components/Header';
import HeroSlider from '@/components/HeroSlider';
import ProductsCarousel from '@/components/ProductsCarousel';
import CTASection from '@/components/CTASection';
import BrandsCarousel from '@/components/BrandsCarousel';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSlider />
        <ProductsCarousel />
        <CTASection />
        <BrandsCarousel />
      </main>
      <Footer />
    </div>
  );
};

export default Index;