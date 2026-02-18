import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Mail, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { useNavigate } from "react-router-dom";

interface EmailConfig {
    contact_email: string;
    complaints_email: string;
    from_email: string;
    from_name: string;
    smtp_enabled: boolean;
    smtp_host: string;
    smtp_port: number;
    smtp_username: string;
    smtp_password: string;
    smtp_secure: "ssl" | "tls" | "none";
}

const AdminEmailSettings = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);

    // Configuración inicial por defecto
    const [config, setConfig] = useState<EmailConfig>({
        contact_email: "",
        complaints_email: "",
        from_email: "noreply@servicerepresentaciones.com",
        from_name: "Service Representaciones",
        smtp_enabled: false,
        smtp_host: "",
        smtp_port: 587,
        smtp_username: "",
        smtp_password: "",
        smtp_secure: "tls"
    });

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) {
                setUser(data.session.user);
            }
        });
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('site_settings')
                .select('*')
                .single();

            if (error) throw error;

            if (data) {
                setConfig({
                    contact_email: data.contact_form_recipients || "",
                    complaints_email: data.complaints_form_recipients || "",
                    from_email: data.smtp_from_email || "noreply@servicerepresentaciones.com",
                    from_name: data.smtp_from_name || "Service Representaciones",
                    smtp_enabled: data.smtp_enabled || false,
                    smtp_host: data.smtp_host || "",
                    smtp_port: data.smtp_port || 587,
                    smtp_username: data.smtp_username || "",
                    smtp_password: data.smtp_password || "",
                    smtp_secure: data.smtp_secure || "tls"
                });
            }
        } catch (error) {
            console.error("Error cargando configuración:", error);
            toast({
                title: "Error",
                description: "No se pudo cargar la configuración de correos.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: keyof EmailConfig, value: any) => {
        setConfig(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('site_settings')
                .update({
                    contact_form_recipients: config.contact_email,
                    complaints_form_recipients: config.complaints_email,
                    smtp_from_email: config.from_email,
                    smtp_from_name: config.from_name,
                    smtp_enabled: config.smtp_enabled,
                    smtp_host: config.smtp_host,
                    smtp_port: config.smtp_port,
                    smtp_username: config.smtp_username,
                    smtp_password: config.smtp_password,
                    smtp_secure: config.smtp_secure
                })
                .eq('id', (await supabase.from('site_settings').select('id').single()).data?.id);

            if (error) throw error;

            toast({
                title: "Configuración guardada",
                description: "Los ajustes de correo han sido actualizados en la base de datos.",
            });
        } catch (error) {
            console.error("Error guardando configuración:", error);
            toast({
                title: "Error",
                description: "No se pudo guardar la configuración",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/admin');
    };

    return (
        <div className="h-screen bg-[#F5F6FA] flex overflow-hidden">
            {/* Sidebar */}
            <div className="hidden lg:block relative z-20 w-64 flex-shrink-0">
                <AdminSidebar onLogout={handleLogout} />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-screen">
                <AdminHeader userEmail={user?.email} />

                <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                    {loading ? (
                        <div className="flex items-center justify-center h-full min-h-[400px]">
                            <Loader2 className="w-8 h-8 animate-spin text-accent" />
                        </div>
                    ) : (
                        <div className="space-y-6 max-w-4xl mx-auto pb-10">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-primary/10 p-3 rounded-full">
                                    <Mail className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight">Configuración de Correos</h1>
                                    <p className="text-muted-foreground">
                                        Administra los destinatarios y el servidor de envío de correos.
                                    </p>
                                </div>
                            </div>

                            <Alert className="bg-blue-50 border-blue-200">
                                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                                <AlertTitle className="text-blue-800 font-semibold">Configuración en Base de Datos</AlertTitle>
                                <AlertDescription className="text-blue-700">
                                    Los cambios se guardan automáticamente en la base de datos.
                                    El sistema leerá esta configuración al momento de enviar correos.
                                </AlertDescription>
                            </Alert>

                            <div className="grid gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Mail className="h-5 w-5" />
                                            Correos de Destino
                                        </CardTitle>
                                        <CardDescription>
                                            Define a qué correos llegarán las notificaciones de cada formulario
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="contact_email">
                                                Correos para Formulario de Contacto *
                                            </Label>
                                            <Input
                                                id="contact_email"
                                                type="text"
                                                placeholder="contacto@tudominio.com, soporte@tudominio.com"
                                                value={config.contact_email}
                                                onChange={(e) => handleChange("contact_email", e.target.value)}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Ingresa los correos que recibirán los mensajes de contacto, separados por comas.
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="complaints_email">
                                                Correos para Libro de Reclamaciones *
                                            </Label>
                                            <Input
                                                id="complaints_email"
                                                type="text"
                                                placeholder="reclamaciones@tudominio.com, legal@tudominio.com"
                                                value={config.complaints_email}
                                                onChange={(e) => handleChange("complaints_email", e.target.value)}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Ingresa los correos que recibirán las reclamaciones, separados por comas.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Configuración del Remitente</CardTitle>
                                        <CardDescription>
                                            Cómo aparecerán los correos enviados por el sistema
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="from_name">Nombre del Remitente</Label>
                                                <Input
                                                    id="from_name"
                                                    value={config.from_name}
                                                    onChange={(e) => handleChange("from_name", e.target.value)}
                                                    placeholder="Ej: Mi Empresa"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="from_email">Correo del Remitente</Label>
                                                <Input
                                                    id="from_email"
                                                    type="email"
                                                    value={config.from_email}
                                                    onChange={(e) => handleChange("from_email", e.target.value)}
                                                    placeholder="Ej: noreply@miempresa.com"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle>Servidor SMTP (Opcional)</CardTitle>
                                                <CardDescription>
                                                    Configura un servidor SMTP para mejorar la entrega de correos
                                                </CardDescription>
                                            </div>
                                            <Switch
                                                checked={config.smtp_enabled}
                                                onCheckedChange={(checked) => handleChange("smtp_enabled", checked)}
                                            />
                                        </div>
                                    </CardHeader>
                                    {config.smtp_enabled && (
                                        <CardContent className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="smtp_host">Servidor SMTP (Host)</Label>
                                                    <Input
                                                        id="smtp_host"
                                                        value={config.smtp_host}
                                                        onChange={(e) => handleChange("smtp_host", e.target.value)}
                                                        placeholder="Ej: smtp.gmail.com"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="smtp_port">Puerto SMTP</Label>
                                                    <Input
                                                        id="smtp_port"
                                                        type="number"
                                                        value={config.smtp_port}
                                                        onChange={(e) => handleChange("smtp_port", parseInt(e.target.value))}
                                                        placeholder="Ej: 587 o 465"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="smtp_username">Usuario SMTP</Label>
                                                    <Input
                                                        id="smtp_username"
                                                        value={config.smtp_username}
                                                        onChange={(e) => handleChange("smtp_username", e.target.value)}
                                                        placeholder="Correo o usuario"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="smtp_password">Contraseña SMTP</Label>
                                                    <Input
                                                        id="smtp_password"
                                                        type="password"
                                                        value={config.smtp_password}
                                                        onChange={(e) => handleChange("smtp_password", e.target.value)}
                                                        placeholder="Contraseña o App Password"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="smtp_secure">Seguridad (Encriptación)</Label>
                                                    <Select
                                                        value={config.smtp_secure}
                                                        onValueChange={(value) => handleChange("smtp_secure", value)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="tls">TLS (Recomendado, puerto 587)</SelectItem>
                                                            <SelectItem value="ssl">SSL (Puerto 465)</SelectItem>
                                                            <SelectItem value="none">Ninguna (No recomendado)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <Alert variant="default" className="bg-yellow-50 border-yellow-200 mt-4">
                                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                                                <AlertTitle className="text-yellow-800">Nota sobre Gmail/Outlook</AlertTitle>
                                                <AlertDescription className="text-yellow-700 text-xs">
                                                    Si usas Gmail, debes usar una "Contraseña de Aplicación". Si usas cPanel, usa los datos de "Connect Devices".
                                                </AlertDescription>
                                            </Alert>
                                        </CardContent>
                                    )}
                                </Card>

                                <div className="flex justify-end gap-4">
                                    <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto min-w-[150px]">
                                        {saving ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Guardando...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Guardar Cambios
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AdminEmailSettings;
