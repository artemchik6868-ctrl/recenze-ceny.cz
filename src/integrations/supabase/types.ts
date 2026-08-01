export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cpa_tl_offers: {
        Row: {
          category: string | null
          first_seen_at: string
          is_active: boolean
          offer_id: number
          picture_url: string | null
          raw: Json
          synced_at: string
          title: string
        }
        Insert: {
          category?: string | null
          first_seen_at?: string
          is_active?: boolean
          offer_id: number
          picture_url?: string | null
          raw: Json
          synced_at?: string
          title: string
        }
        Update: {
          category?: string | null
          first_seen_at?: string
          is_active?: boolean
          offer_id?: number
          picture_url?: string | null
          raw?: Json
          synced_at?: string
          title?: string
        }
        Relationships: []
      }
      cpagetti_offers: {
        Row: {
          category: string | null
          first_seen_at: string
          is_active: boolean
          offer_id: number
          picture_url: string | null
          raw: Json
          synced_at: string
          title: string
          vertical_id: number | null
        }
        Insert: {
          category?: string | null
          first_seen_at?: string
          is_active?: boolean
          offer_id: number
          picture_url?: string | null
          raw: Json
          synced_at?: string
          title: string
          vertical_id?: number | null
        }
        Update: {
          category?: string | null
          first_seen_at?: string
          is_active?: boolean
          offer_id?: number
          picture_url?: string | null
          raw?: Json
          synced_at?: string
          title?: string
          vertical_id?: number | null
        }
        Relationships: []
      }
      indexing_log: {
        Row: {
          created_at: string
          error: string | null
          id: number
          provider: string
          status: string
          url: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: number
          provider: string
          status: string
          url: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: number
          provider?: string
          status?: string
          url?: string
        }
        Relationships: []
      }
      indexing_status: {
        Row: {
          url: string
          indexed: boolean | null
          verdict: string | null
          coverage_state: string | null
          last_inspected_at: string | null
          last_notified_at: string | null
          retry_after: string | null
          inspect_error: string | null
          updated_at: string
        }
        Insert: {
          url: string
          indexed?: boolean | null
          verdict?: string | null
          coverage_state?: string | null
          last_inspected_at?: string | null
          last_notified_at?: string | null
          retry_after?: string | null
          inspect_error?: string | null
          updated_at?: string
        }
        Update: {
          url?: string
          indexed?: boolean | null
          verdict?: string | null
          coverage_state?: string | null
          last_inspected_at?: string | null
          last_notified_at?: string | null
          retry_after?: string | null
          inspect_error?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pipeline_feed_wave: {
        Row: {
          id: number
          pending: string[]
          active_source: string | null
          active_cursor: Json | null
          wave_id: string
          started_at: string
          updated_at: string
          last_error: string | null
          last_result: Json | null
        }
        Insert: {
          id?: number
          pending?: string[]
          active_source?: string | null
          active_cursor?: Json | null
          wave_id?: string
          started_at?: string
          updated_at?: string
          last_error?: string | null
          last_result?: Json | null
        }
        Update: {
          id?: number
          pending?: string[]
          active_source?: string | null
          active_cursor?: Json | null
          wave_id?: string
          started_at?: string
          updated_at?: string
          last_error?: string | null
          last_result?: Json | null
        }
        Relationships: []
      }
      content_gen_failures: {
        Row: {
          fail_count: number
          last_failed_at: string
          offer_id: number
          source: string
        }
        Insert: {
          fail_count?: number
          last_failed_at?: string
          offer_id: number
          source: string
        }
        Update: {
          fail_count?: number
          last_failed_at?: string
          offer_id?: number
          source?: string
        }
        Relationships: []
      }
      kma_channels: {
        Row: {
          channel_code: string
          created_at: string
          offer_id: number
        }
        Insert: {
          channel_code: string
          created_at?: string
          offer_id: number
        }
        Update: {
          channel_code?: string
          created_at?: string
          offer_id?: number
        }
        Relationships: []
      }
      kma_offers: {
        Row: {
          category: string | null
          commission_uah: number | null
          first_seen_at: string
          is_active: boolean
          itemprice_rub: number | null
          logo: string | null
          name: string
          offer_id: number
          raw: Json
          synced_at: string
        }
        Insert: {
          category?: string | null
          commission_uah?: number | null
          first_seen_at?: string
          is_active?: boolean
          itemprice_rub?: number | null
          logo?: string | null
          name: string
          offer_id: number
          raw: Json
          synced_at?: string
        }
        Update: {
          category?: string | null
          commission_uah?: number | null
          first_seen_at?: string
          is_active?: boolean
          itemprice_rub?: number | null
          logo?: string | null
          name?: string
          offer_id?: number
          raw?: Json
          synced_at?: string
        }
        Relationships: []
      }
      m1_offers: {
        Row: {
          category: string | null
          first_seen_at: string
          is_active: boolean
          name: string
          offer_id: number
          pay_uah: number | null
          picture_url: string | null
          price_uah: number | null
          raw: Json
          synced_at: string
        }
        Insert: {
          category?: string | null
          first_seen_at?: string
          is_active?: boolean
          name: string
          offer_id: number
          pay_uah?: number | null
          picture_url?: string | null
          price_uah?: number | null
          raw: Json
          synced_at?: string
        }
        Update: {
          category?: string | null
          first_seen_at?: string
          is_active?: boolean
          name?: string
          offer_id?: number
          pay_uah?: number | null
          picture_url?: string | null
          price_uah?: number | null
          raw?: Json
          synced_at?: string
        }
        Relationships: []
      }
      product_briefs: {
        Row: {
          allowed_lex_ru: string[]
          allowed_lex_uk: string[]
          brand: string | null
          brief_confidence: number
          category_slug: string
          clean_title: string | null
          cleaned_desc_len: number
          forbidden_lex_ru: string[]
          forbidden_lex_uk: string[]
          generated_at: string
          offer_id: number
          physical_form: string
          pipeline_version: string
          qa_errors_ru: string[]
          qa_errors_uk: string[]
          qa_status_ru: string | null
          qa_status_uk: string | null
          resolved_category_slug: string | null
          source: string
          source_hash: string
          warnings: string[]
        }
        Insert: {
          allowed_lex_ru?: string[]
          allowed_lex_uk?: string[]
          brand?: string | null
          brief_confidence: number
          category_slug: string
          clean_title?: string | null
          cleaned_desc_len: number
          forbidden_lex_ru?: string[]
          forbidden_lex_uk?: string[]
          generated_at?: string
          offer_id: number
          physical_form: string
          pipeline_version: string
          qa_errors_ru?: string[]
          qa_errors_uk?: string[]
          qa_status_ru?: string | null
          qa_status_uk?: string | null
          resolved_category_slug?: string | null
          source: string
          source_hash: string
          warnings?: string[]
        }
        Update: {
          allowed_lex_ru?: string[]
          allowed_lex_uk?: string[]
          brand?: string | null
          brief_confidence?: number
          category_slug?: string
          clean_title?: string | null
          cleaned_desc_len?: number
          forbidden_lex_ru?: string[]
          forbidden_lex_uk?: string[]
          generated_at?: string
          offer_id?: number
          physical_form?: string
          pipeline_version?: string
          qa_errors_ru?: string[]
          qa_errors_uk?: string[]
          qa_status_ru?: string | null
          qa_status_uk?: string | null
          resolved_category_slug?: string | null
          source?: string
          source_hash?: string
          warnings?: string[]
        }
        Relationships: []
      }
      product_content: {
        Row: {
          description_html_ru: string | null
          description_html_uk: string | null
          display_title_ru: string | null
          display_title_uk: string | null
          faq_ru: Json | null
          faq_uk: Json
          reviews_uk: Json
          form_kind: string | null
          generated_at: string
          intro_ru: string | null
          intro_uk: string
          meta_desc_ru: string | null
          meta_desc_uk: string
          offer_id: number
          qa_checked_at: string | null
          qa_reason_ru: string | null
          qa_reason_uk: string | null
          qa_status_ru: string | null
          qa_status_uk: string | null
          sections_ru: Json | null
          sections_uk: Json
          source: string
          source_hash: string
          subtitle_ru: string | null
          subtitle_uk: string
          title_ru: string | null
          title_uk: string
        }
        Insert: {
          description_html_ru?: string | null
          description_html_uk?: string | null
          display_title_ru?: string | null
          display_title_uk?: string | null
          faq_ru?: Json | null
          faq_uk: Json
          reviews_uk?: Json
          form_kind?: string | null
          generated_at?: string
          intro_ru?: string | null
          intro_uk: string
          meta_desc_ru?: string | null
          meta_desc_uk: string
          offer_id: number
          qa_checked_at?: string | null
          qa_reason_ru?: string | null
          qa_reason_uk?: string | null
          qa_status_ru?: string | null
          qa_status_uk?: string | null
          sections_ru?: Json | null
          sections_uk: Json
          source?: string
          source_hash: string
          subtitle_ru?: string | null
          subtitle_uk: string
          title_ru?: string | null
          title_uk: string
        }
        Update: {
          description_html_ru?: string | null
          description_html_uk?: string | null
          display_title_ru?: string | null
          display_title_uk?: string | null
          faq_ru?: Json | null
          faq_uk?: Json
          reviews_uk?: Json
          form_kind?: string | null
          generated_at?: string
          intro_ru?: string | null
          intro_uk?: string
          meta_desc_ru?: string | null
          meta_desc_uk?: string
          offer_id?: number
          qa_checked_at?: string | null
          qa_reason_ru?: string | null
          qa_reason_uk?: string | null
          qa_status_ru?: string | null
          qa_status_uk?: string | null
          sections_ru?: Json | null
          sections_uk?: Json
          source?: string
          source_hash?: string
          subtitle_ru?: string | null
          subtitle_uk?: string
          title_ru?: string | null
          title_uk?: string
        }
        Relationships: []
      }
      product_images: {
        Row: {
          height: number | null
          ingest_status: string
          offer_id: number
          original_url: string
          processed_at: string
          source: string
          source_hash: string
          storage_path: string | null
          width: number | null
        }
        Insert: {
          height?: number | null
          ingest_status?: string
          offer_id: number
          original_url: string
          processed_at?: string
          source: string
          source_hash: string
          storage_path?: string | null
          width?: number | null
        }
        Update: {
          height?: number | null
          ingest_status?: string
          offer_id?: number
          original_url?: string
          processed_at?: string
          source?: string
          source_hash?: string
          storage_path?: string | null
          width?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
