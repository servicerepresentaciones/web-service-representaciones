import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

const contactSchema = z.object({
  name: z.string().trim().min(2, { message: "El nombre debe tener al menos 2 caracteres" }).max(100),
  email: z.string().trim().email({ message: "Ingresa un email válido" }).max(255),
  phone: z.string().trim().min(8, { message: "Ingresa un teléfono válido" }).max(20).optional().or(z.literal('')),
  subject: z.string().trim().min(5, { message: "El asunto debe tener al menos 5 caracteres" }).max(200),
  message: z.string().trim().min(10, { message: "El mensaje debe tener al menos 10 caracteres" }).max(1000),
});

type ContactFormData = z.infer<typeof contactSchema>;

const ContactSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const { toast } = useToast();

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
    },
  });

  const onSubmit = (data: ContactFormData) => {
    console.log('Form submitted:', data);
    toast({
      title: "¡Mensaje enviado!",
      description: "Nos pondremos en contacto contigo pronto.",
    });
    form.reset();
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: "Dirección",
      content: "Av. Tecnología 1234, Piso 5\nCiudad Empresarial, CP 12345",
    },
    {
      icon: Phone,
      title: "Teléfono",
      content: "+1 (234) 567-890\n+1 (234) 567-891",
    },
    {
      icon: Mail,
      title: "Email",
      content: "info@servicerepresentaciones.com\nventas@servicerepresentaciones.com",
    },
    {
      icon: Clock,
      title: "Horario",
      content: "Lunes a Viernes: 9:00 - 18:00\nSábados: 9:00 - 13:00",
    },
  ];

  return (
    <section ref={containerRef} id="contacto" className="py-16 lg:py-24 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 lg:mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3">
            ¿Tienes alguna pregunta?
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Estamos aquí para ayudarte. Completa el formulario y nos pondremos en contacto contigo lo antes posible.
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-8 lg:mb-16">
          {/* Contact Form - Left */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-card rounded-xl p-6 md:p-8 border border-border"
          >
            <h3 className="text-2xl font-bold text-foreground mb-6">
              Envíanos un mensaje
            </h3>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-5">
                {/* Name Field */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Nombre completo *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Tu nombre" 
                          className="bg-background border-border focus:border-accent text-sm"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* Email Field */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Email *</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="tu@email.com" 
                          className="bg-background border-border focus:border-accent text-sm"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* Phone & Subject in row */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Teléfono</FormLabel>
                        <FormControl>
                          <Input 
                            type="tel"
                            placeholder="+1 234 567 890" 
                            className="bg-background border-border focus:border-accent text-sm"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Asunto *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Asunto" 
                            className="bg-background border-border focus:border-accent text-sm"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Message Field */}
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Mensaje *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Escribe tu mensaje aquí..."
                          className="bg-background border-border focus:border-accent min-h-[100px] resize-none text-sm"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-5 text-sm"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <>Enviando...</>
                  ) : (
                    <>
                      Enviar Mensaje
                      <Send className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Al enviar este formulario, aceptas nuestra política de privacidad.
                </p>
              </form>
            </Form>
          </motion.div>

          {/* Contact Info - Right */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-4"
          >
            {/* Contact Info Cards - 2x2 Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {contactInfo.map((info, index) => (
                <motion.div
                  key={info.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                  className="bg-card rounded-lg p-4 border border-border hover:border-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <info.icon className="w-5 h-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-foreground">{info.title}</h4>
                      <p className="text-xs text-muted-foreground whitespace-pre-line mt-1">{info.content}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Map */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="rounded-lg overflow-hidden border border-border shadow-md h-[280px]"
            >
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3762.661454815457!2d-99.16869492394828!3d19.427023981859966!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d1ff35f5bd1563%3A0x6c366f0e2de02ff7!2sPaseo%20de%20la%20Reforma%2C%20Ciudad%20de%20M%C3%A9xico%2C%20CDMX!5e0!3m2!1ses!2smx!4v1706886400000!5m2!1ses!2smx"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación de Service Representaciones"
                className="grayscale hover:grayscale-0 transition-all duration-500"
              />
            </motion.div>

            {/* Quick Response */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.9 }}
              className="flex items-center gap-3 p-4 rounded-lg bg-accent/5 border border-accent/20"
            >
              <CheckCircle className="w-5 h-5 text-accent shrink-0" />
              <p className="text-xs md:text-sm text-foreground">
                <span className="font-semibold">Respuesta en 24 horas.</span> Nos pondremos en contacto pronto.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
