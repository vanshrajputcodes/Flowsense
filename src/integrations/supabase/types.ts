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
      alerts: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          message: string
          message_hi: string | null
          resolved_at: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          status: Database["public"]["Enums"]["alert_status"]
          title: string
          title_hi: string | null
          zone_ids: string[] | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          message: string
          message_hi?: string | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          status?: Database["public"]["Enums"]["alert_status"]
          title: string
          title_hi?: string | null
          zone_ids?: string[] | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          message?: string
          message_hi?: string | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          status?: Database["public"]["Enums"]["alert_status"]
          title?: string
          title_hi?: string | null
          zone_ids?: string[] | null
        }
        Relationships: []
      }
      event_registrations: {
        Row: {
          checked_in: boolean
          checked_in_at: string | null
          created_at: string
          email: string | null
          full_name: string
          health_cleared: boolean
          id: string
          phone: string | null
          qr_code: string
          user_id: string | null
          zone_id: string | null
        }
        Insert: {
          checked_in?: boolean
          checked_in_at?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          health_cleared?: boolean
          id?: string
          phone?: string | null
          qr_code: string
          user_id?: string | null
          zone_id?: string | null
        }
        Update: {
          checked_in?: boolean
          checked_in_at?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          health_cleared?: boolean
          id?: string
          phone?: string | null
          qr_code?: string
          user_id?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      facilities: {
        Row: {
          capacity: number | null
          coordinates: Json | null
          created_at: string
          current_usage: number | null
          id: string
          is_available: boolean | null
          name: string
          name_hi: string | null
          type: Database["public"]["Enums"]["facility_type"]
          zone_id: string | null
        }
        Insert: {
          capacity?: number | null
          coordinates?: Json | null
          created_at?: string
          current_usage?: number | null
          id?: string
          is_available?: boolean | null
          name: string
          name_hi?: string | null
          type: Database["public"]["Enums"]["facility_type"]
          zone_id?: string | null
        }
        Update: {
          capacity?: number | null
          coordinates?: Json | null
          created_at?: string
          current_usage?: number | null
          id?: string
          is_available?: boolean | null
          name?: string
          name_hi?: string | null
          type?: Database["public"]["Enums"]["facility_type"]
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facilities_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      health_screenings: {
        Row: {
          created_at: string
          has_fever: boolean
          id: string
          is_cleared: boolean
          notes: string | null
          registration_id: string
          screened_by: string | null
          symptoms: string[] | null
          temperature: number | null
        }
        Insert: {
          created_at?: string
          has_fever?: boolean
          id?: string
          is_cleared?: boolean
          notes?: string | null
          registration_id: string
          screened_by?: string | null
          symptoms?: string[] | null
          temperature?: number | null
        }
        Update: {
          created_at?: string
          has_fever?: boolean
          id?: string
          is_cleared?: boolean
          notes?: string | null
          registration_id?: string
          screened_by?: string | null
          symptoms?: string[] | null
          temperature?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "health_screenings_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "event_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string | null
          id: string
          reported_by: string | null
          resolved_at: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          status: string | null
          title: string
          zone_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reported_by?: string | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          status?: string | null
          title: string
          zone_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reported_by?: string | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          status?: string | null
          title?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incidents_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      lost_child_alerts: {
        Row: {
          camera_location: string | null
          confidence: number | null
          created_at: string
          found_at: string | null
          id: string
          notes: string | null
          registered_face_id: string | null
          screenshot_url: string | null
          status: string
        }
        Insert: {
          camera_location?: string | null
          confidence?: number | null
          created_at?: string
          found_at?: string | null
          id?: string
          notes?: string | null
          registered_face_id?: string | null
          screenshot_url?: string | null
          status?: string
        }
        Update: {
          camera_location?: string | null
          confidence?: number | null
          created_at?: string
          found_at?: string | null
          id?: string
          notes?: string | null
          registered_face_id?: string | null
          screenshot_url?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "lost_child_alerts_registered_face_id_fkey"
            columns: ["registered_face_id"]
            isOneToOne: false
            referencedRelation: "registered_faces"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_location: string | null
          customer_name: string
          customer_phone: string | null
          id: string
          items: Json
          notes: string | null
          order_type: string
          status: string
          total_amount: number | null
          updated_at: string
          user_id: string | null
          zone_id: string | null
        }
        Insert: {
          created_at?: string
          customer_location?: string | null
          customer_name: string
          customer_phone?: string | null
          id?: string
          items?: Json
          notes?: string | null
          order_type: string
          status?: string
          total_amount?: number | null
          updated_at?: string
          user_id?: string | null
          zone_id?: string | null
        }
        Update: {
          created_at?: string
          customer_location?: string | null
          customer_name?: string
          customer_phone?: string | null
          id?: string
          items?: Json
          notes?: string | null
          order_type?: string
          status?: string
          total_amount?: number | null
          updated_at?: string
          user_id?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      pa_announcements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          languages: string[]
          original_text: string
          status: string
          translations: Json
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          languages?: string[]
          original_text: string
          status?: string
          translations?: Json
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          languages?: string[]
          original_text?: string
          status?: string
          translations?: Json
        }
        Relationships: []
      }
      predictions: {
        Row: {
          confidence: number | null
          created_at: string
          factors: Json | null
          id: string
          predicted_count: number
          prediction_for: string
          zone_id: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          factors?: Json | null
          id?: string
          predicted_count: number
          prediction_for: string
          zone_id?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string
          factors?: Json | null
          id?: string
          predicted_count?: number
          prediction_for?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "predictions_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          language: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          language?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          language?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      queue_tokens: {
        Row: {
          called_at: string | null
          created_at: string
          estimated_wait_time: number | null
          id: string
          is_priority: boolean | null
          phone: string | null
          queue_id: string
          served_at: string | null
          status: Database["public"]["Enums"]["token_status"]
          token_number: number
          user_id: string | null
        }
        Insert: {
          called_at?: string | null
          created_at?: string
          estimated_wait_time?: number | null
          id?: string
          is_priority?: boolean | null
          phone?: string | null
          queue_id: string
          served_at?: string | null
          status?: Database["public"]["Enums"]["token_status"]
          token_number: number
          user_id?: string | null
        }
        Update: {
          called_at?: string | null
          created_at?: string
          estimated_wait_time?: number | null
          id?: string
          is_priority?: boolean | null
          phone?: string | null
          queue_id?: string
          served_at?: string | null
          status?: Database["public"]["Enums"]["token_status"]
          token_number?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "queue_tokens_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "queues"
            referencedColumns: ["id"]
          },
        ]
      }
      queues: {
        Row: {
          avg_service_time: number | null
          created_at: string
          current_token: number
          id: string
          max_capacity: number | null
          name: string
          name_hi: string | null
          priority_enabled: boolean | null
          status: Database["public"]["Enums"]["queue_status"]
          updated_at: string
          zone_id: string | null
        }
        Insert: {
          avg_service_time?: number | null
          created_at?: string
          current_token?: number
          id?: string
          max_capacity?: number | null
          name: string
          name_hi?: string | null
          priority_enabled?: boolean | null
          status?: Database["public"]["Enums"]["queue_status"]
          updated_at?: string
          zone_id?: string | null
        }
        Update: {
          avg_service_time?: number | null
          created_at?: string
          current_token?: number
          id?: string
          max_capacity?: number | null
          name?: string
          name_hi?: string | null
          priority_enabled?: boolean | null
          status?: Database["public"]["Enums"]["queue_status"]
          updated_at?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "queues_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      registered_faces: {
        Row: {
          age_approx: number | null
          child_name: string
          created_at: string
          face_descriptor: Json | null
          id: string
          parent_email: string | null
          parent_name: string
          parent_phone: string | null
          photo_url: string | null
          registered_by: string | null
          status: string
        }
        Insert: {
          age_approx?: number | null
          child_name: string
          created_at?: string
          face_descriptor?: Json | null
          id?: string
          parent_email?: string | null
          parent_name: string
          parent_phone?: string | null
          photo_url?: string | null
          registered_by?: string | null
          status?: string
        }
        Update: {
          age_approx?: number | null
          child_name?: string
          created_at?: string
          face_descriptor?: Json | null
          id?: string
          parent_email?: string | null
          parent_name?: string
          parent_phone?: string | null
          photo_url?: string | null
          registered_by?: string | null
          status?: string
        }
        Relationships: []
      }
      sensor_readings: {
        Row: {
          count: number
          flow_rate: number | null
          id: string
          recorded_at: string
          temperature: number | null
          zone_id: string
        }
        Insert: {
          count?: number
          flow_rate?: number | null
          id?: string
          recorded_at?: string
          temperature?: number | null
          zone_id: string
        }
        Update: {
          count?: number
          flow_rate?: number | null
          id?: string
          recorded_at?: string
          temperature?: number | null
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sensor_readings_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      sos_requests: {
        Row: {
          created_at: string
          id: string
          latitude: number | null
          location: string | null
          longitude: number | null
          message: string | null
          phone: string | null
          responded_at: string | null
          responded_by: string | null
          sender_email: string | null
          sender_name: string | null
          status: string
          token_number: string
          user_id: string | null
          zone_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          message?: string | null
          phone?: string | null
          responded_at?: string | null
          responded_by?: string | null
          sender_email?: string | null
          sender_name?: string | null
          status?: string
          token_number: string
          user_id?: string | null
          zone_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          message?: string | null
          phone?: string | null
          responded_at?: string | null
          responded_by?: string | null
          sender_email?: string | null
          sender_name?: string | null
          status?: string
          token_number?: string
          user_id?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sos_requests_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      threat_logs: {
        Row: {
          category: string
          confidence: number
          created_at: string
          description: string | null
          id: string
          notes: string | null
          object: string
          reviewed: boolean
          reviewed_at: string | null
          reviewed_by: string | null
          screenshot_url: string | null
          severity: string
          zone_id: string | null
        }
        Insert: {
          category?: string
          confidence?: number
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          object: string
          reviewed?: boolean
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_url?: string | null
          severity?: string
          zone_id?: string | null
        }
        Update: {
          category?: string
          confidence?: number
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          object?: string
          reviewed?: boolean
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_url?: string | null
          severity?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "threat_logs_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
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
      visitor_locations: {
        Row: {
          created_at: string
          id: string
          last_seen: string
          latitude: number
          longitude: number
          map_x: number
          map_y: number
          session_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_seen?: string
          latitude: number
          longitude: number
          map_x?: number
          map_y?: number
          session_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_seen?: string
          latitude?: number
          longitude?: number
          map_x?: number
          map_y?: number
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      zones: {
        Row: {
          capacity: number
          coordinates: Json | null
          created_at: string
          current_count: number
          description: string | null
          id: string
          name: string
          name_hi: string | null
          parent_zone_id: string | null
          status: Database["public"]["Enums"]["zone_status"]
          updated_at: string
        }
        Insert: {
          capacity?: number
          coordinates?: Json | null
          created_at?: string
          current_count?: number
          description?: string | null
          id?: string
          name: string
          name_hi?: string | null
          parent_zone_id?: string | null
          status?: Database["public"]["Enums"]["zone_status"]
          updated_at?: string
        }
        Update: {
          capacity?: number
          coordinates?: Json | null
          created_at?: string
          current_count?: number
          description?: string | null
          id?: string
          name?: string
          name_hi?: string | null
          parent_zone_id?: string | null
          status?: Database["public"]["Enums"]["zone_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "zones_parent_zone_id_fkey"
            columns: ["parent_zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      alert_severity: "info" | "warning" | "critical" | "emergency"
      alert_status: "active" | "resolved" | "expired"
      app_role: "admin" | "moderator" | "visitor"
      facility_type:
        | "washroom"
        | "medical"
        | "water"
        | "food"
        | "parking"
        | "information"
        | "prayer"
        | "rest_area"
      queue_status: "active" | "paused" | "closed"
      token_status: "waiting" | "called" | "served" | "cancelled" | "expired"
      zone_status: "green" | "yellow" | "red" | "critical"
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
      alert_severity: ["info", "warning", "critical", "emergency"],
      alert_status: ["active", "resolved", "expired"],
      app_role: ["admin", "moderator", "visitor"],
      facility_type: [
        "washroom",
        "medical",
        "water",
        "food",
        "parking",
        "information",
        "prayer",
        "rest_area",
      ],
      queue_status: ["active", "paused", "closed"],
      token_status: ["waiting", "called", "served", "cancelled", "expired"],
      zone_status: ["green", "yellow", "red", "critical"],
    },
  },
} as const
