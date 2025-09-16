export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      donations: {
        Row: {
          id: number
          donor_name: string | null
          amount: number
          message: string | null
          target: Database["public"]["Enums"]["donation_target"]
          week: number
          is_public: boolean
          timestamp: string
        }
        Insert: {
          id?: number
          donor_name?: string | null
          amount: number
          message?: string | null
          target: Database["public"]["Enums"]["donation_target"]
          week: number
          is_public?: boolean
          timestamp?: string
        }
        Update: {
          id?: number
          donor_name?: string | null
          amount?: number
          message?: string | null
          target?: Database["public"]["Enums"]["donation_target"]
          week?: number
          is_public?: boolean
          timestamp?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          name: string | null
          email: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          id?: string
          name?: string | null
          email: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          id?: string
          name?: string | null
          email?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      athlete_responses: {
        Row: {
          id: number
          role: Database["public"]["Enums"]["donation_target"] | null
          video_url: string
          caption: string | null
          week: number
          uploaded_by: string
        }
        Insert: {
          id?: number
          role?: Database["public"]["Enums"]["donation_target"] | null
          video_url: string
          caption?: string | null
          week: number
          uploaded_by: string
        }
        Update: {
          id?: number
          role?: Database["public"]["Enums"]["donation_target"] | null
          video_url?: string
          caption?: string | null
          week?: number
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "athlete_responses_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      mvp_assignments: {
        Row: {
          week: number
          omvp_id: string
          dmvp_id: string
        }
        Insert: {
          week: number
          omvp_id: string
          dmvp_id: string
        }
        Update: {
          week?: number
          omvp_id?: string
          dmvp_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mvp_assignments_dmvp_id_fkey"
            columns: ["dmvp_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mvp_assignments_omvp_id_fkey"
            columns: ["omvp_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      ugc_feed: {
        Row: {
          id: number
          author_id: string
          content_type: Database["public"]["Enums"]["content_type"]
          content_url: string
          sentiment: Database["public"]["Enums"]["sentiment"] | null
          caption: string | null
          created_at: string
        }
        Insert: {
          id?: number
          author_id: string
          content_type: Database["public"]["Enums"]["content_type"]
          content_url: string
          sentiment?: Database["public"]["Enums"]["sentiment"] | null
          caption?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          author_id?: string
          content_type?: Database["public"]["Enums"]["content_type"]
          content_url?: string
          sentiment?: Database["public"]["Enums"]["sentiment"] | null
          caption?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ugc_feed_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      polls: {
        Row: {
          id: number
          question: string
          options: Json
          selected_option: number | null
          ends_at: string | null
        }
        Insert: {
          id?: number
          question: string
          options: Json
          selected_option?: number | null
          ends_at?: string | null
        }
        Update: {
          id?: number
          question?: string
          options?: Json
          selected_option?: number | null
          ends_at?: string | null
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
      user_role: "fan" | "admin" | "athlete"
      donation_target: "OMVP" | "DMVP" | "TEAM"
      content_type: "video" | "image" | "text"
      sentiment: "positive" | "negative"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
