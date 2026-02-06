import { useParams, Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import ProductsCarousel from '@/components/ProductsCarousel';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Download, ShoppingCart, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';

const ProductDetail = () => {
    const { id } = useParams();
    const [activeImage, setActiveImage] = useState(0);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    // Datos simulados (esto vendrá de Supabase después)
    const product = {
        id: id,
        nombre: 'Cámara Domo HD 2MP',
        descripcion: 'Esta cámara domo de alta definición proporciona una vigilancia excepcional tanto de día como de noche. Con una resolución de 2MP y visión nocturna avanzada, es perfecta para oficinas, almacenes y áreas residenciales. Su diseño discreto y resistente a la intemperie garantiza durabilidad y seguridad constante.',
        fichaTecnica: '#',
        imagenes: [
            '📷', // Principal
            '🎥', // Galería 1
            '📹', // Galería 2
            '📸', // Galería 3
        ],
        categoria: 'Domo',
        especificaciones: [
            { label: 'Resolución', value: '1920 x 1080 (2MP)' },
            { label: 'Sensor', value: 'CMOS de 1/2.8"' },
            { label: 'Lente', value: '2.8mm fijo' },
            { label: 'Visión Nocturna', value: 'Hasta 30 metros' },
            { label: 'Protección', value: 'IP67 / IK10' },
        ]
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <PageHero
                title={product.nombre}
                subtitle={`Explora los detalles técnicos de nuestra solución en ${product.categoria}`}
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
                                className="aspect-square bg-secondary rounded-2xl flex items-center justify-center text-[150px] border border-border overflow-hidden"
                            >
                                {product.imagenes[activeImage]}
                            </motion.div>

                            <div className="grid grid-cols-4 gap-4">
                                {product.imagenes.map((img, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setActiveImage(index)}
                                        className={`aspect-square rounded-xl border-2 transition-all flex items-center justify-center text-4xl bg-card hover:bg-secondary ${activeImage === index ? 'border-accent shadow-lg scale-105' : 'border-border'
                                            }`}
                                    >
                                        {img}
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
                                <span className="text-accent font-semibold tracking-wider uppercase text-sm">{product.categoria}</span>
                                <h1 className="text-4xl md:text-5xl font-bold mt-2 mb-4 text-foreground">{product.nombre}</h1>
                            </div>

                            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                                {product.descripcion}
                            </p>

                            {/* Specifications Table (Mini) */}
                            <div className="bg-card border border-border rounded-xl p-6 mb-8">
                                <h3 className="font-bold mb-4 text-foreground">Especificaciones clave</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {product.especificaciones.map((spec, i) => (
                                        <div key={i} className="flex flex-col border-b border-border/50 pb-2">
                                            <span className="text-xs text-muted-foreground uppercase">{spec.label}</span>
                                            <span className="text-sm font-medium">{spec.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 mt-auto">
                                <Button className="flex-1 h-14 bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-lg gap-2 shadow-lg shadow-accent/20">
                                    <ShoppingCart className="w-5 h-5" />
                                    Solicitar Ahora
                                </Button>
                                <Button variant="outline" className="flex-1 h-14 border-accent text-accent hover:bg-accent/5 font-bold text-lg gap-2">
                                    <Download className="w-5 h-5" />
                                    Descargar Ficha Técnica
                                </Button>
                            </div>
                        </motion.div>
                    </div>

                    {/* Related Products Section */}
                    <div className="mt-24">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-3xl font-bold">Productos Relacionados</h2>
                            <div className="h-1 flex-1 mx-8 bg-gradient-to-r from-accent/20 to-transparent rounded-full hidden md:block"></div>
                        </div>
                        <ProductsCarousel />
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ProductDetail;
