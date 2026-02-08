import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  Github,
  Trello,
  Chrome,
  Globe,
  Music2,
  Video,
  Send,
  MessageSquare,
  LucideIcon
} from 'lucide-react';

interface SocialLink {
  icon: string;
  url: string;
  label: string;
}

interface FooterSettings {
  footer_description: string;
  footer_copyright: string;
  contact_address: string;
  contact_phone_1: string;
  contact_email_1: string;
  contact_schedule_week: string;
  logo_url_dark: string;
  footer_company_links: { label: string; url: string; }[];
  social_links: SocialLink[];
}

interface Category {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
}

// Map string IDs to Lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  'facebook': Facebook,
  'instagram': Instagram,
  'linkedin': Linkedin,
  'twitter': Twitter,
  'youtube': Youtube,
  'music-2': Music2,
  'github': Github,
  'send': Send,
  'message-square': MessageSquare,
  'globe': Globe,
  'video': Video,
  'chrome': Chrome,
};

const Footer = () => {
  const [settings, setSettings] = useState<FooterSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Settings
        const { data: settingsData } = await supabase
          .from('site_settings')
          .select('*')
          .single();

        if (settingsData) setSettings(settingsData);

        // Fetch Categories (for Products column)
        const { data: categoriesData } = await supabase
          .from('categories')
          .select('id, name')
          .order('name');

        if (categoriesData) setCategories(categoriesData);

        // Fetch Services
        const { data: servicesData } = await supabase
          .from('services')
          .select('id, name')
          .order('name');

        if (servicesData) setServices(servicesData);

      } catch (error) {
        console.error('Error fetching footer data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <footer className="bg-gradient-hero text-primary-foreground">
      {/* Main Footer */}
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6">
              {settings?.logo_url_dark ? (
                <img src={settings.logo_url_dark} alt="Logo" className="h-20 object-contain w-auto" />
              ) : (
                <>
                  <div className="w-10 h-10 rounded-lg bg-gradient-accent flex items-center justify-center">
                    <span className="text-accent-foreground font-bold text-xl">S</span>
                  </div>
                  <div>
                    <span className="font-display font-bold text-xl">Service</span>
                    <span className="font-display font-light text-xl text-accent"> Representaciones</span>
                  </div>
                </>
              )}
            </Link>

            <p className="text-primary-foreground/70 mb-6 max-w-sm leading-relaxed">
              {settings?.footer_description || 'Líderes en distribución de soluciones tecnológicas y telecomunicaciones para empresas en toda Latinoamérica.'}
            </p>

            {/* Contact Info */}
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-primary-foreground/70 transition-colors">
                <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5 text-accent" />
                <span className="text-sm whitespace-pre-line">{settings?.contact_address || 'Av. Tecnología 1234, Ciudad Empresarial'}</span>
              </div>
              <a href={`tel:${settings?.contact_phone_1?.replace(/\s+/g, '')}`} className="flex items-center gap-3 text-primary-foreground/70 hover:text-accent transition-colors">
                <Phone className="w-5 h-5 flex-shrink-0 text-accent" />
                <span className="text-sm">{settings?.contact_phone_1 || '+1 (234) 567-890'}</span>
              </a>
              <a href={`mailto:${settings?.contact_email_1}`} className="flex items-center gap-3 text-primary-foreground/70 hover:text-accent transition-colors">
                <Mail className="w-5 h-5 flex-shrink-0 text-accent" />
                <span className="text-sm">{settings?.contact_email_1 || 'info@servicerepresentaciones.com'}</span>
              </a>
              <div className="flex items-center gap-3 text-primary-foreground/70">
                <Clock className="w-5 h-5 flex-shrink-0 text-accent" />
                <span className="text-sm">{settings?.contact_schedule_week || 'Lun - Vie: 9:00 - 18:00'}</span>
              </div>
            </div>
          </div>

          {/* Products Column */}
          <div>
            <h4 className="font-display font-bold text-lg mb-6 flex items-center gap-2">
              Productos
            </h4>
            <ul className="space-y-3">
              {categories.slice(0, 8).map((category) => (
                <li key={category.id}>
                  <Link to={`/productos?category=${category.id}`} className="footer-link block">
                    {category.name}
                  </Link>
                </li>
              ))}
              {categories.length === 0 && (
                <li className="text-primary-foreground/40 text-sm italic">Cargando productos...</li>
              )}
            </ul>
          </div>

          {/* Services Column */}
          <div>
            <h4 className="font-display font-bold text-lg mb-6 flex items-center gap-2">
              Servicios
            </h4>
            <ul className="space-y-3">
              {services.slice(0, 8).map((service) => (
                <li key={service.id}>
                  <Link to={`/servicios/${service.id}`} className="footer-link block">
                    {service.name}
                  </Link>
                </li>
              ))}
              {services.length === 0 && (
                <li className="text-primary-foreground/40 text-sm italic">Cargando servicios...</li>
              )}
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="font-display font-bold text-lg mb-6 flex items-center gap-2">
              Empresa
            </h4>
            <ul className="space-y-3">
              {(settings?.footer_company_links || []).map((link, index) => (
                <li key={index}>
                  <Link to={link.url} className="footer-link block">
                    {link.label}
                  </Link>
                </li>
              ))}
              {(!settings?.footer_company_links || settings.footer_company_links.length === 0) && (
                <>
                  <li><Link to="/nosotros" className="footer-link block">Nosotros</Link></li>
                  <li><Link to="/productos" className="footer-link block">Productos</Link></li>
                  <li><Link to="/servicios" className="footer-link block">Servicios</Link></li>
                  <li><Link to="/contacto" className="footer-link block">Contacto</Link></li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-primary-foreground/10">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
              <p className="text-sm text-primary-foreground/50">
                {settings?.footer_copyright
                  ? settings.footer_copyright.replace('{year}', new Date().getFullYear().toString())
                  : `© ${new Date().getFullYear()} Service Representaciones. Todos los derechos reservados.`}
              </p>
              <div className="flex items-center gap-6">
                <Link to="/privacidad" className="text-sm text-primary-foreground/50 hover:text-accent transition-colors">
                  Privacidad
                </Link>
                <Link to="/terminos" className="text-sm text-primary-foreground/50 hover:text-accent transition-colors">
                  Términos
                </Link>
              </div>
            </div>

            {/* Dynamic Social Links */}
            <div className="flex items-center gap-3">
              {Array.isArray(settings?.social_links) && settings.social_links.map((social, index) => {
                const Icon = ICON_MAP[social.icon] || Globe;
                return (
                  <a
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary-foreground/70 hover:bg-accent hover:text-white hover:border-accent hover:-translate-y-1 transition-all duration-300 group"
                    title={social.label}
                  >
                    <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </a>
                );
              })}
              {(!settings?.social_links || settings.social_links.length === 0) && (
                <p className="text-xs text-primary-foreground/30 italic flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Redes sociales no configuradas
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;