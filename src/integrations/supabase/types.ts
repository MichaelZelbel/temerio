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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_events: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          id: string
          item_id: string | null
          item_type: string
          metadata: Json | null
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          id?: string
          item_id?: string | null
          item_type: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          id?: string
          item_id?: string | null
          item_type?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      ai_allowance_periods: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          period_end: string
          period_start: string
          source: string
          tokens_granted: number
          tokens_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          period_end?: string
          period_start?: string
          source: string
          tokens_granted?: number
          tokens_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          period_end?: string
          period_start?: string
          source?: string
          tokens_granted?: number
          tokens_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_credit_settings: {
        Row: {
          description: string | null
          key: string
          value_int: number
        }
        Insert: {
          description?: string | null
          key: string
          value_int: number
        }
        Update: {
          description?: string | null
          key?: string
          value_int?: number
        }
        Relationships: []
      }
      ai_usage_ledger: {
        Row: {
          action: string
          created_at: string
          credits_used: number
          document_id: string | null
          id: string
          meta: Json | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          credits_used?: number
          document_id?: string | null
          id?: string
          meta?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          credits_used?: number
          document_id?: string | null
          id?: string
          meta?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_ledger_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          error: string | null
          file_name: string
          id: string
          mime_type: string
          primary_person_id: string | null
          source_language: string | null
          status: string
          storage_path: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          file_name: string
          id?: string
          mime_type?: string
          primary_person_id?: string | null
          source_language?: string | null
          status?: string
          storage_path: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error?: string | null
          file_name?: string
          id?: string
          mime_type?: string
          primary_person_id?: string | null
          source_language?: string | null
          status?: string
          storage_path?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_primary_person_id_fkey"
            columns: ["primary_person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participants: {
        Row: {
          event_id: string
          person_id: string
        }
        Insert: {
          event_id: string
          person_id: string
        }
        Update: {
          event_id?: string
          person_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participants_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      event_provenance: {
        Row: {
          created_at: string
          document_id: string
          event_id: string
          id: string
          language: string | null
          page_number: number | null
          snippet_en: string | null
          snippet_original: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          event_id: string
          id?: string
          language?: string | null
          page_number?: number | null
          snippet_en?: string | null
          snippet_original?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          event_id?: string
          id?: string
          language?: string | null
          page_number?: number | null
          snippet_en?: string | null
          snippet_original?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_provenance_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_provenance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          confidence_date: number
          confidence_truth: number
          created_at: string
          date_end: string | null
          date_start: string
          description_en: string | null
          headline_en: string
          id: string
          importance: number
          is_potential_major: boolean
          merge_auto: boolean
          source: string
          status: string
          updated_at: string
          user_id: string
          verified: boolean
        }
        Insert: {
          confidence_date?: number
          confidence_truth?: number
          created_at?: string
          date_end?: string | null
          date_start: string
          description_en?: string | null
          headline_en: string
          id?: string
          importance?: number
          is_potential_major?: boolean
          merge_auto?: boolean
          source?: string
          status?: string
          updated_at?: string
          user_id: string
          verified?: boolean
        }
        Update: {
          confidence_date?: number
          confidence_truth?: number
          created_at?: string
          date_end?: string | null
          date_start?: string
          description_en?: string | null
          headline_en?: string
          id?: string
          importance?: number
          is_potential_major?: boolean
          merge_auto?: boolean
          source?: string
          status?: string
          updated_at?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      llm_usage_events: {
        Row: {
          completion_tokens: number
          created_at: string
          credits_charged: number
          feature: string
          id: string
          idempotency_key: string | null
          metadata: Json | null
          model: string | null
          prompt_tokens: number
          provider: string | null
          total_tokens: number
          user_id: string
        }
        Insert: {
          completion_tokens?: number
          created_at?: string
          credits_charged?: number
          feature: string
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          model?: string | null
          prompt_tokens?: number
          provider?: string | null
          total_tokens?: number
          user_id: string
        }
        Update: {
          completion_tokens?: number
          created_at?: string
          credits_charged?: number
          feature?: string
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          model?: string | null
          prompt_tokens?: number
          provider?: string | null
          total_tokens?: number
          user_id?: string
        }
        Relationships: []
      }
      people: {
        Row: {
          created_at: string
          id: string
          name: string
          relationship_label: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          relationship_label?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          relationship_label?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      review_queue: {
        Row: {
          created_at: string
          event_id: string | null
          id: string
          notes: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          id?: string
          notes?: string | null
          status?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string | null
          id?: string
          notes?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_queue_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_ai_allowance_current: {
        Row: {
          credits_granted: number | null
          credits_used: number | null
          id: string | null
          metadata: Json | null
          period_end: string | null
          period_start: string | null
          remaining_credits: number | null
          remaining_tokens: number | null
          source: string | null
          tokens_granted: number | null
          tokens_used: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_premium_user: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "free" | "premium" | "premium_gift" | "admin"
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
    Enums: {
      app_role: ["free", "premium", "premium_gift", "admin"],
    },
  },
} as const
