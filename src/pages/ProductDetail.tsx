import { useParams, Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import ProductsCarousel from '@/components/ProductsCarousel';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Download, MessageSquare, ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const ProductDetail = () => {
    const { id } = useParams();
    const [activeImage, setActiveImage] = useState(0);
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchProduct = async () => {
            if (!id) return;
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*, categories(name), brands(name)')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                setProduct(data);
                document.title = `${data.name} | Service Representaciones`;
            } catch (error) {
                console.error('Error fetching product:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-accent" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <h2 className="text-2xl font-bold mb-4">Producto no encontrado</h2>
                <Link to="/productos">
                    <Button variant="outline">Volver a Productos</Button>
                </Link>
            </div>
        );
    }

    const allImages = [product.main_image_url, ...(product.images || [])].filter(Boolean);

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <PageHero
                title={product.name}
                subtitle={`Explora los detalles técnicos de nuestra solución en ${product.categories?.name || 'su categoría'}`}
                backgroundImage={product.main_image_url}
            />

            <main className="pb-16">
                <div className="container mx-auto px-4 lg:px-8">
                    {/* Back Button */}
                    <div className="py-8">
                        <Link to="/productos" className="inline-flex items-center text-sm text-muted-foreground hover:text-accent transition-colors">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Volver a Productos
                        </Link>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12 mb-24">
                        {/* Product Images Section */}
                        <div className="space-y-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="aspect-square bg-white rounded-2xl flex items-center justify-center border border-border overflow-hidden"
                            >
                                {allImages.length > 0 ? (
                                    <img
                                        src={allImages[activeImage]}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="text-[150px] opacity-20">📦</div>
                                )}
                            </motion.div>

                            <div className="grid grid-cols-4 gap-4">
                                {allImages.map((img, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setActiveImage(index)}
                                        className={`aspect-square rounded-xl border-2 transition-all flex items-center justify-center overflow-hidden bg-white hover:bg-secondary ${activeImage === index ? 'border-accent shadow-lg scale-105' : 'border-border'
                                            }`}
                                    >
                                        <img src={img} alt={`${product.name} gallery ${index}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Product Info Section */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex flex-col"
                        >
                            <div className="mb-6">
                                <span className="text-accent font-semibold tracking-wider uppercase text-sm">{product.categories?.name}</span>
                                <h1 className="text-4xl md:text-5xl font-bold mt-2 mb-4 text-foreground">{product.name}</h1>
                            </div>

                            <p className="text-lg text-muted-foreground mb-8 leading-relaxed whitespace-pre-line">
                                {product.description}
                            </p>

                            {/* Specifications Table (Mini) */}
                            {product.specifications && product.specifications.length > 0 && (
                                <div className="bg-card border border-border rounded-xl p-6 mb-8">
                                    <h3 className="font-bold mb-4 text-foreground">Especificaciones clave</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {product.specifications.map((spec: any, i: number) => (
                                            <div key={i} className="flex flex-col border-b border-border/50 pb-2">
                                                <span className="text-xs text-muted-foreground uppercase">{spec.label}</span>
                                                <span className="text-sm font-medium">{spec.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 mt-auto">
                                <Button className="flex-1 h-14 bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-lg gap-2 shadow-lg shadow-accent/20">
                                    <MessageSquare className="w-5 h-5" />
                                    Solicitar Ahora
                                </Button>
                                {product.datasheet_url && (
                                    <a href={product.datasheet_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                                        <Button variant="outline" className="w-full h-14 border-accent text-accent hover:bg-accent/5 font-bold text-lg gap-2">
                                            <Download className="w-5 h-5" />
                                            Descargar Ficha Técnica
                                        </Button>
                                    </a>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Related Products Section */}
                    <div className="mt-24">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-3xl font-bold">Productos Relacionados</h2>
                            <div className="h-1 flex-1 mx-8 bg-gradient-to-r from-accent/20 to-transparent rounded-full hidden md:block"></div>
                        </div>
                        <ProductsCarousel filterCategoryId={product.category_id} excludeProductId={product.id} />
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ProductDetail;
