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
      budgets: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string
          id: string
          spent: number | null
          year: number | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          created_by: string
          id?: string
          spent?: number | null
          year?: number | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string
          id?: string
          spent?: number | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "budgets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_connections: {
        Row: {
          access_token: string | null
          created_at: string
          id: string
          is_active: boolean
          last_synced_at: string | null
          provider: string
          provider_account_email: string | null
          refresh_token: string | null
          selected_calendars: Json
          token_expires_at: string | null
          updated_at: string
          user_id: string
          webhook_channel_id: string | null
          webhook_expires_at: string | null
          webhook_resource_id: string | null
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_synced_at?: string | null
          provider: string
          provider_account_email?: string | null
          refresh_token?: string | null
          selected_calendars?: Json
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
          webhook_channel_id?: string | null
          webhook_expires_at?: string | null
          webhook_resource_id?: string | null
        }
        Update: {
          access_token?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_synced_at?: string | null
          provider?: string
          provider_account_email?: string | null
          refresh_token?: string | null
          selected_calendars?: Json
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
          webhook_channel_id?: string | null
          webhook_expires_at?: string | null
          webhook_resource_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events_cache: {
        Row: {
          calendar_id: string | null
          color: string | null
          connection_id: string
          couple_plan_event_id: string | null
          description: string | null
          end_time: string | null
          etag: string | null
          external_id: string
          id: string
          is_all_day: boolean
          location: string | null
          provider: string
          raw_data: Json | null
          start_time: string
          synced_at: string
          title: string
          user_id: string
        }
        Insert: {
          calendar_id?: string | null
          color?: string | null
          connection_id: string
          couple_plan_event_id?: string | null
          description?: string | null
          end_time?: string | null
          etag?: string | null
          external_id: string
          id?: string
          is_all_day?: boolean
          location?: string | null
          provider: string
          raw_data?: Json | null
          start_time: string
          synced_at?: string
          title: string
          user_id: string
        }
        Update: {
          calendar_id?: string | null
          color?: string | null
          connection_id?: string
          couple_plan_event_id?: string | null
          description?: string | null
          end_time?: string | null
          etag?: string | null
          external_id?: string
          id?: string
          is_all_day?: boolean
          location?: string | null
          provider?: string
          raw_data?: Json | null
          start_time?: string
          synced_at?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_cache_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "calendar_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_cache_couple_plan_event_id_fkey"
            columns: ["couple_plan_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_cache_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_sync_log: {
        Row: {
          completed_at: string | null
          conflicts_found: number
          connection_id: string | null
          direction: string
          error_message: string | null
          events_pulled: number
          events_pushed: number
          id: string
          metadata: Json | null
          started_at: string
          status: string
          sync_type: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          conflicts_found?: number
          connection_id?: string | null
          direction: string
          error_message?: string | null
          events_pulled?: number
          events_pushed?: number
          id?: string
          metadata?: Json | null
          started_at?: string
          status: string
          sync_type: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          conflicts_found?: number
          connection_id?: string | null
          direction?: string
          error_message?: string | null
          events_pulled?: number
          events_pushed?: number
          id?: string
          metadata?: Json | null
          started_at?: string
          status?: string
          sync_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_sync_log_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "calendar_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_sync_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      date_ideas: {
        Row: {
          city: string
          date: string
          generated_at: string | null
          id: string
          ideas: Json
        }
        Insert: {
          city: string
          date?: string
          generated_at?: string | null
          id?: string
          ideas: Json
        }
        Update: {
          city?: string
          date?: string
          generated_at?: string | null
          id?: string
          ideas?: Json
        }
        Relationships: []
      }
      date_ideas_feedback: {
        Row: {
          city: string
          created_at: string | null
          date: string
          feedback_text: string | null
          id: string
          personalized_ideas: Json | null
          user_id: string
        }
        Insert: {
          city: string
          created_at?: string | null
          date?: string
          feedback_text?: string | null
          id?: string
          personalized_ideas?: Json | null
          user_id: string
        }
        Update: {
          city?: string
          created_at?: string | null
          date?: string
          feedback_text?: string | null
          id?: string
          personalized_ideas?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          color: string | null
          created_at: string
          date: string
          description: string | null
          id: string
          time: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          date: string
          description?: string | null
          id?: string
          time?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          time?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          budget_id: string
          created_at: string
          created_by: string
          date: string | null
          description: string
          id: string
        }
        Insert: {
          amount: number
          budget_id: string
          created_at?: string
          created_by: string
          date?: string | null
          description: string
          id?: string
        }
        Update: {
          amount?: number
          budget_id?: string
          created_at?: string
          created_by?: string
          date?: string | null
          description?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          category: string | null
          completed: boolean | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          target_date: string | null
          title: string
        }
        Insert: {
          category?: string | null
          completed?: boolean | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          target_date?: string | null
          title: string
        }
        Update: {
          category?: string | null
          completed?: boolean | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          target_date?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          created_at: string
          from_user_id: string
          id: string
          status: string | null
          to_email: string
        }
        Insert: {
          created_at?: string
          from_user_id: string
          id?: string
          status?: string | null
          to_email: string
        }
        Update: {
          created_at?: string
          from_user_id?: string
          id?: string
          status?: string | null
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          city: string | null
          city_updated_at: string | null
          created_at: string
          email: string
          id: string
          is_premium: boolean | null
          name: string
          partner_id: string | null
        }
        Insert: {
          city?: string | null
          city_updated_at?: string | null
          created_at?: string
          email: string
          id: string
          is_premium?: boolean | null
          name: string
          partner_id?: string | null
        }
        Update: {
          city?: string | null
          city_updated_at?: string | null
          created_at?: string
          email?: string
          id?: string
          is_premium?: boolean | null
          name?: string
          partner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          category: string | null
          completed: boolean | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          title: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          completed?: boolean | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          title: string
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          completed?: boolean | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      travels: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          destination: string
          end_date: string | null
          estimated_budget: number | null
          id: string
          start_date: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          destination: string
          end_date?: string | null
          estimated_budget?: number | null
          id?: string
          start_date?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          destination?: string
          end_date?: string | null
          estimated_budget?: number | null
          id?: string
          start_date?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "travels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_partner_id: { Args: { user_id: string }; Returns: string }
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
