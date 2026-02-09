import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Send, CheckCircle, X, Plus, Trash2 } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

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
        product_name: z.string().min(1, "Selecciona un producto"),
        quantity: z.coerce.number().min(1, "Mínimo 1")
    })).optional(),
    requested_service: z.string().trim().optional(),
    acceptance: z.boolean().refine(val => val === true, {
        message: "Debes aceptar los términos y condiciones para continuar"
    }),
}).refine((data) => {
    if (data.client_type === 'company' && (!data.ruc || data.ruc.length < 11)) {
        return false;
    }
    return true;
}, {
    message: "El RUC es obligatorio para empresas (11 dígitos)",
    path: ["ruc"],
});

type ContactFormData = z.infer<typeof contactSchema>;

interface LeadModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: {
        product?: string;
        service?: string;
        interestType?: 'product' | 'service' | 'both';
        subject?: string;
    };
}

const LeadModal = ({ isOpen, onClose, initialData }: LeadModalProps) => {
    const { toast } = useToast();

    const form = useForm<ContactFormData>({
        resolver: zodResolver(contactSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            subject: initialData?.subject || '',
            message: '',
            client_type: 'natural',
            interest_type: initialData?.interestType || 'product',
            ruc: '',
            items: initialData?.product ? [{ product_name: initialData.product, quantity: 1 }] : [{ product_name: '', quantity: 1 }],
            requested_service: initialData?.service || '',
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
        if (isOpen) {
            const fetchData = async () => {
                const [prodRes, servRes] = await Promise.all([
                    supabase.from('products').select('id, name').order('name'),
                    supabase.from('services').select('id, name').order('name')
                ]);
                if (prodRes.data) setProducts(prodRes.data);
                if (servRes.data) setServices(servRes.data);
            };
            fetchData();

            // Re-set values when initialData changes and modal opens
            form.reset({
                name: '',
                email: '',
                phone: '',
                subject: initialData?.subject || '',
                message: '',
                client_type: 'natural',
                interest_type: initialData?.interestType || 'product',
                ruc: '',
                items: initialData?.product ? [{ product_name: initialData.product, quantity: 1 }] : [{ product_name: '', quantity: 1 }],
                requested_service: initialData?.service || '',
                acceptance: false,
            });
        }
    }, [isOpen, initialData, form]);

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

            toast({
                title: "¡Mensaje enviado!",
                description: "Nos pondremos en contacto contigo pronto.",
            });
            form.reset();
            onClose();
        } catch (error: any) {
            console.error('Error submitting form:', error);
            toast({
                title: "Error al enviar",
                description: "Hubo un problema al enviar tu mensaje. Por favor, inténtalo de nuevo.",
                variant: "destructive",
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-2xl md:rounded-3xl border-border bg-card">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-foreground">
                        {initialData?.product ? `Solicitar ${initialData.product}` : initialData?.service ? `Solicitar ${initialData.service}` : 'Solicitar Información'}
                    </DialogTitle>
                    <DialogDescription>
                        Completa el formulario y uno de nuestros asesores te contactará en breve.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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

                        <FormField
                            control={form.control}
                            name="client_type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm">Tipo de Cliente *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
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

                        <FormField
                            control={form.control}
                            name="interest_type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm">¿Qué te interesa? *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
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

                        {/* Multiple Products Section */}
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
                                        <Select onValueChange={field.onChange} value={field.value}>
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
                                            Acepto los <Link to="/legal" className="text-accent hover:underline font-bold">términos, condiciones y la política de privacidad</Link>
                                        </FormLabel>
                                        <FormMessage className="text-[10px]" />
                                    </div>
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-6 text-base"
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
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default LeadModal;
