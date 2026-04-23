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
      activities: {
        Row: {
          activity_type: string | null
          college: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          image_url: string | null
          image_urls: string[] | null
          level: string | null
          specialty: string | null
          title: string
        }
        Insert: {
          activity_type?: string | null
          college: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          level?: string | null
          specialty?: string | null
          title: string
        }
        Update: {
          activity_type?: string | null
          college?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          level?: string | null
          specialty?: string | null
          title?: string
        }
        Relationships: []
      }
      awareness_post_comments: {
        Row: {
          author_name: string | null
          comment: string
          created_at: string
          id: string
          post_id: string
          visitor_key: string
        }
        Insert: {
          author_name?: string | null
          comment: string
          created_at?: string
          id?: string
          post_id: string
          visitor_key: string
        }
        Update: {
          author_name?: string | null
          comment?: string
          created_at?: string
          id?: string
          post_id?: string
          visitor_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "awareness_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "awareness_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      awareness_post_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction: string
          visitor_key: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction: string
          visitor_key: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction?: string
          visitor_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "awareness_post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "awareness_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      awareness_post_views: {
        Row: {
          created_at: string
          id: string
          post_id: string
          visitor_key: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          visitor_key: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          visitor_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "awareness_post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "awareness_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      awareness_posts: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          image_urls: string[]
          message: string
          target_audience: string | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          image_urls?: string[]
          message: string
          target_audience?: string | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          image_urls?: string[]
          message?: string
          target_audience?: string | null
          title?: string
        }
        Relationships: []
      }
      certificate_requests: {
        Row: {
          certificate_type: string
          college: string
          created_at: string
          email: string
          full_name: string
          id: string
          level: string
          phone: string | null
          reason: string
          specialty: string | null
          status: string
        }
        Insert: {
          certificate_type: string
          college: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          level: string
          phone?: string | null
          reason: string
          specialty?: string | null
          status?: string
        }
        Update: {
          certificate_type?: string
          college?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          level?: string
          phone?: string | null
          reason?: string
          specialty?: string | null
          status?: string
        }
        Relationships: []
      }
      channel_suggestions: {
        Row: {
          channel_name: string
          channel_url: string
          college: string
          created_at: string
          id: string
          level: string | null
          notes: string | null
          specialty: string | null
          status: string
          suggester_name: string | null
          suggestion_type: string
        }
        Insert: {
          channel_name: string
          channel_url: string
          college: string
          created_at?: string
          id?: string
          level?: string | null
          notes?: string | null
          specialty?: string | null
          status?: string
          suggester_name?: string | null
          suggestion_type?: string
        }
        Update: {
          channel_name?: string
          channel_url?: string
          college?: string
          created_at?: string
          id?: string
          level?: string | null
          notes?: string | null
          specialty?: string | null
          status?: string
          suggester_name?: string | null
          suggestion_type?: string
        }
        Relationships: []
      }
      channels: {
        Row: {
          channel_name: string
          channel_url: string
          college: string
          created_at: string
          created_by: string | null
          id: string
          level: string | null
          specialty: string | null
          subject: string | null
        }
        Insert: {
          channel_name: string
          channel_url: string
          college: string
          created_at?: string
          created_by?: string | null
          id?: string
          level?: string | null
          specialty?: string | null
          subject?: string | null
        }
        Update: {
          channel_name?: string
          channel_url?: string
          college?: string
          created_at?: string
          created_by?: string | null
          id?: string
          level?: string | null
          specialty?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      college_admin_invites: {
        Row: {
          college: string
          created_at: string
          email: string
          id: string
          level: string | null
        }
        Insert: {
          college: string
          created_at?: string
          email: string
          id?: string
          level?: string | null
        }
        Update: {
          college?: string
          created_at?: string
          email?: string
          id?: string
          level?: string | null
        }
        Relationships: []
      }
      college_admins: {
        Row: {
          college: string
          created_at: string
          email: string
          id: string
          level: string | null
          user_id: string
        }
        Insert: {
          college: string
          created_at?: string
          email: string
          id?: string
          level?: string | null
          user_id: string
        }
        Update: {
          college?: string
          created_at?: string
          email?: string
          id?: string
          level?: string | null
          user_id?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          college: string
          created_at: string
          full_name: string
          id: string
          is_read: boolean
          level: string
          message: string
          phone: string | null
          specialty: string | null
        }
        Insert: {
          college: string
          created_at?: string
          full_name: string
          id?: string
          is_read?: boolean
          level: string
          message: string
          phone?: string | null
          specialty?: string | null
        }
        Update: {
          college?: string
          created_at?: string
          full_name?: string
          id?: string
          is_read?: boolean
          level?: string
          message?: string
          phone?: string | null
          specialty?: string | null
        }
        Relationships: []
      }
      exam_attempts: {
        Row: {
          answers: Json | null
          college: string | null
          correct_count: number
          exam_id: string
          feedback: string | null
          finished_at: string | null
          id: string
          percentage: number
          started_at: string
          student_name: string
          student_name_key: string | null
          student_name_normalized: string | null
          total_questions: number
          wrong_count: number
        }
        Insert: {
          answers?: Json | null
          college?: string | null
          correct_count?: number
          exam_id: string
          feedback?: string | null
          finished_at?: string | null
          id?: string
          percentage?: number
          started_at?: string
          student_name: string
          student_name_key?: string | null
          student_name_normalized?: string | null
          total_questions?: number
          wrong_count?: number
        }
        Update: {
          answers?: Json | null
          college?: string | null
          correct_count?: number
          exam_id?: string
          feedback?: string | null
          finished_at?: string | null
          id?: string
          percentage?: number
          started_at?: string
          student_name?: string
          student_name_key?: string | null
          student_name_normalized?: string | null
          total_questions?: number
          wrong_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "exam_attempts_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          access_code: string
          college: string
          created_at: string
          created_by: string | null
          duration_minutes: number
          id: string
          is_active: boolean
          questions: Json
          title: string
        }
        Insert: {
          access_code: string
          college: string
          created_at?: string
          created_by?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          questions?: Json
          title: string
        }
        Update: {
          access_code?: string
          college?: string
          created_at?: string
          created_by?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          questions?: Json
          title?: string
        }
        Relationships: []
      }
      library_files: {
        Row: {
          college: string
          created_at: string
          description: string | null
          downloads: number
          file_path: string | null
          file_type: string | null
          file_url: string
          id: string
          level: string
          status: string
          title: string
          uploader_name: string | null
        }
        Insert: {
          college: string
          created_at?: string
          description?: string | null
          downloads?: number
          file_path?: string | null
          file_type?: string | null
          file_url: string
          id?: string
          level: string
          status?: string
          title: string
          uploader_name?: string | null
        }
        Update: {
          college?: string
          created_at?: string
          description?: string | null
          downloads?: number
          file_path?: string | null
          file_type?: string | null
          file_url?: string
          id?: string
          level?: string
          status?: string
          title?: string
          uploader_name?: string | null
        }
        Relationships: []
      }
      members: {
        Row: {
          college: string
          committee_role: string | null
          created_at: string
          full_name: string
          gender: string
          id: string
          join_year: string | null
          level: string
          name_normalized: string | null
          notes: string | null
          phone: string | null
          specialty: string | null
        }
        Insert: {
          college: string
          committee_role?: string | null
          created_at?: string
          full_name: string
          gender: string
          id?: string
          join_year?: string | null
          level: string
          name_normalized?: string | null
          notes?: string | null
          phone?: string | null
          specialty?: string | null
        }
        Update: {
          college?: string
          committee_role?: string | null
          created_at?: string
          full_name?: string
          gender?: string
          id?: string
          join_year?: string | null
          level?: string
          name_normalized?: string | null
          notes?: string | null
          phone?: string | null
          specialty?: string | null
        }
        Relationships: []
      }
      site_visits: {
        Row: {
          created_at: string
          id: string
          path: string | null
          user_agent: string | null
          visitor_key: string
        }
        Insert: {
          created_at?: string
          id?: string
          path?: string | null
          user_agent?: string | null
          visitor_key: string
        }
        Update: {
          created_at?: string
          id?: string
          path?: string | null
          user_agent?: string | null
          visitor_key?: string
        }
        Relationships: []
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
          role: Database["public"]["Enums"]["app_role"]
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
      members_public: {
        Row: {
          college: string | null
          committee_role: string | null
          created_at: string | null
          full_name: string | null
          gender: string | null
          id: string | null
          join_year: string | null
          level: string | null
          phone: string | null
          specialty: string | null
        }
        Insert: {
          college?: string | null
          committee_role?: string | null
          created_at?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string | null
          join_year?: string | null
          level?: string | null
          phone?: never
          specialty?: string | null
        }
        Update: {
          college?: string | null
          committee_role?: string | null
          created_at?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string | null
          join_year?: string | null
          level?: string | null
          phone?: never
          specialty?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      complete_exam_attempt: {
        Args: {
          _answers: Json
          _attempt_id: string
          _correct_count: number
          _percentage: number
          _total_questions: number
          _wrong_count: number
        }
        Returns: undefined
      }
      get_admin_college: { Args: { _user_id: string }; Returns: string }
      has_attempted_exam: {
        Args: { _exam_id: string; _student_name: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_college_admin: { Args: { _user_id: string }; Returns: boolean }
      normalize_arabic_name: { Args: { _name: string }; Returns: string }
      normalize_exam_name_key: { Args: { _name: string }; Returns: string }
      start_exam_attempt: {
        Args: {
          _attempt_id: string
          _college: string
          _exam_id: string
          _student_name: string
          _total_questions: number
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
