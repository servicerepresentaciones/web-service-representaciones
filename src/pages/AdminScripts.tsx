import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Save,
    Loader2,
    Code,
    Plus,
    Trash2,
    Edit2,
    Terminal,
    BookOpen,
    Layout,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Search
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import PageLoading from '@/components/PageLoading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface CustomScript {
    id: string;
    name: string;
    description: string;
    content: string;
    location: 'head' | 'body_start' | 'body_end';
    is_active: boolean;
    created_at: string;
}

const locationLabels = {
    head: { label: 'Header (<head>)', icon: Terminal, color: 'text-green-500', bg: 'bg-green-50' },
    body_start: { label: 'Inicio Body (<body>)', icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-50' },
    body_end: { label: 'Footer (</body>)', icon: Layout, color: 'text-purple-500', bg: 'bg-purple-50' },
};

const AdminScripts = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [logoUrl, setLogoUrl] = useState<string>('');
    const [scripts, setScripts] = useState<CustomScript[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentScript, setCurrentScript] = useState<Partial<CustomScript>>({
        name: '',
        description: '',
        content: '',
        location: 'head',
        is_active: true
    });

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) {
                setUser(data.session.user);
            }
        });
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [scriptsRes, settingsRes] = await Promise.all([
                supabase.from('custom_scripts').select('*').order('created_at', { ascending: false }),
                supabase.from('site_settings').select('logo_url_dark').single()
            ]);

            if (scriptsRes.error) {
                // Si la tabla no existe, mostraremos un aviso amigable
                if (scriptsRes.error.code === 'PGRST116' || scriptsRes.error.message.includes('relation "public.custom_scripts" does not exist')) {
                    console.error('Table custom_scripts does not exist');
                } else {
                    throw scriptsRes.error;
                }
            }

            setScripts(scriptsRes.data || []);
            if (settingsRes.data?.logo_url_dark) setLogoUrl(settingsRes.data.logo_url_dark);

        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!currentScript.name || !currentScript.content) {
            toast({ title: "Campos requeridos", description: "El nombre y el contenido del script son obligatorios.", variant: "destructive" });
            return;
        }

        setSaving(true);
        try {
            if (currentScript.id) {
                // Update
                const { error } = await supabase
                    .from('custom_scripts')
                    .update({
                        name: currentScript.name,
                        description: currentScript.description,
                        content: currentScript.content,
                        location: currentScript.location,
                        is_active: currentScript.is_active,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', currentScript.id);
                if (error) throw error;
                toast({ title: "Script actualizado" });
            } else {
                // Create
                const { error } = await supabase
                    .from('custom_scripts')
                    .insert([currentScript]);
                if (error) throw error;
                toast({ title: "Script creado" });
            }
            setIsDialogOpen(false);
            fetchData();
        } catch (error: any) {
            toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este script?')) return;

        try {
            const { error } = await supabase.from('custom_scripts').delete().eq('id', id);
            if (error) throw error;
            toast({ title: "Script eliminado" });
            setScripts(scripts.filter(s => s.id !== id));
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const toggleStatus = async (script: CustomScript) => {
        try {
            const { error } = await supabase
                .from('custom_scripts')
                .update({ is_active: !script.is_active })
                .eq('id', script.id);
            if (error) throw error;
            setScripts(scripts.map(s => s.id === script.id ? { ...s, is_active: !s.is_active } : s));
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const openEditDialog = (script: CustomScript) => {
        setCurrentScript(script);
        setIsDialogOpen(true);
    };

    const openCreateDialog = () => {
        setCurrentScript({
            name: '',
            description: '',
            content: '',
            location: 'head',
            is_active: true
        });
        setIsDialogOpen(true);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/admin');
    };

    if (loading) return <PageLoading logoUrl={logoUrl} />;

    const filteredScripts = scripts.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#F5F6FA] flex">
            <div className="hidden lg:block relative z-20">
                <AdminSidebar onLogout={handleLogout} />
            </div>

            <div className="flex-1 flex flex-col min-w-0">
                <AdminHeader userEmail={user?.email} />

                <main className="p-4 lg:p-8 overflow-y-auto max-h-[calc(100vh-80px)]">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <div>
                                <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                                    <Code className="w-8 h-8 text-accent" /> Scripts y Píxeles
                                </h2>
                                <p className="text-gray-500 mt-2">Gestiona códigos de seguimiento de forma modular y segura.</p>
                            </div>
                            <Button onClick={openCreateDialog} className="bg-accent hover:bg-accent/90 text-white gap-2 shadow-lg shadow-accent/20">
                                <Plus className="w-4 h-4" /> Añadir Nuevo Script
                            </Button>
                        </div>

                        {/* Buscador */}
                        <div className="relative mb-6">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                placeholder="Buscar scripts por nombre o descripción..."
                                className="pl-12 bg-white border-none shadow-sm h-12 rounded-xl"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Listado de Scripts */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredScripts.length === 0 ? (
                                <div className="col-span-full bg-white p-12 rounded-2xl border border-dashed border-gray-200 text-center flex flex-col items-center">
                                    <Terminal className="w-12 h-12 text-gray-200 mb-4" />
                                    <h3 className="font-bold text-gray-700">No hay scripts configurados</h3>
                                    <p className="text-gray-400 mt-2">Haz clic en "Añadir Nuevo Script" para empezar a rastrear eventos.</p>
                                </div>
                            ) : (
                                filteredScripts.map((script) => {
                                    const loc = locationLabels[script.location];
                                    return (
                                        <Card key={script.id} className="border-none shadow-sm rounded-2xl overflow-hidden group hover:shadow-md transition-all">
                                            <CardHeader className="bg-white border-b border-gray-50 pb-4">
                                                <div className="flex items-start justify-between">
                                                    <div className={`p-2 rounded-lg ${loc.bg} ${loc.color}`}>
                                                        <loc.icon className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Switch
                                                            checked={script.is_active}
                                                            onCheckedChange={() => toggleStatus(script)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="mt-4">
                                                    <CardTitle className="text-lg flex items-center gap-2">
                                                        {script.name}
                                                        {!script.is_active && (
                                                            <Badge variant="outline" className="text-[10px] uppercase text-gray-400 border-gray-200">Inactivo</Badge>
                                                        )}
                                                    </CardTitle>
                                                    <CardDescription className="line-clamp-2 mt-1 min-h-[40px]">
                                                        {script.description || 'Sin descripción'}
                                                    </CardDescription>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-4 bg-gray-50/50 flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                    Ubicación: {loc.label.split(' ')[0]}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(script)} className="h-8 w-8 text-gray-400 hover:text-accent hover:bg-white transition-all">
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(script.id)} className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-white transition-all">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* Modal de Creación/Edición */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            {currentScript.id ? 'Editar Script' : 'Nuevo Script de Seguimiento'}
                        </DialogTitle>
                        <DialogDescription>
                            Configura el código que se inyectará en tu sitio web.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Nombre del Script</Label>
                                <Input
                                    placeholder="Ej: Google Analytics 4"
                                    value={currentScript.name}
                                    onChange={(e) => setCurrentScript({ ...currentScript, name: e.target.value })}
                                    className="bg-gray-50 border-none h-12 rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Ubicación</Label>
                                <Select
                                    value={currentScript.location}
                                    onValueChange={(val: any) => setCurrentScript({ ...currentScript, location: val })}
                                >
                                    <SelectTrigger className="bg-gray-50 border-none h-12 rounded-xl">
                                        <SelectValue placeholder="Selecciona ubicación" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="head">Header (Antes de &lt;/head&gt;)</SelectItem>
                                        <SelectItem value="body_start">Inicio Body (Después de &lt;body&gt;)</SelectItem>
                                        <SelectItem value="body_end">Footer (Antes de &lt;/body&gt;)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Descripción (Opcional)</Label>
                            <Input
                                placeholder="Para qué sirve este script..."
                                value={currentScript.description}
                                onChange={(e) => setCurrentScript({ ...currentScript, description: e.target.value })}
                                className="bg-gray-50 border-none h-12 rounded-xl"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Código del Script</Label>
                                {currentScript.is_active ?
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-green-500 uppercase"><CheckCircle2 className="w-3 h-3" /> Activo</span> :
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase"><XCircle className="w-3 h-3" /> Inactivo</span>
                                }
                            </div>
                            <Textarea
                                placeholder="<!-- Pega aquí el código <script>...</script> -->"
                                value={currentScript.content}
                                onChange={(e) => setCurrentScript({ ...currentScript, content: e.target.value })}
                                className="font-mono text-sm min-h-[250px] bg-gray-900 text-green-400 border-none rounded-xl p-6"
                            />
                            <p className="text-[10px] text-gray-400 italic">Recuerda incluir las etiquetas &lt;script&gt; o &lt;noscript&gt; si el código las requiere.</p>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 mt-4 border-t pt-6 border-gray-100">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl h-12 px-8">
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-accent hover:bg-accent/90 text-white rounded-xl h-12 px-8 shadow-lg shadow-accent/20"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            {currentScript.id ? 'Guardar Cambios' : 'Crear Script'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminScripts;
