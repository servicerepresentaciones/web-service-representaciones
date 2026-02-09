import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Phone,
    MessageSquare,
    Plus,
    Trash2,
    Save,
    Loader2,
    Shield,
    ToggleLeft,
    ToggleRight,
    Headset,
    MoveUp,
    MoveDown
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import PageLoading from '@/components/PageLoading';

interface CallCenterNumber {
    id: string;
    name: string;
    phone: string;
    type: 'call' | 'whatsapp';
    is_active: boolean;
    sort_order: number;
}

const AdminCallCenter = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [numbers, setNumbers] = useState<CallCenterNumber[]>([]);
    const [logoUrl, setLogoUrl] = useState<string>('');

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) {
                setUser(data.session.user);
            }
        });
        fetchNumbers();
        fetchLogo();
    }, []);

    const fetchLogo = async () => {
        try {
            const { data } = await supabase.from('site_settings').select('logo_url_dark').single();
            if (data?.logo_url_dark) setLogoUrl(data.logo_url_dark);
        } catch (error) {
            console.error('Error fetching logo:', error);
        }
    };

    const fetchNumbers = async () => {
        try {
            const { data, error } = await supabase
                .from('call_center')
                .select('*')
                .order('sort_order', { ascending: true });

            if (error) throw error;
            setNumbers(data || []);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const addNumber = () => {
        const newNumber: CallCenterNumber = {
            id: crypto.randomUUID(),
            name: '',
            phone: '',
            type: 'whatsapp',
            is_active: true,
            sort_order: numbers.length > 0 ? Math.max(...numbers.map(n => n.sort_order)) + 1 : 0
        };
        setNumbers([...numbers, newNumber]);
    };

    const moveNumber = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === numbers.length - 1) return;

        const newList = [...numbers];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        // Swap elements
        const temp = newList[index];
        newList[index] = newList[targetIndex];
        newList[targetIndex] = temp;

        // Update sort_order based on new array order
        const updatedList = newList.map((item, i) => ({
            ...item,
            sort_order: i
        }));

        setNumbers(updatedList);
    };

    const removeNumber = async (id: string, index: number) => {
        if (id.length > 36 || !id.includes('-')) {
            const newList = [...numbers];
            newList.splice(index, 1);
            setNumbers(newList);
            return;
        }

        try {
            const { error } = await supabase
                .from('call_center')
                .delete()
                .eq('id', id);

            if (error) throw error;

            const newList = [...numbers];
            newList.splice(index, 1);
            setNumbers(newList);
            toast({ title: "Número eliminado" });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const updateNumber = (index: number, field: keyof CallCenterNumber, value: any) => {
        const newList = [...numbers];
        newList[index] = { ...newList[index], [field]: value };
        setNumbers(newList);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Re-order everything before saving to ensure sequential order
            const finalNumbers = numbers.map((n, i) => ({
                ...n,
                sort_order: i
            }));

            const { error } = await supabase
                .from('call_center')
                .upsert(finalNumbers.map(({ id, ...rest }) => {
                    if (id.includes('-') && id.length >= 36) {
                        return { id, ...rest };
                    }
                    return rest;
                }));

            if (error) throw error;

            toast({ title: "Cambios guardados", description: "El centro de llamadas se ha actualizado." });
            fetchNumbers();
        } catch (error: any) {
            toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/admin');
    };

    if (loading) return <PageLoading logoUrl={logoUrl} />;

    return (
        <div className="min-h-screen bg-[#F5F6FA] flex">
            <div className="hidden lg:block relative z-20">
                <AdminSidebar onLogout={handleLogout} />
            </div>

            <div className="flex-1 flex flex-col min-w-0">
                <AdminHeader userEmail={user?.email} />

                <main className="p-4 lg:p-8 overflow-y-auto max-h-[calc(100vh-80px)]">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                                    <Headset className="w-8 h-8 text-accent" /> Gestión de Call Center
                                </h2>
                                <p className="text-gray-500 mt-2">Configura los botones flotantes de WhatsApp y Llamadas que verán tus clientes.</p>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    onClick={addNumber}
                                    variant="outline"
                                    className="gap-2 border-accent text-accent hover:bg-accent hover:text-white"
                                >
                                    <Plus className="w-4 h-4" /> Añadir Número
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-accent hover:bg-accent/90 text-white gap-2 shadow-lg shadow-accent/20"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Guardar Cambios
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {numbers.map((item, index) => (
                                <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 items-center">
                                    <div className="flex flex-col gap-1 pr-2 border-r border-gray-100">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-gray-400 hover:text-accent"
                                            onClick={() => moveNumber(index, 'up')}
                                            disabled={index === 0}
                                        >
                                            <MoveUp className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-gray-400 hover:text-accent"
                                            onClick={() => moveNumber(index, 'down')}
                                            disabled={index === numbers.length - 1}
                                        >
                                            <MoveDown className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.type === 'whatsapp' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {item.type === 'whatsapp' ? <MessageSquare className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
                                        </div>
                                    </div>

                                    <div className="flex-1 grid md:grid-cols-3 gap-4 w-full">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Etiqueta / Nombre</label>
                                            <Input
                                                value={item.name}
                                                onChange={(e) => updateNumber(index, 'name', e.target.value)}
                                                placeholder="Ej: Ventas Corporativas"
                                                className="bg-gray-50 border-none h-11"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Número</label>
                                            <Input
                                                value={item.phone}
                                                onChange={(e) => updateNumber(index, 'phone', e.target.value)}
                                                placeholder="+51 987 654 321"
                                                className="bg-gray-50 border-none h-11"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Tipo de Canal</label>
                                            <Select
                                                value={item.type}
                                                onValueChange={(value) => updateNumber(index, 'type', value)}
                                            >
                                                <SelectTrigger className="bg-gray-50 border-none h-11">
                                                    <SelectValue placeholder="Seleccionar tipo" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                                    <SelectItem value="call">Llamada Telefónica</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 pt-4 md:pt-0">
                                        <div className="flex flex-col items-center gap-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Estado</label>
                                            <Switch
                                                checked={item.is_active}
                                                onCheckedChange={(checked) => updateNumber(index, 'is_active', checked)}
                                                className="data-[state=checked]:bg-green-500"
                                            />
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeNumber(item.id, index)}
                                            className="text-red-400 hover:text-red-600 hover:bg-red-50 h-11 w-11 rounded-xl mt-4"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}

                            {numbers.length === 0 && (
                                <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-gray-100 text-center">
                                    <Headset className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                    <p className="text-gray-500 font-medium">No has configurado ningún número para el Call Center.</p>
                                    <Button onClick={addNumber} className="mt-4 bg-accent hover:bg-accent/90">
                                        Empezar ahora
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="mt-12 p-6 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-4">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <Shield className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-blue-900 mb-1">Información de privacidad</h4>
                                <p className="text-sm text-blue-800/70 leading-relaxed">
                                    Los números marcados como <strong>activos</strong> aparecerán automáticamente en el widget flotante del sitio web.
                                    Asegúrate de incluir el código de país (ej. +51 para Perú) en los números de WhatsApp para que funcionen correctamente.
                                </p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminCallCenter;
