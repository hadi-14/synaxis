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
    PostgrestVersion: "17.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          entity: string
          entity_id: string | null
          id: number
          note: string | null
          team_id: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: never
          note?: string | null
          team_id?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: never
          note?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      checkins: {
        Row: {
          checked_in_by: string | null
          created_at: string
          day_no: number
          id: number
          module_id: number | null
          team_id: string
        }
        Insert: {
          checked_in_by?: string | null
          created_at?: string
          day_no: number
          id?: never
          module_id?: number | null
          team_id: string
        }
        Update: {
          checked_in_by?: string | null
          created_at?: string
          day_no?: number
          id?: never
          module_id?: number | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkins_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      council_members: {
        Row: {
          bio: string | null
          email: string | null
          id: number
          instagram: string | null
          is_published: boolean
          linkedin: string | null
          module_id: number | null
          name: string
          photo_url: string | null
          role: string
          sort: number
          tier: string
        }
        Insert: {
          bio?: string | null
          email?: string | null
          id?: never
          instagram?: string | null
          is_published?: boolean
          linkedin?: string | null
          module_id?: number | null
          name: string
          photo_url?: string | null
          role: string
          sort?: number
          tier?: string
        }
        Update: {
          bio?: string | null
          email?: string | null
          id?: never
          instagram?: string | null
          is_published?: boolean
          linkedin?: string | null
          module_id?: number | null
          name?: string
          photo_url?: string | null
          role?: string
          sort?: number
          tier?: string
        }
        Relationships: [
          {
            foreignKeyName: "council_members_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string
          error: string | null
          id: number
          provider_id: string | null
          sent_by: string | null
          status: string
          subject: string
          team_id: string | null
          template: string
          to_email: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: never
          provider_id?: string | null
          sent_by?: string | null
          status: string
          subject: string
          team_id?: string | null
          template: string
          to_email: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: never
          provider_id?: string | null
          sent_by?: string | null
          status?: string
          subject?: string
          team_id?: string | null
          template?: string
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer: string
          category: string
          id: number
          is_published: boolean
          question: string
          sort: number
        }
        Insert: {
          answer: string
          category?: string
          id?: never
          is_published?: boolean
          question: string
          sort?: number
        }
        Update: {
          answer?: string
          category?: string
          id?: never
          is_published?: boolean
          question?: string
          sort?: number
        }
        Relationships: []
      }
      module_allocations: {
        Row: {
          allocated_at: string
          allocated_by: string | null
          module_id: number
          team_id: string
        }
        Insert: {
          allocated_at?: string
          allocated_by?: string | null
          module_id: number
          team_id: string
        }
        Update: {
          allocated_at?: string
          allocated_by?: string | null
          module_id?: number
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_allocations_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_allocations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      module_categories: {
        Row: {
          id: number
          name: string
          sort: number
        }
        Insert: {
          id?: never
          name: string
          sort?: number
        }
        Update: {
          id?: never
          name?: string
          sort?: number
        }
        Relationships: []
      }
      module_preferences: {
        Row: {
          module_id: number
          rank: number
          team_id: string
        }
        Insert: {
          module_id: number
          rank: number
          team_id: string
        }
        Update: {
          module_id?: number
          rank?: number
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_preferences_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_preferences_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          accent: string
          brochure_number: number | null
          capacity: number | null
          category_id: number | null
          character: string
          character_role: string
          character_tie_in: string
          cohead_member_id: number | null
          cohead_name: string
          description: string
          format: string
          head_member_id: number | null
          head_name: string
          id: number
          ideal_for: string[]
          is_active: boolean
          is_compulsory: boolean
          motif: string
          name: string
          overview: string
          rules_highlights: Json
          schedule_slot: string
          skills_tested: string[]
          slug: string
          sort: number
          subject: string
          tagline: string
          team_size_note: string
          updated_at: string
        }
        Insert: {
          accent?: string
          brochure_number?: number | null
          capacity?: number | null
          category_id?: number | null
          character: string
          character_role?: string
          character_tie_in?: string
          cohead_member_id?: number | null
          cohead_name?: string
          description?: string
          format?: string
          head_member_id?: number | null
          head_name?: string
          id?: never
          ideal_for?: string[]
          is_active?: boolean
          is_compulsory?: boolean
          motif?: string
          name: string
          overview?: string
          rules_highlights?: Json
          schedule_slot?: string
          skills_tested?: string[]
          slug: string
          sort?: number
          subject: string
          tagline?: string
          team_size_note?: string
          updated_at?: string
        }
        Update: {
          accent?: string
          brochure_number?: number | null
          capacity?: number | null
          category_id?: number | null
          character?: string
          character_role?: string
          character_tie_in?: string
          cohead_member_id?: number | null
          cohead_name?: string
          description?: string
          format?: string
          head_member_id?: number | null
          head_name?: string
          id?: never
          ideal_for?: string[]
          is_active?: boolean
          is_compulsory?: boolean
          motif?: string
          name?: string
          overview?: string
          rules_highlights?: Json
          schedule_slot?: string
          skills_tested?: string[]
          slug?: string
          sort?: number
          subject?: string
          tagline?: string
          team_size_note?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_cohead_member_id_fkey"
            columns: ["cohead_member_id"]
            isOneToOne: false
            referencedRelation: "council_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modules_head_member_id_fkey"
            columns: ["head_member_id"]
            isOneToOne: false
            referencedRelation: "council_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "module_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_details: {
        Row: {
          account_number: string
          account_title: string
          bank_name: string
          iban: string
          id: number
          instructions: string
          receipt_whatsapp: string
          updated_at: string
        }
        Insert: {
          account_number?: string
          account_title?: string
          bank_name?: string
          iban?: string
          id?: number
          instructions?: string
          receipt_whatsapp?: string
          updated_at?: string
        }
        Update: {
          account_number?: string
          account_title?: string
          bank_name?: string
          iban?: string
          id?: number
          instructions?: string
          receipt_whatsapp?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          fee_breakdown: Json
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          receipt_path: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["payment_status"]
          team_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          fee_breakdown: Json
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          receipt_path?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          team_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          fee_breakdown?: Json
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          receipt_path?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          hits: number
          key: string
          window_start: string
        }
        Insert: {
          hits: number
          key: string
          window_start: string
        }
        Update: {
          hits?: number
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      registration_drafts: {
        Row: {
          data: Json
          owner_id: string
          step: number
          updated_at: string
        }
        Insert: {
          data?: Json
          owner_id: string
          step?: number
          updated_at?: string
        }
        Update: {
          data?: Json
          owner_id?: string
          step?: number
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          announcement: string
          announcement_active: boolean
          best_institute_min_teams: number
          contact_email: string
          contact_whatsapp: string
          delegation_fee_early: number
          delegation_fee_regular: number
          early_bird_deadline: string
          early_fee: number
          event_end: string
          event_start: string
          id: number
          instagram_url: string
          internal_email_domain: string
          modules_max: number
          modules_min: number
          payment_deadline: string
          registration_closes_at: string
          registration_open: boolean
          registration_opens_at: string
          regular_fee: number
          season_label: string
          team_max: number
          team_min: number
          updated_at: string
          venue_address: string
          venue_map_url: string
          venue_name: string
          waiver_template_url: string
        }
        Insert: {
          announcement?: string
          announcement_active?: boolean
          best_institute_min_teams?: number
          contact_email?: string
          contact_whatsapp?: string
          delegation_fee_early?: number
          delegation_fee_regular?: number
          early_bird_deadline?: string
          early_fee?: number
          event_end?: string
          event_start?: string
          id?: number
          instagram_url?: string
          internal_email_domain?: string
          modules_max?: number
          modules_min?: number
          payment_deadline?: string
          registration_closes_at?: string
          registration_open?: boolean
          registration_opens_at?: string
          regular_fee?: number
          season_label?: string
          team_max?: number
          team_min?: number
          updated_at?: string
          venue_address?: string
          venue_map_url?: string
          venue_name?: string
          waiver_template_url?: string
        }
        Update: {
          announcement?: string
          announcement_active?: boolean
          best_institute_min_teams?: number
          contact_email?: string
          contact_whatsapp?: string
          delegation_fee_early?: number
          delegation_fee_regular?: number
          early_bird_deadline?: string
          early_fee?: number
          event_end?: string
          event_start?: string
          id?: number
          instagram_url?: string
          internal_email_domain?: string
          modules_max?: number
          modules_min?: number
          payment_deadline?: string
          registration_closes_at?: string
          registration_open?: boolean
          registration_opens_at?: string
          regular_fee?: number
          season_label?: string
          team_max?: number
          team_min?: number
          updated_at?: string
          venue_address?: string
          venue_map_url?: string
          venue_name?: string
          waiver_template_url?: string
        }
        Relationships: []
      }
      sponsor_inquiries: {
        Row: {
          created_at: string
          email: string
          handled: boolean
          id: number
          interest: string | null
          message: string
          name: string
          organisation: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          email: string
          handled?: boolean
          id?: never
          interest?: string | null
          message: string
          name: string
          organisation: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          handled?: boolean
          id?: never
          interest?: string | null
          message?: string
          name?: string
          organisation?: string
          phone?: string | null
        }
        Relationships: []
      }
      sponsors: {
        Row: {
          blurb: string | null
          id: number
          is_published: boolean
          logo_url: string | null
          name: string
          sort: number
          tier: string
          url: string | null
        }
        Insert: {
          blurb?: string | null
          id?: never
          is_published?: boolean
          logo_url?: string | null
          name: string
          sort?: number
          tier?: string
          url?: string | null
        }
        Update: {
          blurb?: string | null
          id?: never
          is_published?: boolean
          logo_url?: string | null
          name?: string
          sort?: number
          tier?: string
          url?: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string
          email: string
          full_name: string
          grade: string
          id: string
          institution: string
          is_head: boolean
          phone: string
          position: number
          team_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          grade: string
          id?: string
          institution: string
          is_head?: boolean
          phone: string
          position: number
          team_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          grade?: string
          id?: string
          institution?: string
          is_head?: boolean
          phone?: string
          position?: number
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          admin_notes: string | null
          checkin_token: string
          city: string
          consents: Json
          delegation_type: Database["public"]["Enums"]["delegation_type"]
          fee_breakdown: Json
          fee_tier: string
          guardian_name: string
          guardian_phone: string
          head_alt_phone: string | null
          head_email: string
          head_grade: string
          head_name: string
          head_whatsapp: string
          heard_from: string
          heard_from_other: string | null
          id: string
          institution: string
          member_count: number
          needs: string | null
          owner_id: string
          reg_code: string
          reg_no: number
          status: Database["public"]["Enums"]["team_status"]
          submitted_at: string
          team_name: string
          team_name_key: string | null
          total_fee: number
          updated_at: string
          whatsapp_shared_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          checkin_token?: string
          city: string
          consents?: Json
          delegation_type: Database["public"]["Enums"]["delegation_type"]
          fee_breakdown: Json
          fee_tier: string
          guardian_name: string
          guardian_phone: string
          head_alt_phone?: string | null
          head_email: string
          head_grade: string
          head_name: string
          head_whatsapp: string
          heard_from: string
          heard_from_other?: string | null
          id?: string
          institution: string
          member_count: number
          needs?: string | null
          owner_id: string
          reg_code: string
          reg_no?: never
          status?: Database["public"]["Enums"]["team_status"]
          submitted_at?: string
          team_name: string
          team_name_key?: string | null
          total_fee: number
          updated_at?: string
          whatsapp_shared_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          checkin_token?: string
          city?: string
          consents?: Json
          delegation_type?: Database["public"]["Enums"]["delegation_type"]
          fee_breakdown?: Json
          fee_tier?: string
          guardian_name?: string
          guardian_phone?: string
          head_alt_phone?: string | null
          head_email?: string
          head_grade?: string
          head_name?: string
          head_whatsapp?: string
          heard_from?: string
          heard_from_other?: string | null
          id?: string
          institution?: string
          member_count?: number
          needs?: string | null
          owner_id?: string
          reg_code?: string
          reg_no?: never
          status?: Database["public"]["Enums"]["team_status"]
          submitted_at?: string
          team_name?: string
          team_name_key?: string | null
          total_fee?: number
          updated_at?: string
          whatsapp_shared_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: number
          module_id: number | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: never
          module_id?: number | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: never
          module_id?: number | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      waivers: {
        Row: {
          file_path: string
          id: string
          member_id: string | null
          received: boolean
          received_at: string | null
          received_by: string | null
          team_id: string
          uploaded_at: string
        }
        Insert: {
          file_path: string
          id?: string
          member_id?: string | null
          received?: boolean
          received_at?: string | null
          received_by?: string | null
          team_id: string
          uploaded_at?: string
        }
        Update: {
          file_path?: string
          id?: string
          member_id?: string | null
          received?: boolean
          received_at?: string | null
          received_by?: string | null
          team_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "waivers_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waivers_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      rate_limit_hit: {
        Args: { p_key: string; p_max: number; p_window_seconds: number }
        Returns: boolean
      }
      save_team: {
        Args: {
          p_compulsory_ids: number[]
          p_members: Json
          p_module_ids: number[]
          p_owner: string
          p_team: Json
          p_team_id: string
        }
        Returns: {
          admin_notes: string | null
          checkin_token: string
          city: string
          consents: Json
          delegation_type: Database["public"]["Enums"]["delegation_type"]
          fee_breakdown: Json
          fee_tier: string
          guardian_name: string
          guardian_phone: string
          head_alt_phone: string | null
          head_email: string
          head_grade: string
          head_name: string
          head_whatsapp: string
          heard_from: string
          heard_from_other: string | null
          id: string
          institution: string
          member_count: number
          needs: string | null
          owner_id: string
          reg_code: string
          reg_no: number
          status: Database["public"]["Enums"]["team_status"]
          submitted_at: string
          team_name: string
          team_name_key: string | null
          total_fee: number
          updated_at: string
          whatsapp_shared_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "teams"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "super_admin" | "finance" | "module_head"
      delegation_type: "internal" | "external_official" | "external_independent"
      payment_method: "upload" | "whatsapp"
      payment_status:
        | "under_review"
        | "verified"
        | "rejected"
        | "reupload_requested"
      team_status:
        | "draft"
        | "pending_payment"
        | "under_review"
        | "verified"
        | "rejected"
        | "reupload_requested"
        | "waiver_pending"
        | "modules_allocated"
        | "cancelled"
        | "checked_in"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["super_admin", "finance", "module_head"],
      delegation_type: [
        "internal",
        "external_official",
        "external_independent",
      ],
      payment_method: ["upload", "whatsapp"],
      payment_status: [
        "under_review",
        "verified",
        "rejected",
        "reupload_requested",
      ],
      team_status: [
        "draft",
        "pending_payment",
        "under_review",
        "verified",
        "rejected",
        "reupload_requested",
        "waiver_pending",
        "modules_allocated",
        "cancelled",
        "checked_in",
      ],
    },
  },
} as const
