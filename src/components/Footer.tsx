import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  ArrowRight
} from 'lucide-react';

const footerLinks = {
  productos: [
    'Servidores',
    'Redes',
    'Seguridad',
    'Cloud',
    'Colaboración',
    'IoT',
  ],
  servicios: [
    'Consultoría',
    'Implementación',
    'Soporte Técnico',
    'Capacitación',
    'Mantenimiento',
    'Outsourcing',
  ],
  empresa: [
    'Nosotros',
    'Casos de Éxito',
    'Blog',
    'Carreras',
    'Partners',
    'Prensa',
  ],
};

const Footer = () => {
  const [settings, setSettings] = useState({
    address: 'Av. Tecnología 1234, Ciudad Empresarial',
    phone: '+1 (234) 567-890',
    email: 'info@servicerepresentaciones.com',
    schedule: 'Lun - Vie: 8:00 - 18:00',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase.from('site_settings').select('*').single();
        if (data) {
          setSettings({
            address: data.contact_address || 'Av. Tecnología 1234, Ciudad Empresarial',
            phone: data.contact_phone_1 || '+1 (234) 567-890',
            email: data.contact_email_1 || 'info@servicerepresentaciones.com',
            schedule: data.contact_schedule_week || 'Lun - Vie: 8:00 - 18:00',
          });
        }
      } catch (error) {
        console.error('Error fetching footer settings:', error);
      }
    };
    fetchSettings();
  }, []);

  return (
    <footer className="bg-gradient-hero text-primary-foreground">
      {/* Main Footer */}
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-accent flex items-center justify-center">
                <span className="text-accent-foreground font-bold text-xl">S</span>
              </div>
              <div>
                <span className="font-display font-bold text-xl">Service</span>
                <span className="font-display font-light text-xl text-accent"> Representaciones</span>
              </div>
            </div>

            <p className="text-primary-foreground/70 mb-6 max-w-sm">
              Líderes en distribución de soluciones tecnológicas y telecomunicaciones
              para empresas en toda Latinoamérica.
            </p>

            {/* Contact Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-primary-foreground/70 transition-colors">
                <MapPin className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm whitespace-pre-line">{settings.address}</span>
              </div>
              <a href={`tel:${settings.phone.replace(/\s+/g, '')}`} className="flex items-center gap-3 text-primary-foreground/70 hover:text-accent transition-colors">
                <Phone className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{settings.phone}</span>
              </a>
              <a href={`mailto:${settings.email}`} className="flex items-center gap-3 text-primary-foreground/70 hover:text-accent transition-colors">
                <Mail className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{settings.email}</span>
              </a>
              <div className="flex items-center gap-3 text-primary-foreground/70">
                <Clock className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{settings.schedule}</span>
              </div>
            </div>
          </div>

          {/* Products */}
          <div>
            <h4 className="font-display font-bold text-lg mb-6">Productos</h4>
            <ul className="space-y-3">
              {footerLinks.productos.map((link) => (
                <li key={link}>
                  <a href="#" className="footer-link">{link}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-display font-bold text-lg mb-6">Servicios</h4>
            <ul className="space-y-3">
              {footerLinks.servicios.map((link) => (
                <li key={link}>
                  <a href="#" className="footer-link">{link}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-display font-bold text-lg mb-6">Empresa</h4>
            <ul className="space-y-3">
              {footerLinks.empresa.map((link) => (
                <li key={link}>
                  <a href="#" className="footer-link">{link}</a>
                </li>
              ))}
            </ul>

            {/* Newsletter */}
            <div className="mt-8">
              <h4 className="font-display font-bold text-lg mb-4">Newsletter</h4>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Tu email"
                  className="flex-1 px-4 py-2 rounded-l-lg bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40 focus:outline-none focus:border-accent"
                />
                <button className="px-4 py-2 rounded-r-lg bg-accent text-accent-foreground hover:bg-electric-light transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-primary-foreground/10">
        <div className="container mx-auto px-4 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-primary-foreground/50">
              © 2024 Service Representaciones. Todos los derechos reservados.
            </p>

            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-primary-foreground/50 hover:text-accent transition-colors">
                Términos
              </a>
              <a href="#" className="text-sm text-primary-foreground/50 hover:text-accent transition-colors">
                Privacidad
              </a>
              <a href="#" className="text-sm text-primary-foreground/50 hover:text-accent transition-colors">
                Cookies
              </a>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              {[
                { icon: Facebook, href: '#' },
                { icon: Twitter, href: '#' },
                { icon: Linkedin, href: '#' },
                { icon: Instagram, href: '#' },
              ].map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center text-primary-foreground/70 hover:bg-accent hover:text-accent-foreground transition-all duration-300"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;