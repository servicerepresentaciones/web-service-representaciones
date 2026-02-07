import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Menu, X } from 'lucide-react';
import SearchModal from './SearchModal';
import { supabase } from '@/lib/supabase';

const navItems = [
  { label: 'Inicio', href: '/' },
  { label: 'Productos', href: '/productos' },
  { label: 'Servicios', href: '/servicios' },
  { label: 'Nosotros', href: '/nosotros' },
  { label: 'Contacto', href: '/contacto' },
];

interface HeaderProps {
  forceDarkText?: boolean;
}

const Header = ({ forceDarkText = false }: HeaderProps) => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [logos, setLogos] = useState<{ light: string | null, dark: string | null }>({ light: null, dark: null });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchLogos = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('logo_url_light, logo_url_dark')
        .single();

      if (data) {
        setLogos({
          light: data.logo_url_light, // Positivo (para fondo claro)
          dark: data.logo_url_dark    // Negativo (para fondo oscuro)
        });
      }
    };
    fetchLogos();
  }, []);

  const useDarkText = isScrolled || forceDarkText;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${useDarkText
        ? 'bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100'
        : 'bg-transparent'
        }`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <motion.button
            onClick={() => navigate('/')}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            {logos.light && logos.dark ? (
              <img
                src={useDarkText ? logos.light : logos.dark}
                alt="Service Representaciones"
                className="h-16 w-auto object-contain transition-all duration-300"
              />
            ) : (
              // Fallback si no hay logos cargados aún
              <>
                <div className="w-10 h-10 rounded-lg bg-gradient-accent flex items-center justify-center">
                  <span className="text-accent-foreground font-bold text-xl">S</span>
                </div>
                <div className="hidden sm:block">
                  <span className={`font-display font-bold text-xl ${useDarkText ? 'text-gray-900' : 'text-primary-foreground'}`}>
                    Service
                  </span>
                  <span className={`font-display font-light text-xl ${useDarkText ? 'text-accent' : 'text-accent'}`}>
                    {' '}Representaciones
                  </span>
                </div>
              </>
            )}
          </motion.button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map((item, index) => (
              <motion.button
                key={item.label}
                onClick={() => navigate(item.href)}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`text-sm font-medium transition-colors duration-200 hover:text-accent ${useDarkText ? 'text-gray-600' : 'text-primary-foreground/90'
                  }`}
              >
                {item.label}
              </motion.button>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Search Button */}
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => setIsSearchOpen(true)}
              className={`p-2 rounded-full transition-colors duration-200 ${useDarkText
                ? 'hover:bg-gray-100 text-gray-600'
                : 'hover:bg-primary-foreground/10 text-primary-foreground'
                }`}
            >
              <Search className="w-5 h-5" />
            </motion.button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`lg:hidden p-2 rounded-full transition-colors duration-200 ${useDarkText
                ? 'hover:bg-gray-100 text-gray-600'
                : 'hover:bg-primary-foreground/10 text-primary-foreground'
                }`}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-card border-t border-border"
          >
            <nav className="container mx-auto px-4 py-4">
              {navItems.map((item, index) => (
                <motion.button
                  key={item.label}
                  onClick={() => {
                    navigate(item.href);
                    setIsMobileMenuOpen(false);
                  }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="block w-full text-left py-3 text-foreground/80 hover:text-accent transition-colors border-b border-border/50 last:border-0"
                >
                  {item.label}
                </motion.button>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
};

export default Header;