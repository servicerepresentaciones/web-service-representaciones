import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Save,
    Loader2,
    Plus,
    Trash2,
    MoveUp,
    MoveDown,
    Share2,
    Settings2,
    Facebook,
    Twitter,
    Linkedin,
    Instagram,
    Youtube,
    Github,
    Trello,
    Chrome,
    Globe,
    Music2,
    Video,
    Send,
    MessageSquare
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';

interface SocialLink {
    icon: string;
    url: string;
    label: string;
}

const AVAILABLE_ICONS = [
    { id: 'facebook', icon: Facebook, name: 'Facebook' },
    { id: 'instagram', icon: Instagram, name: 'Instagram' },
    { id: 'linkedin', icon: Linkedin, name: 'LinkedIn' },
    { id: 'twitter', icon: Twitter, name: 'Twitter / X' },
    { id: 'youtube', icon: Youtube, name: 'YouTube' },
    { id: 'music-2', icon: Music2, name: 'TikTok' },
    { id: 'github', icon: Github, name: 'GitHub' },
    { id: 'send', icon: Send, name: 'Telegram' },
    { id: 'message-square', icon: MessageSquare, name: 'WhatsApp' },
    { id: 'globe', icon: Globe, name: 'Sitio Web' },
    { id: 'video', icon: Video, name: 'Vimeo' },
    { id: 'chrome', icon: Chrome, name: 'Google' },
];

const IconRenderer = ({ iconId, className }: { iconId: string, className?: string }) => {
    const iconObj = AVAILABLE_ICONS.find(i => i.id === iconId);
    if (iconObj) {
        const Icon = iconObj.icon;
        return <Icon className={className} />;
    }
    return <Globe className={className} />;
};

const AdminSocial = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [settingsId, setSettingsId] = useState('');
    const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) {
                setUser(data.session.user);
            }
        });
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('site_settings')
                .select('id, social_links')
                .single();

            if (error) throw error;
            if (data) {
                setSettingsId(data.id);
                setSocialLinks(Array.isArray(data.social_links) ? data.social_links : []);
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('site_settings')
                .update({
                    social_links: socialLinks,
                    updated_at: new Date().toISOString()
                })
                .eq('id', settingsId);

            if (error) throw error;

            toast({
                title: 'Redes sociales guardadas',
                description: 'La lista de redes sociales se ha actualizado correctamente.',
            });
        } catch (error: any) {
            toast({
                title: 'Error al ahorrar',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const addLink = () => {
        const newLink: SocialLink = {
            icon: 'globe',
            url: '',
            label: 'Nueva Red Social'
        };
        setSocialLinks([...socialLinks, newLink]);
    };

    const removeLink = (index: number) => {
        const newList = [...socialLinks];
        newList.splice(index, 1);
        setSocialLinks(newList);
    };

    const updateLink = (index: number, field: keyof SocialLink, value: string) => {
        const newList = [...socialLinks];
        newList[index] = { ...newList[index], [field]: value };
        setSocialLinks(newList);
    };

    const moveLink = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === socialLinks.length - 1) return;

        const newList = [...socialLinks];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
        setSocialLinks(newList);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/admin');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-accent animate-spin" />
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
                                    <Share2 className="w-8 h-8 text-accent" /> Gestión de Redes Sociales
                                </h2>
                                <p className="text-gray-500 mt-2">Crea, edita y organiza los iconos sociales que aparecen en el footer.</p>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    onClick={addLink}
                                    variant="outline"
                                    className="gap-2 border-accent text-accent hover:bg-accent hover:text-white"
                                >
                                    <Plus className="w-4 h-4" /> Añadir Red Social
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
                            {socialLinks.map((link, index) => (
                                <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 items-center">
                                    <div className="flex items-center gap-2">
                                        <div className="flex flex-col gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-gray-400 hover:text-accent"
                                                onClick={() => moveLink(index, 'up')}
                                                disabled={index === 0}
                                            >
                                                <MoveUp className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-gray-400 hover:text-accent"
                                                onClick={() => moveLink(index, 'down')}
                                                disabled={index === socialLinks.length - 1}
                                            >
                                                <MoveDown className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" className="h-16 w-16 p-0 rounded-xl flex flex-col gap-1 hover:border-accent hover:bg-accent/5">
                                                    <IconRenderer iconId={link.icon} className="w-6 h-6 text-accent" />
                                                    <span className="text-[10px] text-gray-400">Cambiar</span>
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-2xl">
                                                <DialogHeader>
                                                    <DialogTitle>Selecciona un Icono</DialogTitle>
                                                </DialogHeader>
                                                <div className="grid grid-cols-4 md:grid-cols-6 gap-4 p-4">
                                                    {AVAILABLE_ICONS.map((icon) => (
                                                        <button
                                                            key={icon.id}
                                                            onClick={() => updateLink(index, 'icon', icon.id)}
                                                            className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${link.icon === icon.id
                                                                    ? 'bg-accent text-white shadow-lg'
                                                                    : 'bg-gray-50 text-gray-600 hover:bg-accent/10 hover:text-accent'
                                                                }`}
                                                        >
                                                            <icon.icon className="w-6 h-6" />
                                                            <span className="text-[10px] text-center font-medium">{icon.name}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>

                                    <div className="flex-1 grid md:grid-cols-2 gap-4 w-full">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Etiqueta</label>
                                            <Input
                                                value={link.label}
                                                onChange={(e) => updateLink(index, 'label', e.target.value)}
                                                placeholder="Ej: Siguenos en Facebook"
                                                className="bg-gray-50 border-none h-11"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">URL / Enlace</label>
                                            <Input
                                                value={link.url}
                                                onChange={(e) => updateLink(index, 'url', e.target.value)}
                                                placeholder="https://..."
                                                className="bg-gray-50 border-none h-11"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 md:pt-0">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeLink(index)}
                                            className="text-red-400 hover:text-red-600 hover:bg-red-50 h-11 w-11 rounded-xl"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}

                            {socialLinks.length === 0 && (
                                <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-gray-100 text-center">
                                    <Share2 className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                    <p className="text-gray-500 font-medium">No has configurado ninguna red social aún.</p>
                                    <Button onClick={addLink} className="mt-4 bg-accent hover:bg-accent/90">
                                        Comenzar a Añadir
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="mt-12 p-6 bg-accent/5 rounded-2xl border border-accent/10">
                            <h4 className="font-bold text-accent mb-2 flex items-center gap-2">
                                <Settings2 className="w-5 h-5" /> Guía de configuración
                            </h4>
                            <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
                                <li>Usa las flechas para cambiar el orden en que aparecerán los iconos en el footer.</li>
                                <li>Haz clic en el icono actual para abrir el selector y elegir otro diferente.</li>
                                <li>La etiqueta es interna para organización, la URL debe ser el enlace completo (ej: https://facebook.com/tupagina).</li>
                                <li>No olvides hacer clic en <strong>Guardar Cambios</strong> antes de salir.</li>
                            </ul>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminSocial;
