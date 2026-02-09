import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Package, Layers, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
    const [query, setQuery] = useState('');
    const navigate = useNavigate();

    // Bloquear scroll del body cuando el modal está abierto
    useEffect(() => {
        if (isOpen) {
            const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.overflow = 'hidden';
            if (scrollBarWidth > 0) {
                document.body.style.paddingRight = `${scrollBarWidth}px`;
            }
        } else {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }
        return () => {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        };
    }, [isOpen]);

    // Cerrar con tecla ESC
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const [results, setResults] = useState<{ productos: any[], servicios: any[] }>({
        productos: [],
        servicios: []
    });
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        if (query.trim().length === 0) {
            setResults({ productos: [], servicios: [] });
            return;
        }

        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const [prodRes, servRes] = await Promise.all([
                    supabase.from('products').select('id, name, slug, categories(name)').ilike('name', `%${query}%`).limit(5),
                    supabase.from('services').select('id, name, slug, description').ilike('name', `%${query}%`).limit(5)
                ]);

                setResults({
                    productos: prodRes.data || [],
                    servicios: servRes.data || []
                });
            } catch (error) {
                console.error('Error searching:', error);
            } finally {
                setSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-black/40 backdrop-blur-[8px]"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{
                            type: "spring",
                            damping: 25,
                            stiffness: 300
                        }}
                        className="w-full max-w-2xl bg-card border border-border shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] rounded-3xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Search Input Area */}
                        <div className="relative p-6 border-b border-border bg-secondary/10">
                            <Search className="absolute left-10 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="¿Qué estás buscando? (productos, servicios...)"
                                className="w-full pl-14 pr-12 py-3 bg-transparent text-xl font-medium text-foreground focus:outline-none placeholder:text-muted-foreground/50"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            {searching && (
                                <div className="absolute right-20 top-1/2 -translate-y-1/2">
                                    <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                            <button
                                onClick={onClose}
                                className="absolute right-8 top-1/2 -translate-y-1/2 p-2 hover:bg-secondary rounded-full transition-colors group"
                            >
                                <X className="w-6 h-6 text-muted-foreground group-hover:text-foreground" />
                            </button>
                        </div>

                        {/* Results Area */}
                        <div className="max-h-[60vh] overflow-y-auto p-8 space-y-10 custom-scrollbar bg-card">
                            {query.length > 0 ? (
                                <>
                                    {/* Productos Section */}
                                    {results.productos.length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-6 text-accent font-bold uppercase text-[10px] tracking-widest">
                                                <Package className="w-4 h-4" />
                                                Productos Sugeridos
                                            </div>
                                            <div className="space-y-3">
                                                {results.productos.map((item) => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => {
                                                            navigate(`/productos/${item.slug}`);
                                                            onClose();
                                                        }}
                                                        className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-accent/5 border border-transparent hover:border-accent/10 transition-all group"
                                                    >
                                                        <div className="text-left">
                                                            <p className="font-bold text-foreground group-hover:text-accent transition-colors">{item.name}</p>
                                                            <p className="text-sm text-muted-foreground">{item.categories?.name}</p>
                                                        </div>
                                                        <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-accent" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Servicios Section */}
                                    {results.servicios.length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-6 text-purple-600 font-bold uppercase text-[10px] tracking-widest">
                                                <Layers className="w-4 h-4" />
                                                Servicios Especializados
                                            </div>
                                            <div className="space-y-3">
                                                {results.servicios.map((item) => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => {
                                                            navigate(`/servicios/${item.slug}`);
                                                            onClose();
                                                        }}
                                                        className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-purple-500/5 border border-transparent hover:border-purple-500/10 transition-all group"
                                                    >
                                                        <div className="text-left">
                                                            <p className="font-bold text-foreground group-hover:text-purple-600 transition-colors">{item.name}</p>
                                                            <p className="text-sm text-muted-foreground truncate max-w-sm">{item.description}</p>
                                                        </div>
                                                        <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-purple-600" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {results.productos.length === 0 && results.servicios.length === 0 && !searching && (
                                        <div className="text-center py-10 text-muted-foreground italic">
                                            No se encontraron resultados para "{query}"
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-20">
                                    <div className="inline-flex p-6 bg-secondary/30 rounded-full mb-6">
                                        <Search className="w-10 h-10 text-muted-foreground/30" />
                                    </div>
                                    <p className="text-lg text-muted-foreground font-medium">Comienza a escribir para buscar</p>
                                    <p className="text-sm text-muted-foreground/60 mt-2">Busca por nombre de producto, servicio o categoría.</p>
                                </div>
                            )}
                        </div>

                        {/* Footer Area */}
                        <div className="px-8 py-5 bg-secondary/10 border-t border-border flex justify-between items-center text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                            <div className="flex items-center gap-6">
                                <span className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                    Búsqueda Activa
                                </span>
                            </div>
                            <div className="flex gap-4">
                                <span className="flex items-center gap-2">
                                    <kbd className="px-2 py-1 bg-background rounded border border-border text-[9px] font-sans">ESC</kbd>
                                    Cerrar
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default SearchModal;
