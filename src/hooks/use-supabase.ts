import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { PostgrestError } from "@supabase/supabase-js";

interface UseSupabaseOptions {
  select?: string;
  eq?: Record<string, unknown>;
  order?: { column: string; ascending?: boolean };
  limit?: number;
}

export const useSupabase = <T,>(
  table: string,
  options?: UseSupabaseOptions
) => {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    fetchData();
  }, [table, options]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase.from(table).select(options?.select ?? "*");

      if (options?.eq) {
        Object.entries(options.eq).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      if (options?.order) {
        query = query.order(options.order.column, {
          ascending: options.order.ascending ?? false,
        });
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data: result, error: err } = await query;

      if (err) throw err;
      setData(result as T[]);
    } catch (err) {
      if (err instanceof Error) {
        // Handle as PostgrestError if it has code property
        const postgrestError = err as unknown as PostgrestError;
        setError(postgrestError);
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
};
