export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      brands: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          search_name: string;
          slug: string;
          updated_at: string;
          website_url: string | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          search_name: string;
          slug: string;
          updated_at?: string;
          website_url?: string | null;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          search_name?: string;
          slug?: string;
          updated_at?: string;
          website_url?: string | null;
        };
        Relationships: [];
      };
      collection_items: {
        Row: {
          created_at: string;
          id: string;
          perfume_id: string;
          status: Database['public']['Enums']['collection_status'];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          perfume_id: string;
          status: Database['public']['Enums']['collection_status'];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          perfume_id?: string;
          status?: Database['public']['Enums']['collection_status'];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'collection_items_perfume_id_fkey';
            columns: ['perfume_id'];
            isOneToOne: false;
            referencedRelation: 'perfumes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'collection_items_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      daily_perfumes: {
        Row: {
          created_at: string;
          date: string;
          id: string;
          perfume_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          date: string;
          id?: string;
          perfume_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          date?: string;
          id?: string;
          perfume_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'daily_perfumes_perfume_id_fkey';
            columns: ['perfume_id'];
            isOneToOne: false;
            referencedRelation: 'perfumes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'daily_perfumes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      notes: {
        Row: {
          created_at: string;
          family: Database['public']['Enums']['olfactive_family'];
          id: string;
          name: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          family: Database['public']['Enums']['olfactive_family'];
          id?: string;
          name: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          family?: Database['public']['Enums']['olfactive_family'];
          id?: string;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      perfume_notes: {
        Row: {
          note_id: string;
          perfume_id: string;
          position: Database['public']['Enums']['note_position'];
        };
        Insert: {
          note_id: string;
          perfume_id: string;
          position: Database['public']['Enums']['note_position'];
        };
        Update: {
          note_id?: string;
          perfume_id?: string;
          position?: Database['public']['Enums']['note_position'];
        };
        Relationships: [
          {
            foreignKeyName: 'perfume_notes_note_id_fkey';
            columns: ['note_id'];
            isOneToOne: false;
            referencedRelation: 'notes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'perfume_notes_perfume_id_fkey';
            columns: ['perfume_id'];
            isOneToOne: false;
            referencedRelation: 'perfumes';
            referencedColumns: ['id'];
          },
        ];
      };
      perfume_reviews: {
        Row: {
          comment: string | null;
          created_at: string;
          id: string;
          longevity_rating: number;
          perfume_id: string;
          projection_rating: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          longevity_rating: number;
          perfume_id: string;
          projection_rating: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          longevity_rating?: number;
          perfume_id?: string;
          projection_rating?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'perfume_reviews_perfume_id_fkey';
            columns: ['perfume_id'];
            isOneToOne: false;
            referencedRelation: 'perfumes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'perfume_reviews_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      perfumes: {
        Row: {
          brand_id: string;
          concentration: Database['public']['Enums']['concentration_type'];
          created_at: string;
          description: string | null;
          gender: Database['public']['Enums']['perfume_gender'];
          id: string;
          image_path: string | null;
          lowest_price_cents: number | null;
          name: string;
          release_year: number | null;
          search_name: string;
          slug: string;
          store_name: string | null;
          store_url: string | null;
          updated_at: string;
        };
        Insert: {
          brand_id: string;
          concentration: Database['public']['Enums']['concentration_type'];
          created_at?: string;
          description?: string | null;
          gender: Database['public']['Enums']['perfume_gender'];
          id?: string;
          image_path?: string | null;
          lowest_price_cents?: number | null;
          name: string;
          release_year?: number | null;
          search_name: string;
          slug: string;
          store_name?: string | null;
          store_url?: string | null;
          updated_at?: string;
        };
        Update: {
          brand_id?: string;
          concentration?: Database['public']['Enums']['concentration_type'];
          created_at?: string;
          description?: string | null;
          gender?: Database['public']['Enums']['perfume_gender'];
          id?: string;
          image_path?: string | null;
          lowest_price_cents?: number | null;
          name?: string;
          release_year?: number | null;
          search_name?: string;
          slug?: string;
          store_name?: string | null;
          store_url?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'perfumes_brand_id_fkey';
            columns: ['brand_id'];
            isOneToOne: false;
            referencedRelation: 'brands';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string;
          id: string;
          timezone: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name: string;
          id: string;
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string;
          id?: string;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      perfume_review_stats: {
        Row: {
          avg_longevity: number | null;
          avg_projection: number | null;
          perfume_id: string | null;
          review_count: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'perfume_reviews_perfume_id_fkey';
            columns: ['perfume_id'];
            isOneToOne: false;
            referencedRelation: 'perfumes';
            referencedColumns: ['id'];
          },
        ];
      };
      perfume_reviews_public: {
        Row: {
          author_name: string | null;
          comment: string | null;
          created_at: string | null;
          id: string | null;
          longevity_rating: number | null;
          perfume_id: string | null;
          projection_rating: number | null;
          updated_at: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'perfume_reviews_perfume_id_fkey';
            columns: ['perfume_id'];
            isOneToOne: false;
            referencedRelation: 'perfumes';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Functions: {
      get_similar_perfumes: {
        Args: { limit_count?: number; target_id: string };
        Returns: {
          brand_id: string;
          brand_name: string;
          brand_slug: string;
          common_notes: number;
          concentration: Database['public']['Enums']['concentration_type'];
          families: Database['public']['Enums']['olfactive_family'][];
          gender: Database['public']['Enums']['perfume_gender'];
          id: string;
          image_path: string;
          name: string;
          release_year: number;
          slug: string;
        }[];
      };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      search_perfumes: {
        Args: {
          p_brand_slugs?: string[];
          p_concentrations?: Database['public']['Enums']['concentration_type'][];
          p_families?: Database['public']['Enums']['olfactive_family'][];
          p_genders?: Database['public']['Enums']['perfume_gender'][];
          p_limit?: number;
          p_note_position?: Database['public']['Enums']['note_position'];
          p_note_slugs?: string[];
          p_offset?: number;
          p_query?: string;
          p_sort?: string;
          p_year_max?: number;
          p_year_min?: number;
        };
        Returns: {
          brand_name: string;
          brand_slug: string;
          concentration: Database['public']['Enums']['concentration_type'];
          families: Database['public']['Enums']['olfactive_family'][];
          gender: Database['public']['Enums']['perfume_gender'];
          id: string;
          image_path: string;
          name: string;
          release_year: number;
          slug: string;
          total_count: number;
        }[];
      };
      set_daily_perfume: {
        Args: { p_perfume_id: string };
        Returns: {
          created_at: string;
          date: string;
          id: string;
          perfume_id: string;
          user_id: string;
        };
        SetofOptions: {
          from: '*';
          to: 'daily_perfumes';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
    };
    Enums: {
      collection_status: 'owned' | 'wanted';
      concentration_type: 'parfum' | 'extrait' | 'edp' | 'edt' | 'edc' | 'other';
      note_position: 'top' | 'heart' | 'base';
      olfactive_family:
        | 'citrus'
        | 'floral'
        | 'woody'
        | 'green'
        | 'aquatic'
        | 'oriental'
        | 'spicy'
        | 'fruity'
        | 'aromatic'
        | 'musky';
      perfume_gender: 'masculine' | 'feminine' | 'unisex';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      collection_status: ['owned', 'wanted'],
      concentration_type: ['parfum', 'extrait', 'edp', 'edt', 'edc', 'other'],
      note_position: ['top', 'heart', 'base'],
      olfactive_family: [
        'citrus',
        'floral',
        'woody',
        'green',
        'aquatic',
        'oriental',
        'spicy',
        'fruity',
        'aromatic',
        'musky',
      ],
      perfume_gender: ['masculine', 'feminine', 'unisex'],
    },
  },
} as const;
