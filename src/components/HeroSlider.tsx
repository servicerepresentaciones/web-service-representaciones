import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHeroSlides } from '@/hooks/use-content';

interface Slide {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string;
  button_text: string | null;
  button_link: string | null;
  secondary_button_text: string | null;
  secondary_button_link: string | null;
}

const HeroSlider = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: slides = [] } = useHeroSlides();

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.top <= 0 && rect.bottom >= 0) {
          setScrollY(-rect.top * 0.3);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (slides.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  if (slides.length === 0) return null; // Or a skeleton loader

  const slide = slides[currentSlide] as Slide;

  return (
    <div ref={containerRef} className="relative h-screen w-full overflow-hidden">
      {/* Parallax Background Images */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id} // Use ID for key
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          <div
            className="absolute inset-0 w-full h-[120%] -top-[10%] bg-cover bg-center"
            style={{
              backgroundImage: `url(${slide.image_url})`,
              transform: `translateY(${scrollY}px)`,
            }}
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-primary/30" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 lg:px-8 h-full flex items-center justify-center md:justify-start">
        <div className="max-w-3xl w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center md:items-start text-center md:text-left"
            >
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-block px-4 py-2 rounded-full bg-accent/20 text-accent text-sm font-medium mb-6"
              >
                Service Representaciones
              </motion.span>

              <h1 className="font-display text-4xl md:text-5xl lg:text-7xl font-bold text-primary-foreground leading-tight mb-2">
                {slide.title}
              </h1>
              {slide.subtitle && (
                <h2 className="font-display text-3xl md:text-4xl lg:text-6xl font-light text-accent mb-6">
                  {slide.subtitle}
                </h2>
              )}

              {slide.description && (
                <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-xl">
                  {slide.description}
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                {slide.button_text && (
                  <button
                    className="btn-hero"
                    onClick={() => slide.button_link && navigate(slide.button_link!)}
                  >
                    {slide.button_text}
                  </button>
                )}
                {slide.secondary_button_text && (
                  <button
                    className="btn-outline-hero"
                    onClick={() => navigate(slide.secondary_button_link || '/contacto')}
                  >
                    {slide.secondary_button_text}
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20 transition-all duration-300"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20 transition-all duration-300"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
        {slides.map((_, index) => (
          <button
            key={(slides[index] as any).id}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentSlide
              ? 'bg-accent w-8'
              : 'bg-primary-foreground/40 hover:bg-primary-foreground/60'
              }`}
          />
        ))}
      </div>

    </div>
  );
};

export default HeroSlider;