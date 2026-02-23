
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Home, ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const ThankYou = () => {
    const navigate = useNavigate();
    const [callCenterPhone, setCallCenterPhone] = useState<string>("+51 987 654 321");

    useEffect(() => {
        const fetchCallCenterPhone = async () => {
            try {
                const { data, error } = await supabase
                    .from('call_center')
                    .select('phone')
                    .eq('type', 'call')
                    .eq('is_active', true)
                    .order('sort_order', { ascending: true })
                    .limit(1)
                    .single();

                if (data?.phone) {
                    setCallCenterPhone(data.phone);
                } else {
                    // Fallback to site_settings contact_phone_1 if no specific call center number is found
                    const { data: settingsData } = await supabase
                        .from('site_settings')
                        .select('contact_phone_1')
                        .single();

                    if (settingsData?.contact_phone_1) {
                        setCallCenterPhone(settingsData.contact_phone_1);
                    }
                }
            } catch (error) {
                console.error('Error fetching call center phone:', error);
            }
        };

        fetchCallCenterPhone();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
            <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-blue-100/40 via-transparent to-transparent pointer-events-none" />

            <Header forceDarkText={true} />

            <main className="flex-1 flex items-center justify-center p-4 pt-32 pb-20 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="max-w-2xl w-full bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/50 p-8 md:p-14 text-center relative overflow-hidden"
                >
                    {/* Decorative blurred blobs */}
                    <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl" />

                    <div className="flex justify-center mb-10 relative">
                        <div className="relative">
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                                className="bg-gradient-to-tr from-green-500 to-emerald-400 text-white w-28 h-28 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 z-10 relative"
                            >
                                <CheckCircle2 className="w-14 h-14" />
                            </motion.div>
                            <motion.div
                                animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                                className="absolute inset-0 bg-green-400 rounded-full blur-md -z-10"
                            />
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", delay: 0.5 }}
                                className="absolute inset-2 bg-emerald-300 rounded-full blur-sm -z-10"
                            />
                        </div>
                    </div>

                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-4xl md:text-5xl font-black text-slate-800 mb-6 font-outfit tracking-tight"
                    >
                        ¡Gracias!
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-lg md:text-xl text-slate-600 mb-12 leading-relaxed max-w-lg mx-auto"
                    >
                        Hemos recibido tu mensaje correctamente. Nuestro equipo revisará tu solicitud y te contactará en breve.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                        <Button
                            variant="outline"
                            size="lg"
                            className="h-14 rounded-xl border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-medium text-base shadow-sm hover:shadow transition-all group"
                            onClick={() => navigate("/")}
                        >
                            <Home className="w-5 h-5 mr-2 group-hover:-translate-y-0.5 transition-transform" />
                            Volver al Inicio
                        </Button>
                        <Button
                            size="lg"
                            className="h-14 rounded-xl bg-accent hover:bg-accent/90 text-white font-bold text-base shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/30 hover:-translate-y-0.5 transition-all group"
                            onClick={() => navigate("/productos")}
                        >
                            <ShoppingBag className="w-5 h-5 mr-2" />
                            Ver Catálogo
                            <ArrowRight className="w-5 h-5 ml-1 opacity-70 group-hover:translate-x-1 group-hover:opacity-100 transition-all" />
                        </Button>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="mt-12 pt-8 border-t border-slate-100/80"
                    >
                        <p className="text-sm text-slate-400 font-medium">
                            ¿Necesitas ayuda urgente? <a href={`tel:${callCenterPhone.replace(/\s+/g, '')}`} className="text-accent hover:underline font-bold">Llámanos ahora</a>
                        </p>
                    </motion.div>
                </motion.div>
            </main>

            <Footer />
        </div>
    );
};

export default ThankYou;
