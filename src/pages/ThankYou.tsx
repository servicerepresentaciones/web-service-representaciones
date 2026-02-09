
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Home, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

const ThankYou = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50/50 via-background to-background flex flex-col">
            <Header forceDarkText={true} />

            <main className="flex-1 flex items-center justify-center p-4 pt-32 pb-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl border border-accent/10 p-8 md:p-12 text-center"
                >
                    <div className="flex justify-center mb-8">
                        <div className="relative">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
                                className="bg-green-100 text-green-600 w-24 h-24 rounded-full flex items-center justify-center"
                            >
                                <CheckCircle2 className="w-12 h-12" />
                            </motion.div>
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute -inset-2 bg-green-100 rounded-full -z-10 opacity-50"
                            />
                        </div>
                    </div>

                    <h1 className="text-4xl font-extrabold text-foreground mb-6 font-outfit tracking-tight">
                        ¡Gracias por tu mensaje!
                    </h1>

                    <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
                        Tu solicitud ha sido recibida correctamente. Nuestro equipo revisará la información y se pondrá en contacto contigo a la brevedad posible.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button
                            variant="outline"
                            size="lg"
                            className="h-14 rounded-2xl border-2 hover:bg-gray-50 flex items-center justify-center gap-2 group transition-all"
                            onClick={() => navigate("/")}
                        >
                            <Home className="w-5 h-5" />
                            Volver al Inicio
                        </Button>
                        <Button
                            size="lg"
                            className="h-14 rounded-2xl bg-accent hover:opacity-90 text-white font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            onClick={() => navigate("/productos")}
                        >
                            Ver Productos
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>

                    <div className="mt-12 pt-8 border-t border-gray-100 italic text-sm text-gray-400">
                        Si tienes una emergencia, puedes llamarnos directamente a nuestra central de atención.
                    </div>
                </motion.div>
            </main>

            <Footer />
        </div>
    );
};

export default ThankYou;
