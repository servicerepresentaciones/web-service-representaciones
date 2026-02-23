import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import LazyImage from '@/components/ui/LazyImage';

interface Banner {
    id: string;
    title: string;
    image_url: string;
    link: string;
    is_active: boolean;
    sort_order: number;
}

const PromotionalBanners = () => {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const { data } = await supabase
                    .from('promotional_banners')
                    .select('*')
                    .eq('is_active', true)
                    .order('sort_order', { ascending: true })
                    .order('created_at', { ascending: false });

                if (data) setBanners(data);
            } catch (error) {
                console.error('Error fetching banners:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBanners();
    }, []);

    if (loading) {
        return (
            <section className="py-8 bg-background">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Skeleton className="w-full aspect-[21/9] rounded-xl" />
                        <Skeleton className="w-full aspect-[21/9] rounded-xl" />
                    </div>
                </div>
            </section>
        );
    }

    if (banners.length === 0) return null;

    return (
        <section className="py-8 bg-background">
            <div className="container mx-auto px-4 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    {banners.map((banner) => (
                        <div key={banner.id} className="relative group overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
                            {banner.link ? (
                                <a
                                    href={banner.link}
                                    target={banner.link.startsWith('http') ? '_blank' : '_self'}
                                    rel={banner.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                                    className="block"
                                >
                                    <LazyImage
                                        src={banner.image_url}
                                        alt={banner.title || 'Banner Promocional'}
                                        className="w-full h-auto object-cover transform group-hover:scale-[1.02] transition-transform duration-500"
                                    />
                                </a>
                            ) : (
                                <LazyImage
                                    src={banner.image_url}
                                    alt={banner.title || 'Banner Promocional'}
                                    className="w-full h-auto object-cover"
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PromotionalBanners;
