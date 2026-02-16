import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface ProductFilter {
    categoryIds?: string[];
    brandIds?: string[];
    limit?: number;
    page?: number;
    sortBy?: 'newest' | 'price_asc' | 'price_desc';
    featured?: boolean;
    excludeId?: string;
    search?: string;
    isNew?: boolean;
}

export const useProducts = (filters: ProductFilter = {}) => {
    return useQuery({
        queryKey: ['products', filters],
        queryFn: async () => {
            const {
                categoryIds,
                brandIds,
                limit = 20,
                page = 0,
                sortBy = 'newest',
                featured,
                excludeId,
                search
            } = filters;

            let selectQuery = `
              id, 
              name, 
              slug, 
              main_image_url, 
              is_new, 
              category_id, 
              brand_id, 
              created_at,
              categories(name)
            `;

            // Si filtramos por categorías, necesitamos un INNER JOIN con product_categories
            if (categoryIds && categoryIds.length > 0) {
                selectQuery += `, product_categories!inner(category_id)`;
            } else {
                selectQuery += `, product_categories(category_id)`;
            }

            let query = supabase
                .from('products')
                .select(selectQuery)
                .eq('is_active', true);

            if (categoryIds && categoryIds.length > 0) {
                // Filtrar usando la tabla de relación M2M
                query = query.in('product_categories.category_id', categoryIds);
            }

            if (brandIds && brandIds.length > 0) {
                query = query.in('brand_id', brandIds);
            }

            if (excludeId) {
                query = query.neq('id', excludeId);
            }

            if (filters.isNew) {
                query = query.eq('is_new', true);
            }

            if (search) {
                query = query.ilike('name', `%${search}%`);
            }

            if (sortBy === 'newest') {
                query = query.order('created_at', { ascending: false });
            }

            // Paginación
            const from = page * limit;
            const to = from + limit - 1;
            query = query.range(from, to);

            const { data, error } = await query;

            if (error) throw error;

            return data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutos
    });
};

export const useProductBySlug = (slug: string | undefined) => {
    return useQuery({
        queryKey: ['product', slug],
        queryFn: async () => {
            if (!slug) return null;

            const { data, error } = await supabase
                .from('products')
                .select(`
          id, 
          name, 
          slug, 
          description, 
          main_image_url, 
          images,
          specifications,
          datasheet_url,
          is_new, 
          in_stock,
          stock_quantity,
          category_id, 
          brand_id, 
          model_code,
          categories(id, name, slug),
          brands(id, name, logo_url, slug)
        `)
                .eq('slug', slug)
                .eq('is_active', true)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!slug,
        staleTime: 10 * 60 * 1000,
    });
};
