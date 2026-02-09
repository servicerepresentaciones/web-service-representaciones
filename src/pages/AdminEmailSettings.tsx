import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, Mail, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

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
    smtp_secure: string;
}

const AdminEmailSettings = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [config, setConfig] = useState<EmailConfig>({
        contact_email: "info@servicerepresentaciones.com",
        complaints_email: "reclamaciones@servicerepresentaciones.com",
        from_email: "noreply@servicerepresentaciones.com",
        from_name: "Service Representaciones",
        smtp_enabled: false,
        smtp_host: "",
        smtp_port: 587,
        smtp_username: "",
        smtp_password: "",
        smtp_secure: "tls",
    });

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) {
                setUser(data.session.user);
            }
        });
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const response = await fetch("/email-config.json");
            if (response.ok) {
                const data = await response.json();
                setConfig(data);
            }
        } catch (error) {
            console.error("Error cargando configuración:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Crear el contenido del archivo
            const configContent = JSON.stringify(config, null, 2);

            // Crear un blob y descargarlo
            const blob = new Blob([configContent], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "email-config.json";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast({
                title: "Configuración guardada",
                description: "El archivo email-config.json ha sido descargado. Súbelo a la carpeta raíz de tu hosting (donde está send-email.php).",
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

    const handleChange = (field: keyof EmailConfig, value: any) => {
        setConfig((prev) => ({ ...prev, [field]: value }));
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
                        <div className="max-w-4xl mx-auto space-y-6">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                    Configuración de Correos y Notificaciones
                                </h1>
                                <p className="text-muted-foreground">
                                    Configura los correos electrónicos donde llegarán las notificaciones de los formularios
                                </p>
                            </div>

                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    <strong>Importante:</strong> Después de guardar la configuración, descarga el archivo{" "}
                                    <code className="bg-muted px-1 py-0.5 rounded">email-config.json</code> y súbelo a la
                                    carpeta raíz de tu hosting cPanel (donde está el archivo{" "}
                                    <code className="bg-muted px-1 py-0.5 rounded">send-email.php</code>).
                                </AlertDescription>
                            </Alert>

                            {/* Correos de Destino */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Mail className="w-5 h-5" />
                                        Correos de Destino
                                    </CardTitle>
                                    <CardDescription>
                                        Define a qué correos llegarán las notificaciones de cada formulario
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="contact_email">
                                            Correo para Formulario de Contacto *
                                        </Label>
                                        <Input
                                            id="contact_email"
                                            type="email"
                                            placeholder="contacto@tudominio.com"
                                            value={config.contact_email}
                                            onChange={(e) => handleChange("contact_email", e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Los mensajes del formulario de contacto llegarán a este correo
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="complaints_email">
                                            Correo para Libro de Reclamaciones *
                                        </Label>
                                        <Input
                                            id="complaints_email"
                                            type="email"
                                            placeholder="reclamaciones@tudominio.com"
                                            value={config.complaints_email}
                                            onChange={(e) => handleChange("complaints_email", e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Las reclamaciones y quejas llegarán a este correo
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Configuración del Remitente */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Configuración del Remitente</CardTitle>
                                    <CardDescription>
                                        Personaliza cómo aparecerán los correos enviados
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="from_name">Nombre del Remitente *</Label>
                                        <Input
                                            id="from_name"
                                            placeholder="Service Representaciones"
                                            value={config.from_name}
                                            onChange={(e) => handleChange("from_name", e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="from_email">Email del Remitente *</Label>
                                        <Input
                                            id="from_email"
                                            type="email"
                                            placeholder="noreply@tudominio.com"
                                            value={config.from_email}
                                            onChange={(e) => handleChange("from_email", e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Este correo aparecerá como remitente de las notificaciones
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Configuración SMTP */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Configuración SMTP (Opcional)</CardTitle>
                                    <CardDescription>
                                        Usa un servidor SMTP personalizado para mayor confiabilidad en el envío
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="smtp_enabled">Habilitar SMTP</Label>
                                            <p className="text-xs text-muted-foreground">
                                                Requiere PHPMailer instalado en el servidor
                                            </p>
                                        </div>
                                        <Switch
                                            id="smtp_enabled"
                                            checked={config.smtp_enabled}
                                            onCheckedChange={(checked) => handleChange("smtp_enabled", checked)}
                                        />
                                    </div>

                                    {config.smtp_enabled && (
                                        <>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="smtp_host">Host SMTP *</Label>
                                                    <Input
                                                        id="smtp_host"
                                                        placeholder="smtp.gmail.com"
                                                        value={config.smtp_host}
                                                        onChange={(e) => handleChange("smtp_host", e.target.value)}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="smtp_port">Puerto *</Label>
                                                    <Input
                                                        id="smtp_port"
                                                        type="number"
                                                        placeholder="587"
                                                        value={config.smtp_port}
                                                        onChange={(e) => handleChange("smtp_port", parseInt(e.target.value) || 0)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="smtp_secure">Seguridad</Label>
                                                <Select
                                                    value={config.smtp_secure}
                                                    onValueChange={(value) => handleChange("smtp_secure", value)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="tls">TLS</SelectItem>
                                                        <SelectItem value="ssl">SSL</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="smtp_username">Usuario SMTP *</Label>
                                                <Input
                                                    id="smtp_username"
                                                    placeholder="tu@email.com"
                                                    value={config.smtp_username}
                                                    onChange={(e) => handleChange("smtp_username", e.target.value)}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="smtp_password">Contraseña SMTP *</Label>
                                                <Input
                                                    id="smtp_password"
                                                    type="password"
                                                    placeholder="••••••••"
                                                    value={config.smtp_password}
                                                    onChange={(e) => handleChange("smtp_password", e.target.value)}
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Para Gmail, usa una "Contraseña de aplicación" en lugar de tu contraseña normal
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Información Adicional */}
                            <Alert>
                                <CheckCircle2 className="h-4 w-4" />
                                <AlertDescription>
                                    <strong>Nota:</strong> Si no habilitas SMTP, el sistema usará la función{" "}
                                    <code className="bg-muted px-1 py-0.5 rounded">mail()</code> de PHP nativa de tu
                                    servidor. Asegúrate de que tu hosting tenga configurado el envío de correos.
                                </AlertDescription>
                            </Alert>

                            {/* Botón Guardar */}
                            <div className="flex justify-end">
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    size="lg"
                                    className="bg-accent hover:bg-accent/90"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Guardar Configuración
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AdminEmailSettings;
