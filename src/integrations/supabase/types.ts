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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          created_at: string
          id: string
          personal_statement: string | null
          program_id: string | null
          research_plan: string | null
          resume_content: string | null
          status: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          personal_statement?: string | null
          program_id?: string | null
          research_plan?: string | null
          resume_content?: string | null
          status?: number | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          personal_statement?: string | null
          program_id?: string | null
          research_plan?: string | null
          resume_content?: string | null
          status?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          course_code: string | null
          course_name: string
          course_type: string | null
          created_at: string
          credits: number
          gpa_points: number | null
          grade: string
          id: string
          semester: string
          transcript_id: string
        }
        Insert: {
          course_code?: string | null
          course_name: string
          course_type?: string | null
          created_at?: string
          credits: number
          gpa_points?: number | null
          grade: string
          id?: string
          semester: string
          transcript_id: string
        }
        Update: {
          course_code?: string | null
          course_name?: string
          course_type?: string | null
          created_at?: string
          credits?: number
          gpa_points?: number | null
          grade?: string
          id?: string
          semester?: string
          transcript_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grades_transcript_id_fkey"
            columns: ["transcript_id"]
            isOneToOne: false
            referencedRelation: "transcripts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          graduation_year: number | null
          id: string
          major: string | null
          phone: string | null
          target_countries: string[] | null
          target_degree: string | null
          university: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          graduation_year?: number | null
          id?: string
          major?: string | null
          phone?: string | null
          target_countries?: string[] | null
          target_degree?: string | null
          university?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          graduation_year?: number | null
          id?: string
          major?: string | null
          phone?: string | null
          target_countries?: string[] | null
          target_degree?: string | null
          university?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          application_deadline: string | null
          avg_gpa: number | null
          created_at: string
          degree_level: string
          duration_years: number | null
          field: string | null
          id: string
          language_requirement: string | null
          min_gpa: number | null
          name: string
          name_en: string | null
          scholarship_available: boolean | null
          tuition_usd: number | null
          university_id: string
          updated_at: string
        }
        Insert: {
          application_deadline?: string | null
          avg_gpa?: number | null
          created_at?: string
          degree_level: string
          duration_years?: number | null
          field?: string | null
          id?: string
          language_requirement?: string | null
          min_gpa?: number | null
          name: string
          name_en?: string | null
          scholarship_available?: boolean | null
          tuition_usd?: number | null
          university_id: string
          updated_at?: string
        }
        Update: {
          application_deadline?: string | null
          avg_gpa?: number | null
          created_at?: string
          degree_level?: string
          duration_years?: number | null
          field?: string | null
          id?: string
          language_requirement?: string | null
          min_gpa?: number | null
          name?: string
          name_en?: string | null
          scholarship_available?: boolean | null
          tuition_usd?: number | null
          university_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "programs_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      transcripts: {
        Row: {
          created_at: string
          gpa_scale: string | null
          id: string
          name: string
          total_credits: number | null
          unweighted_gpa: number | null
          updated_at: string
          user_id: string
          weighted_gpa: number | null
        }
        Insert: {
          created_at?: string
          gpa_scale?: string | null
          id?: string
          name?: string
          total_credits?: number | null
          unweighted_gpa?: number | null
          updated_at?: string
          user_id: string
          weighted_gpa?: number | null
        }
        Update: {
          created_at?: string
          gpa_scale?: string | null
          id?: string
          name?: string
          total_credits?: number | null
          unweighted_gpa?: number | null
          updated_at?: string
          user_id?: string
          weighted_gpa?: number | null
        }
        Relationships: []
      }
      universities: {
        Row: {
          city: string | null
          country: string
          created_at: string
          id: string
          logo_url: string | null
          name: string
          name_en: string | null
          ranking_qs: number | null
          ranking_times: number | null
          ranking_us_news: number | null
          type: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          city?: string | null
          country: string
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          name_en?: string | null
          ranking_qs?: number | null
          ranking_times?: number | null
          ranking_us_news?: number | null
          type?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          city?: string | null
          country?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          name_en?: string | null
          ranking_qs?: number | null
          ranking_times?: number | null
          ranking_us_news?: number | null
          type?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          created_at: string
          gre_scores: Json | null
          id: string
          language_scores: Json | null
          preferred_fields: string[] | null
          target_countries: string[] | null
          target_degree_level: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          gre_scores?: Json | null
          id?: string
          language_scores?: Json | null
          preferred_fields?: string[] | null
          target_countries?: string[] | null
          target_degree_level?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          gre_scores?: Json | null
          id?: string
          language_scores?: Json | null
          preferred_fields?: string[] | null
          target_countries?: string[] | null
          target_degree_level?: string | null
          updated_at?: string
          user_id?: string
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
