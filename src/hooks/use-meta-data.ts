import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export const useCategories = () => {
    return useQuery({
        queryKey: ["categories"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("categories")
                .select("id, name, slug, parent_id, image_url, icon")
                .eq("is_active", true)
                .order("order", { ascending: true });

            if (error) throw error;
            return data;
        },
        staleTime: 24 * 60 * 60 * 1000, // 24 horas
    });
};

export const useBrands = () => {
    return useQuery({
        queryKey: ["brands", "filtered_by_active_products"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("brands")
                .select("id, name, slug, logo_url, products!inner(id)")
                .eq("is_active", true)
                .eq("products.is_active", true)
                .order("order", { ascending: true });

            if (error) throw error;
            return data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutos
    });
};
