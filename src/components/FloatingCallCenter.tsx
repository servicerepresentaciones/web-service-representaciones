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
}

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

    const handleWhatsApp = (phone: string) => {
        const cleanPhone = phone.replace(/\D/g, '');
        window.open(`https://wa.me/${cleanPhone}`, '_blank');
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
                                    onClick={() => item.type === 'whatsapp' ? handleWhatsApp(item.phone) : handleCall(item.phone)}
                                    className={cn(
                                        "w-full flex items-center gap-3 p-3 rounded-xl transition-all group",
                                        item.type === 'whatsapp'
                                            ? "bg-green-50 hover:bg-green-100 text-green-700"
                                            : "bg-blue-50 hover:bg-blue-100 text-blue-700"
                                    )}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center shadow-sm",
                                        item.type === 'whatsapp' ? "bg-green-500 text-white" : "bg-blue-500 text-white"
                                    )}>
                                        {item.type === 'whatsapp' ? <MessageSquare className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                                    </div>
                                    <div className="text-left flex-1">
                                        <p className="text-[10px] font-bold uppercase tracking-tighter opacity-60">Consultar por</p>
                                        <p className="font-bold text-sm leading-tight">{item.name}</p>
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
