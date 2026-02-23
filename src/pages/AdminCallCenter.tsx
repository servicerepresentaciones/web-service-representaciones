import { useState, useEffect, useRef } from 'react';
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
    MoveDown,
    Image as ImageIcon,
    Upload,
    X
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
    message?: string;
    icon_type?: 'default' | 'whatsapp_brand' | 'custom';
    custom_icon_url?: string;
}

const WhatsAppIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118 1.571-.036 1.758-.717 1.758-1.462 0-.446-.075-1.044-.223-1.455-.099-.415-.173-.742-.297-.89-.124-.149-.322-.223-.619-.372zM12 2.185C6.463 2.185 1.957 6.643 1.957 12.12c0 1.82.49 3.527 1.332 5.022L2 22l5.034-1.277c1.451.782 3.102 1.229 4.887 1.229 5.539 0 10.045-4.458 10.045-9.935S17.539 2.185 12 2.185z" />
    </svg>
);

const AdminCallCenter = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [numbers, setNumbers] = useState<CallCenterNumber[]>([]);
    const [logoUrl, setLogoUrl] = useState<string>('');
    const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

    const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

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
            sort_order: numbers.length > 0 ? Math.max(...numbers.map(n => n.sort_order)) + 1 : 0,
            message: '',
            icon_type: 'default'
        };
        setNumbers([...numbers, newNumber]);
    };

    const moveNumber = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === numbers.length - 1) return;

        const newList = [...numbers];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        const temp = newList[index];
        newList[index] = newList[targetIndex];
        newList[targetIndex] = temp;

        const updatedList = newList.map((item, i) => ({
            ...item,
            sort_order: i
        }));

        setNumbers(updatedList);
    };

    const deleteOldIcon = async (url: string) => {
        if (!url) return;
        try {
            const pathParts = url.split('/site-assets/');
            if (pathParts.length < 2) return;
            const filePath = pathParts[1].split('?')[0];

            const { error } = await supabase.storage
                .from('site-assets')
                .remove([filePath]);

            if (error) console.error('Error deleting old icon:', error);
        } catch (error) {
            console.error('Error parsing/deleting old icon:', error);
        }
    };

    const removeNumber = async (id: string, index: number) => {
        // Delete icon if custom
        const number = numbers[index];
        if (number.icon_type === 'custom' && number.custom_icon_url) {
            await deleteOldIcon(number.custom_icon_url);
        }

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

    const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast({ title: "Error", description: "La imagen debe ser menor a 2MB", variant: "destructive" });
            return;
        }

        setUploadingIndex(index);
        try {
            // Delete old icon if exists
            const currentUrl = numbers[index].custom_icon_url;
            if (currentUrl) {
                await deleteOldIcon(currentUrl);
            }

            const numberId = numbers[index].id;
            const fileExt = file.name.split('.').pop();
            const fileName = `call-center/${numberId}-${Date.now()}.${fileExt}`; // Added timestamp to avoid caching issues

            const { error: uploadError } = await supabase.storage
                .from('site-assets')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('site-assets')
                .getPublicUrl(fileName);

            const finalUrl = `${publicUrl}?t=${Date.now()}`;
            updateNumber(index, 'custom_icon_url', finalUrl);
            toast({ title: "Icono subido correctamente" });
        } catch (error: any) {
            toast({ title: "Error al subir", description: error.message, variant: "destructive" });
        } finally {
            setUploadingIndex(null);
            if (fileInputRefs.current[index]) {
                fileInputRefs.current[index]!.value = ''; // Reset input
            }
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const finalNumbers = numbers.map((n, i) => ({
                id: n.id,
                name: n.name,
                phone: n.phone,
                type: n.type,
                is_active: n.is_active,
                sort_order: i,
                message: n.message,
                icon_type: n.icon_type,
                custom_icon_url: n.custom_icon_url
            }));

            const { error } = await supabase
                .from('call_center')
                .upsert(finalNumbers);

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

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        );
    }

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

                        <div className="space-y-6">
                            {numbers.map((item, index) => (
                                <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative group transition-all hover:shadow-md">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        {/* Drag Handle & Icon Preview */}
                                        <div className="flex flex-col gap-4 items-center border-r pr-6 border-gray-100">
                                            <div className="flex flex-col gap-1">
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

                                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner overflow-hidden ${item.type === 'whatsapp' ? 'bg-green-50' : 'bg-blue-50'}`}>
                                                {item.icon_type === 'custom' && item.custom_icon_url ? (
                                                    <img src={item.custom_icon_url} alt="Icon" className="w-full h-full object-cover" />
                                                ) : item.icon_type === 'whatsapp_brand' ? (
                                                    <WhatsAppIcon className="w-10 h-10 text-green-500" />
                                                ) : item.type === 'whatsapp' ? (
                                                    <MessageSquare className="w-8 h-8 text-green-500" />
                                                ) : (
                                                    <Phone className="w-8 h-8 text-blue-500" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Main Fields */}
                                        <div className="flex-1 space-y-6">
                                            <div className="grid md:grid-cols-3 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Etiqueta</label>
                                                    <Input
                                                        value={item.name}
                                                        onChange={(e) => updateNumber(index, 'name', e.target.value)}
                                                        placeholder="Ej: Ventas Corporativas"
                                                        className="bg-gray-50 border-gray-100 h-10"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Número</label>
                                                    <Input
                                                        value={item.phone}
                                                        onChange={(e) => updateNumber(index, 'phone', e.target.value)}
                                                        placeholder="+51 998 042 768"
                                                        className="bg-gray-50 border-gray-100 h-10"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Canal</label>
                                                    <Select
                                                        value={item.type}
                                                        onValueChange={(value) => updateNumber(index, 'type', value)}
                                                    >
                                                        <SelectTrigger className="bg-gray-50 border-gray-100 h-10">
                                                            <SelectValue placeholder="Seleccionar tipo" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                                            <SelectItem value="call">Llamada Telefónica</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            {/* Advanced Options Breakdown */}
                                            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                                                <div className="grid md:grid-cols-2 gap-6">
                                                    {/* Custom Icon Selection */}
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Estilo del Icono</label>
                                                        <div className="flex gap-2">
                                                            <Select
                                                                value={item.icon_type || 'default'}
                                                                onValueChange={(value) => updateNumber(index, 'icon_type', value)}
                                                            >
                                                                <SelectTrigger className="bg-white border-gray-200 h-10">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="default">Icono Clásico</SelectItem>
                                                                    {item.type === 'whatsapp' && (
                                                                        <SelectItem value="whatsapp_brand">Logo Oficial WhatsApp</SelectItem>
                                                                    )}
                                                                    <SelectItem value="custom">Logo Personalizado</SelectItem>
                                                                </SelectContent>
                                                            </Select>

                                                            {item.icon_type === 'custom' && (
                                                                <>
                                                                    <input
                                                                        type="file"
                                                                        hidden
                                                                        ref={el => fileInputRefs.current[index] = el}
                                                                        accept="image/*"
                                                                        onChange={(e) => handleIconUpload(e, index)}
                                                                    />
                                                                    <Button
                                                                        variant="outline"
                                                                        size="icon"
                                                                        className="flex-shrink-0 bg-white"
                                                                        onClick={() => fileInputRefs.current[index]?.click()}
                                                                        disabled={uploadingIndex === index}
                                                                    >
                                                                        {uploadingIndex === index ? (
                                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                                        ) : (
                                                                            <Upload className="w-4 h-4" />
                                                                        )}
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* WhatsApp Specific Message */}
                                                    {item.type === 'whatsapp' && (
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Mensaje Predeterminado</label>
                                                            <Input
                                                                value={item.message || ''}
                                                                onChange={(e) => updateNumber(index, 'message', e.target.value)}
                                                                placeholder="Hola, me gustaría consultar sobre..."
                                                                className="bg-white border-gray-200 h-10 text-sm"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col items-center justify-between border-l pl-6 border-gray-100">
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
                                                className="text-red-400 hover:text-red-600 hover:bg-red-50 h-10 w-10 rounded-xl"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </Button>
                                        </div>
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
                                <h4 className="font-bold text-blue-900 mb-1">Información</h4>
                                <p className="text-sm text-blue-800/70 leading-relaxed">
                                    Utiliza el "Logo Oficial WhatsApp" para mayor reconocimiento de marca, o sube tu propio icono personalizado (PNG/JPG).
                                    <br />
                                    El mensaje predeterminado aparecerá escrito automáticamente en el chat del usuario cuando haga clic.
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
