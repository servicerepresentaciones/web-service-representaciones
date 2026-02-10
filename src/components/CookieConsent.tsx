import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { Cookie, X } from "lucide-react";

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);
    const location = useLocation();
    const isHiddenRoute = location.pathname.startsWith("/admin") || location.pathname.startsWith("/login");

    useEffect(() => {
        const consent = localStorage.getItem("cookie-consent");
        // Don't show on admin routes even if no consent
        if (!consent && !isHiddenRoute) {
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        } else if (isHiddenRoute) {
            setIsVisible(false);
        }
    }, [isHiddenRoute]);

    if (isHiddenRoute) return null;

    const handleAccept = () => {
        localStorage.setItem("cookie-consent", "true");
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="fixed bottom-6 left-0 right-0 z-[60] flex justify-center px-4 pointer-events-none"
                >
                    <div className="bg-white/95 backdrop-blur-md border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-xl p-4 flex flex-col gap-3 relative max-w-sm w-full pointer-events-auto">

                        {/* Botón Cerrar Absolute (Funciona bien aqui porque tengo padding suficiente) */}
                        <button
                            onClick={() => setIsVisible(false)}
                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors z-10"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="flex gap-3 items-start pr-6">
                            <div className="p-1.5 bg-blue-50 rounded-full shrink-0 mt-0.5">
                                <Cookie className="w-4 h-4 text-accent" />
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed font-medium">
                                Usamos cookies para mejorar tu experiencia. Al navegar aceptas nuestros <Link to="/legal" className="text-accent hover:underline font-bold" onClick={() => setIsVisible(false)}>Términos Legales</Link>.
                            </p>
                        </div>

                        <Button
                            onClick={handleAccept}
                            size="sm"
                            className="w-full h-8 text-xs font-bold bg-accent hover:bg-accent/90 shadow-sm rounded-lg"
                        >
                            Aceptar y Continuar
                        </Button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
