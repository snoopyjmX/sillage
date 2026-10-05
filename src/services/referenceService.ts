// Listas de apoio aos filtros (marcas e notas). Leitura pública (RN07).
import { toAppError } from '@/constants/errors';
import { supabase } from '@/lib/supabase';
import type { BrandOption, NoteOption } from '@/types/catalog';

export const referenceService = {
  listBrands: async (): Promise<BrandOption[]> => {
    const { data, error } = await supabase.from('brands').select('slug, name').order('name');
    if (error) throw toAppError(error);
    return data;
  },

  listNotes: async (): Promise<NoteOption[]> => {
    const { data, error } = await supabase.from('notes').select('slug, name, family').order('name');
    if (error) throw toAppError(error);
    return data;
  },
};
