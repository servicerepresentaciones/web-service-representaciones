import { useState, useEffect } from 'react';
import { Phone, MessageSquare, X, Headset, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useLocation } from 'react-router-dom';

interface CallCenterNumber {
    id: string;
    name: string;
    phone: string;
    type: 'call' | 'whatsapp';
    is_active: boolean;
    message?: string;
    icon_type?: 'default' | 'whatsapp_brand' | 'custom';
    custom_icon_url?: string;
}

const WhatsAppIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118 1.571-.036 1.758-.717 1.758-1.462 0-.446-.075-1.044-.223-1.455-.099-.415-.173-.742-.297-.89-.124-.149-.322-.223-.619-.372zM12 2.185C6.463 2.185 1.957 6.643 1.957 12.12c0 1.82.49 3.527 1.332 5.022L2 22l5.034-1.277c1.451.782 3.102 1.229 4.887 1.229 5.539 0 10.045-4.458 10.045-9.935S17.539 2.185 12 2.185z" />
    </svg>
);

const FloatingCallCenter = () => {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [numbers, setNumbers] = useState<CallCenterNumber[]>([]);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        fetchNumbers();
    }, []);

    const fetchNumbers = async () => {
        try {
            const { data, error } = await supabase
                .from('call_center')
                .select('*')
                .eq('is_active', true)
                .order('sort_order', { ascending: true });

            if (error) throw error;
            setNumbers(data || []);
        } catch (error) {
            console.error('Error fetching call center numbers:', error);
        }
    };

    // No mostrar en rutas de administración
    if (location.pathname.startsWith('/admin')) return null;

    if (numbers.length === 0) return null;

    const handleWhatsApp = async (phone: string, message?: string) => {
        try {
            await supabase.rpc('increment_whatsapp_click');
        } catch (error) {
            console.error('Error tracking click:', error);
        }

        const cleanPhone = phone.replace(/\D/g, '');
        let url = `https://wa.me/${cleanPhone}`;
        if (message) {
            url += `?text=${encodeURIComponent(message)}`;
        }
        window.open(url, '_blank');
    };

    const handleCall = (phone: string) => {
        window.location.href = `tel:${phone}`;
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3">
            {/* Pop-up Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20, transformOrigin: 'bottom right' }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        className="mb-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                    >
                        <div className="bg-accent p-4 text-white">
                            <h3 className="font-bold flex items-center gap-2">
                                <Headset className="w-5 h-5 text-white/80" />
                                Central de Atención
                            </h3>
                            <p className="text-[10px] text-white/70 uppercase tracking-widest mt-0.5 font-medium">Estamos listos para ayudarte</p>
                        </div>

                        <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto">
                            {numbers.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => item.type === 'whatsapp' ? handleWhatsApp(item.phone, item.message) : handleCall(item.phone)}
                                    className={cn(
                                        "w-full flex items-center gap-3 p-3 rounded-xl transition-all group",
                                        item.type === 'whatsapp'
                                            ? "bg-green-50 hover:bg-green-100 text-green-700"
                                            : "bg-blue-50 hover:bg-blue-100 text-blue-700"
                                    )}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center shadow-sm overflow-hidden flex-shrink-0",
                                        item.type === 'whatsapp' ? "bg-green-500 text-white" : "bg-blue-500 text-white",
                                        (item.icon_type === 'custom' || item.icon_type === 'whatsapp_brand') && "bg-transparent shadow-none"
                                    )}>
                                        {item.icon_type === 'custom' && item.custom_icon_url ? (
                                            <img src={item.custom_icon_url} alt="Icon" className="w-full h-full object-cover rounded-lg" />
                                        ) : item.icon_type === 'whatsapp_brand' ? (
                                            <WhatsAppIcon className="w-8 h-8 text-green-500" />
                                        ) : item.type === 'whatsapp' ? (
                                            <MessageSquare className="w-5 h-5" />
                                        ) : (
                                            <Phone className="w-5 h-5" />
                                        )}
                                    </div>
                                    <div className="text-left flex-1 min-w-0">
                                        <p className="text-[10px] font-bold uppercase tracking-tighter opacity-60">Consultar por</p>
                                        <p className="font-bold text-sm leading-tight truncate">{item.name}</p>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ChevronUp className="w-4 h-4 rotate-90" />
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="bg-gray-50 p-3 border-t border-gray-100">
                            <p className="text-[9px] text-center text-gray-400 font-medium">© Service Representaciones - Seguridad y Comunicaciones</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Floating Button */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: isVisible ? 1 : 0 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 relative",
                    isOpen
                        ? "bg-gray-800 text-white rotate-180"
                        : "bg-accent text-white"
                )}
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ opacity: 0, rotate: -90 }}
                            animate={{ opacity: 1, rotate: 0 }}
                            exit={{ opacity: 0, rotate: 90 }}
                        >
                            <X className="w-8 h-8" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="open"
                            initial={{ opacity: 0, rotate: 90 }}
                            animate={{ opacity: 1, rotate: 0 }}
                            exit={{ opacity: 0, rotate: -90 }}
                            className="relative flex items-center justify-center"
                        >
                            <Headset className="w-8 h-8" />
                            {/* Pulse effect */}
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-accent animate-pulse" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>
        </div>
    );
};

export default FloatingCallCenter;
