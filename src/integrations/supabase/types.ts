export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      client_requests: {
        Row: {
          access_conditions: string | null
          arrival_address: string | null
          arrival_city: string
          arrival_country: string | null
          arrival_postal_code: string
          budget_max: number | null
          budget_min: number | null
          client_id: number
          created_at: string
          created_by: string
          date_range_end: string | null
          date_range_start: string | null
          departure_address: string | null
          departure_city: string
          departure_country: string | null
          departure_postal_code: string
          description: string | null
          desired_date: string
          email: string | null
          estimated_volume: number | null
          estimated_volume_backup: number
          flexible_dates: boolean | null
          id: number
          inventory_list: string | null
          name: string | null
          phone: string | null
          quote_amount: number | null
          special_requirements: string | null
          status: string
          status_custom: string | null
        }
        Insert: {
          access_conditions?: string | null
          arrival_address?: string | null
          arrival_city: string
          arrival_country?: string | null
          arrival_postal_code: string
          budget_max?: number | null
          budget_min?: number | null
          client_id: number
          created_at?: string
          created_by: string
          date_range_end?: string | null
          date_range_start?: string | null
          departure_address?: string | null
          departure_city: string
          departure_country?: string | null
          departure_postal_code: string
          description?: string | null
          desired_date: string
          email?: string | null
          estimated_volume?: number | null
          estimated_volume_backup: number
          flexible_dates?: boolean | null
          id?: number
          inventory_list?: string | null
          name?: string | null
          phone?: string | null
          quote_amount?: number | null
          special_requirements?: string | null
          status?: string
          status_custom?: string | null
        }
        Update: {
          access_conditions?: string | null
          arrival_address?: string | null
          arrival_city?: string
          arrival_country?: string | null
          arrival_postal_code?: string
          budget_max?: number | null
          budget_min?: number | null
          client_id?: number
          created_at?: string
          created_by?: string
          date_range_end?: string | null
          date_range_start?: string | null
          departure_address?: string | null
          departure_city?: string
          departure_country?: string | null
          departure_postal_code?: string
          description?: string | null
          desired_date?: string
          email?: string | null
          estimated_volume?: number | null
          estimated_volume_backup?: number
          flexible_dates?: boolean | null
          id?: number
          inventory_list?: string | null
          name?: string | null
          phone?: string | null
          quote_amount?: number | null
          special_requirements?: string | null
          status?: string
          status_custom?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          created_by: string
          email: string
          id: number
          name: string
          phone: string
        }
        Insert: {
          created_at?: string
          created_by: string
          email: string
          id?: number
          name: string
          phone: string
        }
        Update: {
          created_at?: string
          created_by?: string
          email?: string
          id?: number
          name?: string
          phone?: string
        }
        Relationships: []
      }
      confirmed_moves: {
        Row: {
          access_conditions: string | null
          arrival_address: string | null
          arrival_city: string
          arrival_country: string | null
          arrival_postal_code: string
          company_name: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          created_by: string
          departure_address: string | null
          departure_city: string
          departure_country: string | null
          departure_date: string
          departure_postal_code: string
          description: string | null
          id: number
          max_volume: number | null
          mover_id: number
          mover_name: string | null
          price_per_m3: number | null
          special_requirements: string | null
          status: string
          status_custom: string | null
          total_price: number | null
          truck_id: number
          truck_identifier: string | null
          used_volume: number
        }
        Insert: {
          access_conditions?: string | null
          arrival_address?: string | null
          arrival_city: string
          arrival_country?: string | null
          arrival_postal_code: string
          company_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by: string
          departure_address?: string | null
          departure_city: string
          departure_country?: string | null
          departure_date: string
          departure_postal_code: string
          description?: string | null
          id?: number
          max_volume?: number | null
          mover_id: number
          mover_name?: string | null
          price_per_m3?: number | null
          special_requirements?: string | null
          status?: string
          status_custom?: string | null
          total_price?: number | null
          truck_id: number
          truck_identifier?: string | null
          used_volume: number
        }
        Update: {
          access_conditions?: string | null
          arrival_address?: string | null
          arrival_city?: string
          arrival_country?: string | null
          arrival_postal_code?: string
          company_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string
          departure_address?: string | null
          departure_city?: string
          departure_country?: string | null
          departure_date?: string
          departure_postal_code?: string
          description?: string | null
          id?: number
          max_volume?: number | null
          mover_id?: number
          mover_name?: string | null
          price_per_m3?: number | null
          special_requirements?: string | null
          status?: string
          status_custom?: string | null
          total_price?: number | null
          truck_id?: number
          truck_identifier?: string | null
          used_volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "confirmed_moves_mover_id_fkey"
            columns: ["mover_id"]
            isOneToOne: false
            referencedRelation: "movers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confirmed_moves_truck_id_fkey"
            columns: ["truck_id"]
            isOneToOne: false
            referencedRelation: "trucks"
            referencedColumns: ["id"]
          },
        ]
      }
      match_actions: {
        Row: {
          action_date: string
          action_type: string
          created_at: string
          id: string
          match_id: number
          notes: string | null
          user_id: string | null
        }
        Insert: {
          action_date?: string
          action_type: string
          created_at?: string
          id?: string
          match_id: number
          notes?: string | null
          user_id?: string | null
        }
        Update: {
          action_date?: string
          action_type?: string
          created_at?: string
          id?: string
          match_id?: number
          notes?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      move_matches: {
        Row: {
          client_request_id: number
          combined_volume: number
          created_at: string
          date_diff_days: number
          distance_km: number
          id: number
          is_valid: boolean
          match_type: string
          move_id: number
          volume_ok: boolean
        }
        Insert: {
          client_request_id: number
          combined_volume: number
          created_at?: string
          date_diff_days: number
          distance_km: number
          id?: number
          is_valid: boolean
          match_type: string
          move_id: number
          volume_ok: boolean
        }
        Update: {
          client_request_id?: number
          combined_volume?: number
          created_at?: string
          date_diff_days?: number
          distance_km?: number
          id?: number
          is_valid?: boolean
          match_type?: string
          move_id?: number
          volume_ok?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "move_matches_client_request_id_fkey"
            columns: ["client_request_id"]
            isOneToOne: false
            referencedRelation: "client_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "move_matches_move_id_fkey"
            columns: ["move_id"]
            isOneToOne: false
            referencedRelation: "confirmed_moves"
            referencedColumns: ["id"]
          },
        ]
      }
      movers: {
        Row: {
          company_name: string
          created_at: string
          created_by: string
          email: string
          id: number
          name: string
          phone: string
        }
        Insert: {
          company_name: string
          created_at?: string
          created_by: string
          email: string
          id?: number
          name: string
          phone: string
        }
        Update: {
          company_name?: string
          created_at?: string
          created_by?: string
          email?: string
          id?: number
          name?: string
          phone?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          email: string
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email: string
          id: string
          role: string
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      public_links: {
        Row: {
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          link_token: string
          mover_id: number | null
          password: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          link_token: string
          mover_id?: number | null
          password: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          link_token?: string
          mover_id?: number | null
          password?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_links_mover_id_fkey"
            columns: ["mover_id"]
            isOneToOne: false
            referencedRelation: "movers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_providers: {
        Row: {
          address: string
          city: string
          company_name: string
          coordinates: string | null
          created_at: string | null
          created_by: string | null
          email: string
          id: number
          name: string
          phone: string
          postal_code: string
        }
        Insert: {
          address: string
          city: string
          company_name: string
          coordinates?: string | null
          created_at?: string | null
          created_by?: string | null
          email: string
          id?: number
          name: string
          phone: string
          postal_code: string
        }
        Update: {
          address?: string
          city?: string
          company_name?: string
          coordinates?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string
          id?: number
          name?: string
          phone?: string
          postal_code?: string
        }
        Relationships: []
      }
      trucks: {
        Row: {
          created_at: string
          id: number
          identifier: string
          max_volume: number
          mover_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          identifier: string
          max_volume: number
          mover_id: number
        }
        Update: {
          created_at?: string
          id?: number
          identifier?: string
          max_volume?: number
          mover_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "trucks_mover_id_fkey"
            columns: ["mover_id"]
            isOneToOne: false
            referencedRelation: "movers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      confirm_user_signup: {
        Args: { user_email: string }
        Returns: Json
      }
      generate_public_link_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_random_password: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_all_profiles_admin: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          role: string
          company_name: string
          created_at: string
          updated_at: string
        }[]
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
