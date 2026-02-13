import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const useHeroSlides = () => {
    return useQuery({
        queryKey: ['hero_slides'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('hero_slides')
                .select('id, title, subtitle, description, image_url, button_text, button_link, secondary_button_text, secondary_button_link')
                .eq('is_active', true)
                .order('order', { ascending: true });

            if (error) throw error;
            return data;
        },
        staleTime: 24 * 60 * 60 * 1000, // 24 hours
    });
};
