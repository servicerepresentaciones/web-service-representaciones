import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const useServices = () => {
    return useQuery({
        queryKey: ['services'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('services')
                .select('id, name, slug, description, image_url, order') // Select specific fields instead of *
                .eq('is_active', true)
                .order('order', { ascending: true });

            if (error) throw error;
            return data;
        },
        staleTime: 24 * 60 * 60 * 1000, // 24 hours (Services rarely change)
    });
};

export const useServiceBySlug = (slug: string | undefined) => {
    return useQuery({
        queryKey: ['service', slug],
        queryFn: async () => {
            if (!slug) return null;

            const { data, error } = await supabase
                .from('services')
                .select('id, name, slug, subtitle, description, image_url, gallery_images, benefits, features')
                .eq('slug', slug)
                .eq('is_active', true)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!slug,
        staleTime: 60 * 60 * 1000, // 1 hour
    });
};

export const useServiceSettings = () => {
    return useQuery({
        queryKey: ['service_settings'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('site_settings')
                .select('services_bg_url, services_title, services_subtitle, logo_url_dark')
                .single();

            if (error) throw error;
            return data;
        },
        staleTime: 24 * 60 * 60 * 1000,
    });
};
