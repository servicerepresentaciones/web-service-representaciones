import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Send } from "lucide-react";
import deps from "@/lib/departamentos.json";
import provs from "@/lib/provincias.json";
import dists from "@/lib/distritos.json";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface UbigeoItem {
    id_ubigeo: string;
    nombre_ubigeo: string;
    codigo_ubigeo: string;
    id_padre_ubigeo?: string;
}

const departmentsData: UbigeoItem[] = deps as UbigeoItem[];
const provincesData: Record<string, UbigeoItem[]> = provs as Record<string, UbigeoItem[]>;
const districtsData: Record<string, UbigeoItem[]> = dists as Record<string, UbigeoItem[]>;

// Esquema de validación
const formSchema = z.object({
    first_name: z.string().min(2, "El nombre es obligatorio"),
    last_name_1: z.string().min(2, "El primer apellido es obligatorio"),
    last_name_2: z.string().min(2, "El segundo apellido es obligatorio"),
    document_type: z.string().min(1, "Seleccione el tipo de documento"),
    document_number: z.string().min(8, "Número de documento inválido"),
    phone: z.string().min(9, "Celular inválido"),
    department: z.string().min(1, "Seleccione el departamento"),
    province: z.string().min(1, "Seleccione la provincia"),
    district: z.string().min(1, "Seleccione el distrito"),
    address: z.string().min(5, "La dirección es obligatoria"),
    reference: z.string().optional(),
    email: z.string().email("Correo electrónico inválido"),
    is_minor: z.enum(["si", "no"]),
    claim_type: z.string().min(1, "Seleccione el tipo de reclamo"),
    consumption_type: z.string().min(1, "Seleccione el tipo de producto/servicio"),
    order_number: z.string().optional(),
    claimed_amount: z.string().optional(),
    description: z.string().min(10, "Describa el producto o servicio"),
    purchase_date: z.string().optional(),
    consumption_date_detail: z.string().optional(),
    expiry_date: z.string().optional(),
    claim_details: z.string().min(10, "El detalle es obligatorio"),
    customer_request: z.string().min(10, "El pedido es obligatorio"),
    acceptance_1: z.boolean().refine(val => val === true, "Debe aceptar la declaración jurada"),
    acceptance_2: z.boolean().refine(val => val === true, "Debe aceptar la política de privacidad"),
});

type FormValues = z.infer<typeof formSchema>;

const LibroReclamaciones = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [currentDate] = useState(new Date().toLocaleDateString('es-PE'));

    const [provinces, setProvinces] = useState<UbigeoItem[]>([]);
    const [districts, setDistricts] = useState<UbigeoItem[]>([]);
    const [logoData, setLogoData] = useState<{ url: string | null, base64: string | null }>({ url: null, base64: null });
    const [recipients, setRecipients] = useState<string>("");

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            first_name: "",
            last_name_1: "",
            last_name_2: "",
            document_type: "",
            document_number: "",
            phone: "",
            department: "",
            province: "",
            district: "",
            address: "",
            reference: "",
            email: "",
            is_minor: "no",
            claim_type: "",
            consumption_type: "",
            order_number: "",
            claimed_amount: "",
            description: "",
            purchase_date: "",
            consumption_date_detail: "",
            expiry_date: "",
            claim_details: "",
            customer_request: "",
            acceptance_1: false,
            acceptance_2: false,
        },
    });

    const selectedDept = form.watch("department");
    const selectedProv = form.watch("province");

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await supabase
                    .from('site_settings')
                    .select('logo_url_light, logo_url_dark, complaints_form_recipients')
                    .single();

                if (data) {
                    if (data.complaints_form_recipients) {
                        setRecipients(data.complaints_form_recipients);
                    }
                    const logoUrl = data.logo_url_light || data.logo_url_dark;
                    if (logoUrl) {
                        setLogoData({ url: logoUrl, base64: null });

                        try {
                            const response = await fetch(logoUrl, { method: 'GET', mode: 'cors', credentials: 'omit' });
                            if (response.ok) {
                                const blob = await response.blob();
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                    setLogoData(prev => ({ ...prev, base64: reader.result as string }));
                                };
                                reader.readAsDataURL(blob);
                            }
                        } catch (e) {
                            console.error("Error loading logo base64", e);
                        }
                    }
                }
            } catch (error) {
                console.error("Error cargando configuración:", error);
            }
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        if (selectedDept) {
            const deptObj = departmentsData.find(d => d.nombre_ubigeo === selectedDept);
            if (deptObj && provincesData[deptObj.id_ubigeo]) {
                setProvinces(provincesData[deptObj.id_ubigeo]);
            } else {
                setProvinces([]);
            }
        } else {
            setProvinces([]);
        }
        form.setValue("province", "");
        form.setValue("district", "");
    }, [selectedDept]);

    useEffect(() => {
        if (selectedProv) {
            const provObj = provinces.find(p => p.nombre_ubigeo === selectedProv);
            if (provObj && districtsData[provObj.id_ubigeo]) {
                setDistricts(districtsData[provObj.id_ubigeo]);
            } else {
                setDistricts([]);
            }
        } else {
            setDistricts([]);
        }
        form.setValue("district", "");
    }, [selectedProv]);

    const generatePDF = (values: FormValues, claimId: string) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        let yPos = 20;

        // Header
        if (logoData.base64) {
            try {
                doc.addImage(logoData.base64, 'PNG', margin, 10, 40, 15); // Adjust size as needed
            } catch (e) {
                console.error("Error añadiendo logo al PDF", e);
            }
        } else {
            doc.setFontSize(16);
            doc.text("SERVICE REPRESENTACIONES", margin, yPos);
        }

        yPos = 35;
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("HOJA DE RECLAMACIÓN", pageWidth / 2, yPos, { align: "center" });

        yPos += 7;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Fecha: ${new Date().toLocaleDateString('es-PE')}  |  N° Reclamo: ${claimId.slice(0, 8).toUpperCase()}`, pageWidth / 2, yPos, { align: "center" });

        yPos += 10;
        doc.setLineWidth(0.5);
        doc.line(margin, yPos, pageWidth - margin, yPos);

        yPos += 10;

        // Datos del Consumidor
        doc.setFont("helvetica", "bold");
        doc.text("1. IDENTIFICACIÓN DEL CONSUMIDOR RECLAMANTE", margin, yPos);
        yPos += 5;

        const consumerData = [
            ["Nombre:", `${values.first_name} ${values.last_name_1} ${values.last_name_2}`],
            ["Documento:", `${values.document_type}: ${values.document_number}`],
            ["Dirección:", `${values.address}, ${values.district}, ${values.province}, ${values.department}`],
            ["Teléfono:", values.phone],
            ["Email:", values.email],
            ["Menor de edad:", values.is_minor === "si" ? "Sí" : "No"]
        ];

        autoTable(doc, {
            startY: yPos,
            body: consumerData,
            theme: 'plain',
            styles: { fontSize: 9, cellPadding: 1 },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
            margin: { left: margin, right: margin }
        });

        // @ts-ignore
        yPos = doc.lastAutoTable.finalY + 10;

        // Detalle del Reclamo
        doc.setFont("helvetica", "bold");
        doc.text("2. IDENTIFICACIÓN DEL BIEN CONTRATADO", margin, yPos);
        yPos += 5;

        const productData = [
            ["Tipo:", values.consumption_type],
            ["Monto Reclamado:", values.claimed_amount ? `S/. ${values.claimed_amount}` : "-"],
            ["Descripción:", values.description]
        ];

        autoTable(doc, {
            startY: yPos,
            body: productData,
            theme: 'plain',
            styles: { fontSize: 9, cellPadding: 1 },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
            margin: { left: margin, right: margin }
        });

        // @ts-ignore
        yPos = doc.lastAutoTable.finalY + 10;

        // Detalle Reclamación
        doc.setFont("helvetica", "bold");
        doc.text("3. DETALLE DE LA RECLAMACIÓN Y PEDIDO DEL CONSUMIDOR", margin, yPos);
        yPos += 5;

        const claimData = [
            ["Tipo:", values.claim_type],
            ["N° Pedido:", values.order_number || "-"],
            ["Detalle:", values.claim_details],
            ["Pedido:", values.customer_request]
        ];

        autoTable(doc, {
            startY: yPos,
            body: claimData,
            theme: 'plain',
            styles: { fontSize: 9, cellPadding: 1 },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
            margin: { left: margin, right: margin }
        });

        // @ts-ignore
        yPos = doc.lastAutoTable.finalY + 20;

        // Footer Legal
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        const legalText = "La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI. El proveedor deberá dar respuesta al reclamo en un plazo no mayor a quince (15) días calendario.";
        const splitText = doc.splitTextToSize(legalText, pageWidth - (margin * 2));
        doc.text(splitText, margin, yPos);

        return doc.output('datauristring').split(',')[1]; // Retornar solo base64 puro
    };

    const onSubmit = async (values: FormValues) => {
        setLoading(true);
        try {
            // Guardar en Supabase primero para obtener ID si es posible, o usar el generado
            // Aquí generamos ID simple para el PDF antes de insertar
            const tempId = Math.random().toString(36).substring(2, 10);

            const { data: insertedData, error } = await supabase.from("complaints").insert([
                {
                    first_name: values.first_name,
                    last_name_1: values.last_name_1,
                    last_name_2: values.last_name_2,
                    document_type: values.document_type,
                    document_number: values.document_number,
                    phone: values.phone,
                    department: values.department,
                    province: values.province,
                    district: values.district,
                    address: values.address,
                    reference: values.reference,
                    email: values.email,
                    is_minor: values.is_minor === "si",
                    claim_type: values.claim_type,
                    consumption_type: values.consumption_type,
                    order_number: values.order_number,
                    claimed_amount: values.claimed_amount ? parseFloat(values.claimed_amount) : null,
                    description: values.description,
                    purchase_date: values.purchase_date || null,
                    consumption_date_detail: values.consumption_date_detail || null,
                    expiry_date: values.expiry_date || null,
                    claim_details: values.claim_details,
                    customer_request: values.customer_request,
                    status: "pendiente",
                },
            ]).select();

            if (error) throw error;

            // Usar el ID real si está disponible
            const realId = insertedData && insertedData[0] ? insertedData[0].id : tempId;

            // Generar PDF
            let pdfBase64 = "";
            try {
                pdfBase64 = generatePDF(values, String(realId));
            } catch (pdfError) {
                console.error("Error generando PDF:", pdfError);
            }

            // Enviar correo mediante PHP
            try {
                await fetch('/send-email.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        type: 'complaint',
                        data: {
                            ...values,
                            pdf_base64: pdfBase64,
                            logo_url: logoData.url,
                            to_email: recipients
                        }
                    })
                });
            } catch (emailError) {
                console.error('Error enviando correo:', emailError);
                // No detenemos el flujo si falla el correo
            }

            toast({
                title: "Reclamo enviado correctamente",
                description: "Tu reclamo ha sido registrado. Nos pondremos en contacto pronto.",
            });
            form.reset();
            navigate("/gracias");
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Error al enviar",
                description: "Ocurrió un error al procesar tu solicitud. Por favor intenta de nuevo.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50/50 via-background to-background">
            <Header forceDarkText={true} />
            <main className="container mx-auto px-4 py-12 pt-32">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-10">
                        <h1 className="text-4xl font-bold text-foreground mb-4 font-outfit">Libro de Reclamaciones</h1>
                        <p className="text-muted-foreground">
                            De acuerdo con lo establecido en el Código de Protección y Defensa del Consumidor,
                            ponemos a tu disposición nuestro Libro de Reclamaciones Virtual.
                        </p>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            {/* Sección 1: Identificación del consumidor */}
                            <Card className="border-accent/20 overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                                <CardContent className="pt-8 px-8 pb-10">
                                    <h2 className="text-2xl font-bold text-accent mb-8 flex items-center gap-3">
                                        <div className="bg-accent text-white w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-md">1</div>
                                        Identificación del consumidor reclamante
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="first_name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-semibold">Nombre *</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Nombre" className="h-11" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="last_name_1"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-semibold">Primer apellido *</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Primer apellido" className="h-11" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="last_name_2"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-semibold">Segundo apellido *</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Segundo apellido" className="h-11" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="document_type"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-semibold">Tipo de documentación *</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-11">
                                                                <SelectValue placeholder="Selección" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="DNI">DNI</SelectItem>
                                                            <SelectItem value="CE">Carnet de Extranjería</SelectItem>
                                                            <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="document_number"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-semibold">Número de documentación *</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Número" className="h-11" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="phone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-semibold">Celular *</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Celular" className="h-11" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="department"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-semibold">Departamento *</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-11">
                                                                <SelectValue placeholder="Seleccionar" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {departmentsData.map(d => (
                                                                <SelectItem key={d.codigo_ubigeo} value={d.nombre_ubigeo}>{d.nombre_ubigeo}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="province"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-semibold">Provincia *</FormLabel>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                        disabled={!selectedDept}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger className="h-11">
                                                                <SelectValue placeholder="Provincia" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {provinces.map(p => (
                                                                <SelectItem key={p.codigo_ubigeo} value={p.nombre_ubigeo}>{p.nombre_ubigeo}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="district"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-semibold">Distrito *</FormLabel>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                        disabled={!selectedProv}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger className="h-11">
                                                                <SelectValue placeholder="Distrito" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {districts.map(d => (
                                                                <SelectItem key={d.codigo_ubigeo} value={d.nombre_ubigeo}>{d.nombre_ubigeo}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="md:col-span-2">
                                            <FormField
                                                control={form.control}
                                                name="address"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-semibold">Dirección *</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Dirección" className="h-11" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name="reference"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-semibold">Referencia</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Referencia" className="h-11" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="md:col-span-2">
                                            <FormField
                                                control={form.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-semibold">Correo electrónico *</FormLabel>
                                                        <FormControl>
                                                            <Input type="email" placeholder="Correo electrónico" className="h-11" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="is_minor"
                                            render={({ field }) => (
                                                <FormItem className="space-y-3">
                                                    <FormLabel className="font-semibold">¿Eres menor de edad?</FormLabel>
                                                    <FormControl>
                                                        <RadioGroup
                                                            onValueChange={field.onChange}
                                                            defaultValue={field.value}
                                                            className="flex gap-4"
                                                        >
                                                            <FormItem className="flex items-center space-x-2 space-y-0">
                                                                <FormControl>
                                                                    <RadioGroupItem value="si" />
                                                                </FormControl>
                                                                <FormLabel className="font-normal text-sm">Si</FormLabel>
                                                            </FormItem>
                                                            <FormItem className="flex items-center space-x-2 space-y-0">
                                                                <FormControl>
                                                                    <RadioGroupItem value="no" />
                                                                </FormControl>
                                                                <FormLabel className="font-normal text-sm">No</FormLabel>
                                                            </FormItem>
                                                        </RadioGroup>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Sección 2: Detalle del reclamo */}
                            <Card className="border-accent/20 overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                                <CardContent className="pt-8 px-8 pb-10">
                                    <h2 className="text-2xl font-bold text-accent mb-8 flex items-center gap-3">
                                        <div className="bg-accent text-white w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-md">2</div>
                                        Detalle del reclamo y orden del consumidor
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="claim_type"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-semibold">Tipo de reclamo *</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-11">
                                                                <SelectValue placeholder="Tipo de reclamo" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="Reclamación">Reclamación</SelectItem>
                                                            <SelectItem value="Queja">Queja</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="consumption_type"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-semibold">Tipo de consumo *</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-11">
                                                                <SelectValue placeholder="Tipo de consumo" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="Producto">Bien / Producto</SelectItem>
                                                            <SelectItem value="Servicio">Servicio</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="order_number"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-semibold">N° de pedido *</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="N° Pedido" className="h-11" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormItem>
                                            <FormLabel className="font-semibold text-gray-400">Fecha de reclamación / queja</FormLabel>
                                            <FormControl>
                                                <Input value={currentDate} disabled className="bg-muted h-11" />
                                            </FormControl>
                                        </FormItem>
                                        <FormItem>
                                            <FormLabel className="font-semibold text-gray-400">Proveedor</FormLabel>
                                            <FormControl>
                                                <Input value="SERVICE REPRESENTACIONES" disabled className="bg-muted h-11" />
                                            </FormControl>
                                        </FormItem>
                                        <FormField
                                            control={form.control}
                                            name="claimed_amount"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-semibold">Monto reclamado (S/.)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="0.01" placeholder="Monto" className="h-11" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="md:col-span-3">
                                            <FormField
                                                control={form.control}
                                                name="description"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-semibold">Descripción del producto o servicio *</FormLabel>
                                                        <FormControl>
                                                            <Textarea placeholder="Describa el producto o servicio" className="min-h-[80px]" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="purchase_date"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-semibold">Fecha de compra</FormLabel>
                                                    <FormControl>
                                                        <Input type="date" className="h-11" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="consumption_date_detail"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-semibold">Fecha de consumo</FormLabel>
                                                    <FormControl>
                                                        <Input type="date" className="h-11" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="expiry_date"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-semibold">Fecha de caducidad</FormLabel>
                                                    <FormControl>
                                                        <Input type="date" className="h-11" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="md:col-span-3">
                                            <FormField
                                                control={form.control}
                                                name="claim_details"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-semibold">Detalle de la Reclamación / Queja, según lo indicado por el cliente: *</FormLabel>
                                                        <FormControl>
                                                            <Textarea placeholder="Detalle del reclamo" className="min-h-[120px]" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="md:col-span-3">
                                            <FormField
                                                control={form.control}
                                                name="customer_request"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-semibold">Pedido del Cliente: *</FormLabel>
                                                        <FormControl>
                                                            <Textarea placeholder="Pedido del cliente" className="min-h-[120px]" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-10 space-y-4 text-xs text-muted-foreground bg-gray-50 p-6 rounded-xl border border-gray-100 shadow-inner">
                                        <p><strong>(1) Reclamación:</strong> Desacuerdo relacionado con productos y / o servicios.</p>
                                        <p><strong>(2) Queja:</strong> Desacuerdo no relacionado con productos y / o servicios; o malestar o insatisfacción con la atención al público.</p>
                                        <Separator className="my-3" />
                                        <ul className="list-disc list-inside space-y-2">
                                            <li>La formulación del reclamo no excluye el recurso a otros medios de resolución de controversias ni es un requisito previo para presentar una denuncia ante el Indecopi.</li>
                                            <li>El proveedor debe responder a la reclamación en un plazo no superior a quince (15) días naturales, pudiendo ampliar el plazo hasta quince días.</li>
                                        </ul>
                                    </div>

                                    <div className="mt-10 space-y-5">
                                        <FormField
                                            control={form.control}
                                            name="acceptance_1"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                            className="mt-1"
                                                        />
                                                    </FormControl>
                                                    <div className="space-y-1 leading-none">
                                                        <FormLabel className="text-sm font-medium leading-relaxed cursor-pointer">
                                                            Declaro que soy el dueño del servicio y acepto el contenido de este formulario al declarar bajo Declaración Jurada la veracidad de los hechos descritos.
                                                        </FormLabel>
                                                        <FormMessage />
                                                    </div>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="acceptance_2"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                            className="mt-1"
                                                        />
                                                    </FormControl>
                                                    <div className="space-y-1 leading-none">
                                                        <FormLabel className="text-sm font-medium leading-relaxed cursor-pointer">
                                                            He leído y acepto la Política de privacidad y seguridad y la Política de cookies.
                                                        </FormLabel>
                                                        <FormMessage />
                                                    </div>
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="mt-12 flex justify-center">
                                        <Button
                                            type="submit"
                                            size="lg"
                                            className="w-full md:w-80 bg-accent hover:opacity-90 text-white font-bold h-14 rounded-full text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                                                    Enviando...
                                                </>
                                            ) : (
                                                <>
                                                    Enviar Reclamo
                                                    <Send className="w-5 h-5 ml-3" />
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </form>
                    </Form>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default LibroReclamaciones;
