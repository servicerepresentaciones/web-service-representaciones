import { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const contactSchema = z.object({
  name: z.string().trim().min(2, { message: "El nombre debe tener al menos 2 caracteres" }).max(100),
  email: z.string().trim().email({ message: "Ingresa un email válido" }).max(255),
  phone: z.string().trim().min(8, { message: "Ingresa un teléfono válido" }).max(20).optional().or(z.literal('')),
  subject: z.string().trim().min(5, { message: "El asunto debe tener al menos 5 caracteres" }).max(200),
  message: z.string().trim().min(10, { message: "El mensaje debe tener al menos 10 caracteres" }).max(1000),
  client_type: z.enum(['natural', 'company'], { required_error: "Selecciona el tipo de cliente" }),
  ruc: z.string().trim().optional(),
  interest_type: z.enum(['product', 'service', 'both'], { required_error: "Selecciona que te interesa" }),
  items: z.array(z.object({
    product_name: z.string().optional(),
    quantity: z.coerce.number().optional()
  })).optional(),
  requested_service: z.string().trim().optional(),
  acceptance: z.boolean().refine(val => val === true, {
    message: "Debes aceptar los términos y condiciones para continuar"
  }),
}).superRefine((data, ctx) => {
  // Validate RUC for companies
  if (data.client_type === 'company') {
    if (!data.ruc || data.ruc.length < 11) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El RUC es obligatorio para empresas (11 dígitos)",
        path: ["ruc"]
      });
    }
  }

  // Validate Products if interest is product or both
  if (data.interest_type === 'product' || data.interest_type === 'both') {
    if (!data.items || data.items.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debes agregar al menos un producto",
        path: ["items"]
      });
    } else {
      data.items.forEach((item, index) => {
        if (!item.product_name || item.product_name.trim() === '') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Selecciona un producto",
            path: ["items", index, "product_name"]
          });
        }
        if (!item.quantity || item.quantity < 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Mínimo 1",
            path: ["items", index, "quantity"]
          });
        }
      });
    }
  }

  // Validate Service if interest is service or both
  if (data.interest_type === 'service' || data.interest_type === 'both') {
    if (!data.requested_service || data.requested_service.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecciona un servicio",
        path: ["requested_service"]
      });
    }
  }
});

type ContactFormData = z.infer<typeof contactSchema>;

const ContactSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
      client_type: 'natural',
      interest_type: 'product',
      ruc: '',
      items: [{ product_name: '', quantity: 1 }],
      requested_service: '',
      acceptance: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });

  const [products, setProducts] = useState<{ id: string, name: string }[]>([]);
  const [services, setServices] = useState<{ id: string, name: string }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [prodRes, servRes] = await Promise.all([
        supabase.from('products').select('id, name').order('name'),
        supabase.from('services').select('id, name').order('name')
      ]);
      if (prodRes.data) setProducts(prodRes.data);
      if (servRes.data) setServices(servRes.data);
    };
    fetchData();
  }, []);

  const clientType = form.watch('client_type');
  const interestType = form.watch('interest_type');

  const onSubmit = async (data: ContactFormData) => {
    try {
      // Preparamos los datos para una mejor visualización en el admin
      const productListText = data.items?.map(item => `${item.product_name} (Cant: ${item.quantity})`).join(', ') || '';

      const { error } = await supabase
        .from('leads')
        .insert([
          {
            full_name: data.name,
            email: data.email,
            phone: data.phone,
            subject: data.subject,
            message: data.message,
            client_type: data.client_type,
            ruc: data.ruc,
            interest_type: data.interest_type,
            requested_product: productListText, // Lo guardamos concatenado para compatibilidad
            requested_items: data.items, // Guardamos la data estructurada
            requested_service: data.requested_service,
            status: 'new'
          }
        ]);

      if (error) throw error;

      // Enviar correo mediante PHP
      try {
        await fetch('/send-email.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'contact',
            data: { ...data, logo_url: logoUrl, to_email: recipients }
          })
        });
      } catch (emailError) {
        console.error('Error enviando correo:', emailError);
        // No detenemos el flujo si falla el correo
      }

      toast({
        title: "¡Mensaje enviado!",
        description: "Nos pondremos en contacto contigo pronto.",
      });
      form.reset();
      navigate("/gracias");
    } catch (error: any) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error al enviar",
        description: "Hubo un problema al enviar tu mensaje. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const [contactSettings, setContactSettings] = useState({
    address: "Av. Tecnología 1234, Piso 5\nCiudad Empresarial, CP 12345",
    phone: "+1 (234) 567-890\n+1 (234) 567-891",
    email: "info@servicerepresentaciones.com\nventas@servicerepresentaciones.com",
    schedule: "Lunes a Viernes: 9:00 - 18:00\nSábados: 9:00 - 13:00",
    mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3762.661454815457!2d-99.16869492394828!3d19.427023981859966!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d1ff35f5bd1563%3A0x6c366f0e2de02ff7!2sPaseo%20de%20la%20Reforma%2C%20Ciudad%20de%20M%C3%A9xico%2C%20CDMX!5e0!3m2!1ses!2smx!4v1706886400000!5m2!1ses!2smx",
    responseTime: "Respuesta en 24 horas. Nos pondremos en contacto pronto.",
    title: "¿Tienes alguna pregunta?",
    subtitle: "Estamos aquí para ayudarte. Completa el formulario y nos pondremos en contacto contigo lo antes posible."
  });

  const [logoUrl, setLogoUrl] = useState<string>("");
  const [recipients, setRecipients] = useState<string>("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase.from('site_settings').select('*').single();
        if (data) {
          setLogoUrl(data.logo_url_light || data.logo_url_dark || "");
          setRecipients(data.contact_form_recipients || "");
          setContactSettings({
            address: data.contact_address || "Av. Tecnología 1234, Piso 5\nCiudad Empresarial, CP 12345",
            phone: `${data.contact_phone_1 || '+1 (234) 567-890'}\n${data.contact_phone_2 || ''}`.trim(),
            email: `${data.contact_email_1 || 'info@servicerepresentaciones.com'}\n${data.contact_email_2 || ''}`.trim(),
            schedule: `${data.contact_schedule_week || 'Lunes a Viernes: 9:00 - 18:00'}\n${data.contact_schedule_weekend || ''}`.trim(),
            mapUrl: data.contact_map_url || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3762.661454815457!2d-99.16869492394828!3d19.427023981859966!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d1ff35f5bd1563%3A0x6c366f0e2de02ff7!2sPaseo%20de%20la%20Reforma%2C%20Ciudad%20de%20M%C3%A9xico%2C%20CDMX!5e0!3m2!1ses!2smx!4v1706886400000!5m2!1ses!2smx",
            responseTime: data.contact_response_time || "Respuesta en 24 horas. Nos pondremos en contacto pronto.",
            title: data.contact_title || "¿Tienes alguna pregunta?",
            subtitle: data.contact_subtitle || "Estamos aquí para ayudarte. Completa el formulario y nos pondremos en contacto contigo lo antes posible."
          });
        }
      } catch (error) {
        console.error('Error fetching contact settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const contactInfo = [
    {
      icon: MapPin,
      title: "Dirección",
      content: contactSettings.address,
    },
    {
      icon: Phone,
      title: "Teléfono",
      content: contactSettings.phone,
    },
    {
      icon: Mail,
      title: "Email",
      content: contactSettings.email,
    },
    {
      icon: Clock,
      title: "Horario",
      content: contactSettings.schedule,
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
            {contactSettings.title}
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            {contactSettings.subtitle}
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-8 lg:mb-16">
          {/* Contact Form - Left */}
          <div className="bg-card rounded-xl p-6 md:p-8 border border-border shadow-sm">
            <h3 className="text-2xl font-bold text-foreground mb-6">
              Envíanos un mensaje
            </h3>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit, (errors) => console.log('Form errors:', errors))} className="space-y-4 md:space-y-5">
                {/* Name & Email Field - 2 Columns */}
                <div className="grid sm:grid-cols-2 gap-4">
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
                </div>

                {/* Phone & Subject Field - 2 Columns */}
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

                {/* Conditional Fields: Client Type */}
                <FormField
                  control={form.control}
                  name="client_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Tipo de Cliente *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background border-border">
                            <SelectValue placeholder="Selecciona el tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="natural">Persona Natural</SelectItem>
                          <SelectItem value="company">Empresa</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {clientType === 'company' && (
                  <FormField
                    control={form.control}
                    name="ruc"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">RUC *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Número de RUC"
                            className="bg-background border-border focus:border-accent text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                )}

                {/* Conditional Fields: Interest Type */}
                <FormField
                  control={form.control}
                  name="interest_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">¿Qué te interesa? *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background border-border">
                            <SelectValue placeholder="Selecciona una opción" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="product">Producto</SelectItem>
                          <SelectItem value="service">Servicio</SelectItem>
                          <SelectItem value="both">Ambos (Producto y Servicio)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* Conditional Dropdowns for Products/Services */}
                {(interestType === 'product' || interestType === 'both') && (
                  <div className="space-y-4 bg-secondary/20 p-4 rounded-xl border border-dashed border-border">
                    <FormLabel className="text-sm font-bold flex items-center justify-between">
                      Productos solicitados
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ product_name: '', quantity: 1 })}
                        className="h-7 text-[10px] uppercase tracking-wider"
                      >
                        <Plus className="w-3 h-3 mr-1" /> Añadir otro
                      </Button>
                    </FormLabel>

                    {fields.map((field, index) => (
                      <div key={field.id} className="flex gap-2 items-start">
                        <div className="flex-1">
                          <FormField
                            control={form.control}
                            name={`items.${index}.product_name`}
                            render={({ field }) => (
                              <FormItem className="space-y-0">
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="bg-background border-border h-10 text-sm">
                                      <SelectValue placeholder="Producto" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {products.map(p => (
                                      <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                                    ))}
                                    <SelectItem value="otros">Otros</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage className="text-[10px]" />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="w-24">
                          <FormField
                            control={form.control}
                            name={`items.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem className="space-y-0">
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="1"
                                    className="bg-background border-border h-10 text-sm"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage className="text-[10px]" />
                              </FormItem>
                            )}
                          />
                        </div>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            className="h-10 w-10 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {(interestType === 'service' || interestType === 'both') && (
                  <FormField
                    control={form.control}
                    name="requested_service"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Servicio de interés *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background border-border">
                              <SelectValue placeholder="Selecciona un servicio" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {services.map(s => (
                              <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                            ))}
                            <SelectItem value="otros">Otros</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                )}

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

                <FormField
                  control={form.control}
                  name="acceptance"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-border p-4 bg-accent/5">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="mt-1 border-accent data-[state=checked]:bg-accent"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium cursor-pointer">
                          Acepto los <Link to="/legal" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-bold">términos, condiciones y la política de privacidad</Link>
                        </FormLabel>
                        <FormMessage className="text-[10px]" />
                      </div>
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
          </div>

          {/* Contact Info - Right */}
          <div className="space-y-4">
            {/* Contact Info Cards - 2x2 Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {contactInfo.map((info, index) => (
                <div
                  key={info.title}
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
                </div>
              ))}
            </div>

            {/* Map */}
            <div
              className="rounded-lg overflow-hidden border border-border shadow-md h-[280px] bg-gray-100 relative"
            >
              {contactSettings.mapUrl.trim().startsWith('<iframe') ? (
                <div
                  className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0"
                  dangerouslySetInnerHTML={{ __html: contactSettings.mapUrl }}
                />
              ) : (
                <iframe
                  src={contactSettings.mapUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Ubicación de Service Representaciones"
                  className="absolute inset-0 w-full h-full grayscale hover:grayscale-0 transition-all duration-500"
                />
              )}
            </div>

            {/* Quick Response */}
            <div
              className="flex items-center gap-3 p-4 rounded-lg bg-accent/5 border border-accent/20"
            >
              <CheckCircle className="w-5 h-5 text-accent shrink-0" />
              <p className="text-xs md:text-sm text-foreground">
                {contactSettings.responseTime}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section >
  );
};

export default ContactSection;
