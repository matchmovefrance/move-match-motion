export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id: string
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string
          table_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          access_conditions: string | null
          arrival_address: string | null
          arrival_city: string | null
          arrival_country: string | null
          arrival_postal_code: string | null
          budget_max: number | null
          budget_min: number | null
          client_reference: string | null
          created_at: string | null
          created_by: string
          date_range_end: string | null
          date_range_start: string | null
          departure_address: string | null
          departure_city: string | null
          departure_country: string | null
          departure_postal_code: string | null
          departure_time: string | null
          description: string | null
          desired_date: string | null
          email: string
          estimated_arrival_date: string | null
          estimated_arrival_time: string | null
          estimated_volume: number | null
          flexibility_days: number | null
          flexible_dates: boolean | null
          id: number
          inventory_list: string | null
          is_matched: boolean | null
          match_status: string | null
          matched_at: string | null
          name: string
          phone: string
          quote_amount: number | null
          special_requirements: string | null
          status: string | null
        }
        Insert: {
          access_conditions?: string | null
          arrival_address?: string | null
          arrival_city?: string | null
          arrival_country?: string | null
          arrival_postal_code?: string | null
          budget_max?: number | null
          budget_min?: number | null
          client_reference?: string | null
          created_at?: string | null
          created_by: string
          date_range_end?: string | null
          date_range_start?: string | null
          departure_address?: string | null
          departure_city?: string | null
          departure_country?: string | null
          departure_postal_code?: string | null
          departure_time?: string | null
          description?: string | null
          desired_date?: string | null
          email: string
          estimated_arrival_date?: string | null
          estimated_arrival_time?: string | null
          estimated_volume?: number | null
          flexibility_days?: number | null
          flexible_dates?: boolean | null
          id?: number
          inventory_list?: string | null
          is_matched?: boolean | null
          match_status?: string | null
          matched_at?: string | null
          name: string
          phone: string
          quote_amount?: number | null
          special_requirements?: string | null
          status?: string | null
        }
        Update: {
          access_conditions?: string | null
          arrival_address?: string | null
          arrival_city?: string | null
          arrival_country?: string | null
          arrival_postal_code?: string | null
          budget_max?: number | null
          budget_min?: number | null
          client_reference?: string | null
          created_at?: string | null
          created_by?: string
          date_range_end?: string | null
          date_range_start?: string | null
          departure_address?: string | null
          departure_city?: string | null
          departure_country?: string | null
          departure_postal_code?: string | null
          departure_time?: string | null
          description?: string | null
          desired_date?: string | null
          email?: string
          estimated_arrival_date?: string | null
          estimated_arrival_time?: string | null
          estimated_volume?: number | null
          flexibility_days?: number | null
          flexible_dates?: boolean | null
          id?: number
          inventory_list?: string | null
          is_matched?: boolean | null
          match_status?: string | null
          matched_at?: string | null
          name?: string
          phone?: string
          quote_amount?: number | null
          special_requirements?: string | null
          status?: string | null
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          address: string | null
          company_address: string
          company_email: string
          company_name: string
          company_phone: string
          created_at: string | null
          email: string | null
          id: number
          phone: string | null
          pricing_margin: number | null
          siret: string | null
          smtp_auth_method: string | null
          smtp_enabled: boolean
          smtp_from_name: string | null
          smtp_host: string | null
          smtp_password: string | null
          smtp_port: number | null
          smtp_reply_to: string | null
          smtp_secure: boolean | null
          smtp_timeout: number | null
          smtp_username: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          company_address?: string
          company_email?: string
          company_name?: string
          company_phone?: string
          created_at?: string | null
          email?: string | null
          id?: number
          phone?: string | null
          pricing_margin?: number | null
          siret?: string | null
          smtp_auth_method?: string | null
          smtp_enabled?: boolean
          smtp_from_name?: string | null
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_reply_to?: string | null
          smtp_secure?: boolean | null
          smtp_timeout?: number | null
          smtp_username?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          company_address?: string
          company_email?: string
          company_name?: string
          company_phone?: string
          created_at?: string | null
          email?: string | null
          id?: number
          phone?: string | null
          pricing_margin?: number | null
          siret?: string | null
          smtp_auth_method?: string | null
          smtp_enabled?: boolean
          smtp_from_name?: string | null
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_reply_to?: string | null
          smtp_secure?: boolean | null
          smtp_timeout?: number | null
          smtp_username?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      confirmed_moves: {
        Row: {
          access_conditions: string | null
          additional_fees: number | null
          arrival_address: string | null
          arrival_city: string
          arrival_country: string | null
          arrival_postal_code: string
          arrival_time: string | null
          available_volume: number | null
          base_rate: number | null
          company_name: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          created_by: string
          departure_address: string | null
          departure_city: string
          departure_country: string | null
          departure_date: string
          departure_postal_code: string
          departure_time: string | null
          description: string | null
          equipment_available: string | null
          estimated_arrival_date: string | null
          estimated_arrival_time: string | null
          fuel_surcharge: number | null
          id: number
          insurance_details: string | null
          max_volume: number | null
          max_weight: number | null
          mover_id: number
          mover_name: string | null
          number_of_clients: number | null
          price_per_m3: number | null
          route_type: string | null
          special_conditions: string | null
          special_requirements: string | null
          status: string | null
          status_custom: string | null
          total_cost: number | null
          total_price: number | null
          truck_id: number
          truck_identifier: string | null
          truck_type: string | null
          used_volume: number
        }
        Insert: {
          access_conditions?: string | null
          additional_fees?: number | null
          arrival_address?: string | null
          arrival_city: string
          arrival_country?: string | null
          arrival_postal_code: string
          arrival_time?: string | null
          available_volume?: number | null
          base_rate?: number | null
          company_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          created_by: string
          departure_address?: string | null
          departure_city: string
          departure_country?: string | null
          departure_date: string
          departure_postal_code: string
          departure_time?: string | null
          description?: string | null
          equipment_available?: string | null
          estimated_arrival_date?: string | null
          estimated_arrival_time?: string | null
          fuel_surcharge?: number | null
          id?: number
          insurance_details?: string | null
          max_volume?: number | null
          max_weight?: number | null
          mover_id: number
          mover_name?: string | null
          number_of_clients?: number | null
          price_per_m3?: number | null
          route_type?: string | null
          special_conditions?: string | null
          special_requirements?: string | null
          status?: string | null
          status_custom?: string | null
          total_cost?: number | null
          total_price?: number | null
          truck_id: number
          truck_identifier?: string | null
          truck_type?: string | null
          used_volume?: number
        }
        Update: {
          access_conditions?: string | null
          additional_fees?: number | null
          arrival_address?: string | null
          arrival_city?: string
          arrival_country?: string | null
          arrival_postal_code?: string
          arrival_time?: string | null
          available_volume?: number | null
          base_rate?: number | null
          company_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          created_by?: string
          departure_address?: string | null
          departure_city?: string
          departure_country?: string | null
          departure_date?: string
          departure_postal_code?: string
          departure_time?: string | null
          description?: string | null
          equipment_available?: string | null
          estimated_arrival_date?: string | null
          estimated_arrival_time?: string | null
          fuel_surcharge?: number | null
          id?: number
          insurance_details?: string | null
          max_volume?: number | null
          max_weight?: number | null
          mover_id?: number
          mover_name?: string | null
          number_of_clients?: number | null
          price_per_m3?: number | null
          route_type?: string | null
          special_conditions?: string | null
          special_requirements?: string | null
          status?: string | null
          status_custom?: string | null
          total_cost?: number | null
          total_price?: number | null
          truck_id?: number
          truck_identifier?: string | null
          truck_type?: string | null
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
          {
            foreignKeyName: "fk_confirmed_moves_mover_id"
            columns: ["mover_id"]
            isOneToOne: false
            referencedRelation: "movers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_confirmed_moves_truck_id"
            columns: ["truck_id"]
            isOneToOne: false
            referencedRelation: "trucks"
            referencedColumns: ["id"]
          },
        ]
      }
      furniture_volumes: {
        Row: {
          category: string
          created_at: string
          custom_volume: number
          default_volume: number
          furniture_id: string
          furniture_name: string
          id: string
          modified_by: string | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          custom_volume: number
          default_volume: number
          furniture_id: string
          furniture_name: string
          id?: string
          modified_by?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          custom_volume?: number
          default_volume?: number
          furniture_id?: string
          furniture_name?: string
          id?: string
          modified_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      inventories: {
        Row: {
          arrival_address: string | null
          arrival_carrying_distance: number | null
          arrival_elevator_size: string | null
          arrival_floor: number | null
          arrival_has_elevator: boolean | null
          arrival_has_freight_elevator: boolean | null
          arrival_location_type: string | null
          arrival_parking_needed: boolean | null
          arrival_postal_code: string
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          client_reference: string | null
          created_at: string
          created_by: string | null
          departure_address: string | null
          departure_carrying_distance: number | null
          departure_elevator_size: string | null
          departure_floor: number | null
          departure_has_elevator: boolean | null
          departure_has_freight_elevator: boolean | null
          departure_location_type: string | null
          departure_parking_needed: boolean | null
          departure_postal_code: string
          distance_km: number | null
          distance_km_calculated: number | null
          id: string
          notes: string | null
          selected_items: Json
          total_volume: number
          total_weight: number | null
          truck_recommendation: Json | null
          updated_at: string
        }
        Insert: {
          arrival_address?: string | null
          arrival_carrying_distance?: number | null
          arrival_elevator_size?: string | null
          arrival_floor?: number | null
          arrival_has_elevator?: boolean | null
          arrival_has_freight_elevator?: boolean | null
          arrival_location_type?: string | null
          arrival_parking_needed?: boolean | null
          arrival_postal_code: string
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          client_reference?: string | null
          created_at?: string
          created_by?: string | null
          departure_address?: string | null
          departure_carrying_distance?: number | null
          departure_elevator_size?: string | null
          departure_floor?: number | null
          departure_has_elevator?: boolean | null
          departure_has_freight_elevator?: boolean | null
          departure_location_type?: string | null
          departure_parking_needed?: boolean | null
          departure_postal_code: string
          distance_km?: number | null
          distance_km_calculated?: number | null
          id?: string
          notes?: string | null
          selected_items: Json
          total_volume: number
          total_weight?: number | null
          truck_recommendation?: Json | null
          updated_at?: string
        }
        Update: {
          arrival_address?: string | null
          arrival_carrying_distance?: number | null
          arrival_elevator_size?: string | null
          arrival_floor?: number | null
          arrival_has_elevator?: boolean | null
          arrival_has_freight_elevator?: boolean | null
          arrival_location_type?: string | null
          arrival_parking_needed?: boolean | null
          arrival_postal_code?: string
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          client_reference?: string | null
          created_at?: string
          created_by?: string | null
          departure_address?: string | null
          departure_carrying_distance?: number | null
          departure_elevator_size?: string | null
          departure_floor?: number | null
          departure_has_elevator?: boolean | null
          departure_has_freight_elevator?: boolean | null
          departure_location_type?: string | null
          departure_parking_needed?: boolean | null
          departure_postal_code?: string
          distance_km?: number | null
          distance_km_calculated?: number | null
          id?: string
          notes?: string | null
          selected_items?: Json
          total_volume?: number
          total_weight?: number | null
          truck_recommendation?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      match_actions: {
        Row: {
          action_date: string | null
          action_type: string
          created_at: string | null
          id: string
          match_id: number
          notes: string | null
          user_id: string | null
        }
        Insert: {
          action_date?: string | null
          action_type: string
          created_at?: string | null
          id?: string
          match_id: number
          notes?: string | null
          user_id?: string | null
        }
        Update: {
          action_date?: string | null
          action_type?: string
          created_at?: string | null
          id?: string
          match_id?: number
          notes?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_actions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "move_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      move_matches: {
        Row: {
          client_id: number
          combined_volume: number
          created_at: string | null
          date_diff_days: number
          distance_km: number
          id: number
          is_valid: boolean
          match_type: string
          move_id: number
          trip_type: string | null
          volume_ok: boolean
        }
        Insert: {
          client_id: number
          combined_volume: number
          created_at?: string | null
          date_diff_days: number
          distance_km: number
          id?: number
          is_valid: boolean
          match_type: string
          move_id: number
          trip_type?: string | null
          volume_ok: boolean
        }
        Update: {
          client_id?: number
          combined_volume?: number
          created_at?: string | null
          date_diff_days?: number
          distance_km?: number
          id?: number
          is_valid?: boolean
          match_type?: string
          move_id?: number
          trip_type?: string | null
          volume_ok?: boolean
        }
        Relationships: [
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
          created_at: string | null
          created_by: string
          email: string
          id: number
          name: string
          phone: string
        }
        Insert: {
          company_name: string
          created_at?: string | null
          created_by: string
          email: string
          id?: number
          name: string
          phone: string
        }
        Update: {
          company_name?: string
          created_at?: string | null
          created_by?: string
          email?: string
          id?: number
          name?: string
          phone?: string
        }
        Relationships: []
      }
      pricing_opportunities: {
        Row: {
          ai_price_suggestion: Json | null
          arrival_address: string
          arrival_city: string
          arrival_country: string | null
          arrival_postal_code: string
          budget_range_max: number | null
          budget_range_min: number | null
          client_request_id: number | null
          created_at: string | null
          created_by: string
          date_range_end: string | null
          date_range_start: string | null
          departure_address: string
          departure_city: string
          departure_country: string | null
          departure_postal_code: string
          description: string | null
          desired_date: string
          estimated_volume: number
          flexible_dates: boolean | null
          id: string
          priority: number | null
          special_requirements: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          ai_price_suggestion?: Json | null
          arrival_address: string
          arrival_city: string
          arrival_country?: string | null
          arrival_postal_code: string
          budget_range_max?: number | null
          budget_range_min?: number | null
          client_request_id?: number | null
          created_at?: string | null
          created_by: string
          date_range_end?: string | null
          date_range_start?: string | null
          departure_address: string
          departure_city: string
          departure_country?: string | null
          departure_postal_code: string
          description?: string | null
          desired_date: string
          estimated_volume: number
          flexible_dates?: boolean | null
          id?: string
          priority?: number | null
          special_requirements?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          ai_price_suggestion?: Json | null
          arrival_address?: string
          arrival_city?: string
          arrival_country?: string | null
          arrival_postal_code?: string
          budget_range_max?: number | null
          budget_range_min?: number | null
          client_request_id?: number | null
          created_at?: string | null
          created_by?: string
          date_range_end?: string | null
          date_range_start?: string | null
          departure_address?: string
          departure_city?: string
          departure_country?: string | null
          departure_postal_code?: string
          description?: string | null
          desired_date?: string
          estimated_volume?: number
          flexible_dates?: boolean | null
          id?: string
          priority?: number | null
          special_requirements?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_opportunities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_rules: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          is_active: boolean | null
          rule_config: Json
          rule_name: string
          supplier_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          is_active?: boolean | null
          rule_config?: Json
          rule_name: string
          supplier_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          is_active?: boolean | null
          rule_config?: Json
          rule_name?: string
          supplier_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_rules_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
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
          link_type: string
          mover_id: number | null
          password: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          link_token: string
          link_type?: string
          mover_id?: number | null
          password: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          link_token?: string
          link_type?: string
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
      quotes: {
        Row: {
          bid_amount: number
          cost_breakdown: Json | null
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          opportunity_id: string
          response_time_hours: number | null
          status: string | null
          submitted_at: string | null
          supplier_id: string
          updated_at: string | null
          valid_until: string | null
        }
        Insert: {
          bid_amount: number
          cost_breakdown?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          opportunity_id: string
          response_time_hours?: number | null
          status?: string | null
          submitted_at?: string | null
          supplier_id: string
          updated_at?: string | null
          valid_until?: string | null
        }
        Update: {
          bid_amount?: number
          cost_breakdown?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          opportunity_id?: string
          response_time_hours?: number | null
          status?: string | null
          submitted_at?: string | null
          supplier_id?: string
          updated_at?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "pricing_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
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
      supplier_links: {
        Row: {
          created_at: string | null
          created_by: string
          expires_at: string
          id: string
          is_active: boolean | null
          link_token: string
          password: string
          supplier_id: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          expires_at?: string
          id?: string
          is_active?: boolean | null
          link_token: string
          password: string
          supplier_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          expires_at?: string
          id?: string
          is_active?: boolean | null
          link_token?: string
          password?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_links_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string
          city: string
          company_name: string
          contact_name: string
          country: string | null
          created_at: string | null
          created_by: string
          email: string
          id: string
          is_active: boolean | null
          performance_metrics: Json | null
          phone: string
          postal_code: string
          pricing_model: Json | null
          priority_level: number | null
          service_provider_id: number | null
          updated_at: string | null
        }
        Insert: {
          address: string
          city: string
          company_name: string
          contact_name: string
          country?: string | null
          created_at?: string | null
          created_by: string
          email: string
          id?: string
          is_active?: boolean | null
          performance_metrics?: Json | null
          phone: string
          postal_code: string
          pricing_model?: Json | null
          priority_level?: number | null
          service_provider_id?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          city?: string
          company_name?: string
          contact_name?: string
          country?: string | null
          created_at?: string | null
          created_by?: string
          email?: string
          id?: string
          is_active?: boolean | null
          performance_metrics?: Json | null
          phone?: string
          postal_code?: string
          pricing_model?: Json | null
          priority_level?: number | null
          service_provider_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suppliers_service_provider_id_fkey"
            columns: ["service_provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      trucks: {
        Row: {
          created_at: string | null
          id: number
          identifier: string
          max_volume: number
          mover_id: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          identifier: string
          max_volume: number
          mover_id: number
        }
        Update: {
          created_at?: string | null
          id?: number
          identifier?: string
          max_volume?: number
          mover_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_trucks_mover_id"
            columns: ["mover_id"]
            isOneToOne: false
            referencedRelation: "movers"
            referencedColumns: ["id"]
          },
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
      delete_user_and_data: {
        Args: { user_uuid: string }
        Returns: undefined
      }
      generate_public_link_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_random_password: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_all_profiles: {
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
