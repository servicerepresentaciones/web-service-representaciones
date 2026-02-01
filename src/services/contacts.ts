import { supabase } from "@/lib/supabase";

export interface Contact {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  created_at?: string;
}

export const contactsService = {
  async create(contact: Contact) {
    const { data, error } = await supabase
      .from("contacts")
      .insert([contact])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getAll() {
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from("contacts")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};
