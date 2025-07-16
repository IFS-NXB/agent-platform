export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)";
  };
  public: {
    Tables: {
      chat_messages: {
        Row: {
          annotations: Json | null;
          attachments: Json | null;
          created_at: string | null;
          id: string;
          model: string | null;
          parts: Json;
          role: string;
          thread_id: string;
        };
        Insert: {
          annotations?: Json | null;
          attachments?: Json | null;
          created_at?: string | null;
          id: string;
          model?: string | null;
          parts: Json;
          role: string;
          thread_id: string;
        };
        Update: {
          annotations?: Json | null;
          attachments?: Json | null;
          created_at?: string | null;
          id?: string;
          model?: string | null;
          parts?: Json;
          role?: string;
          thread_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey";
            columns: ["thread_id"];
            isOneToOne: false;
            referencedRelation: "chat_threads";
            referencedColumns: ["id"];
          }
        ];
      };
      chat_threads: {
        Row: {
          created_at: string | null;
          id: string;
          project_id: string | null;
          title: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          project_id?: string | null;
          title: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          project_id?: string | null;
          title?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_threads_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      mcp_server_customizations: {
        Row: {
          created_at: string | null;
          id: string;
          mcp_server_id: string;
          prompt: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          mcp_server_id: string;
          prompt?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          mcp_server_id?: string;
          prompt?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mcp_server_customizations_mcp_server_id_fkey";
            columns: ["mcp_server_id"];
            isOneToOne: false;
            referencedRelation: "mcp_servers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mcp_server_customizations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      mcp_servers: {
        Row: {
          config: Json;
          created_at: string | null;
          enabled: boolean | null;
          id: string;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          config: Json;
          created_at?: string | null;
          enabled?: boolean | null;
          id?: string;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          config?: Json;
          created_at?: string | null;
          enabled?: boolean | null;
          id?: string;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      mcp_tool_customizations: {
        Row: {
          created_at: string | null;
          id: string;
          mcp_server_id: string;
          prompt: string | null;
          tool_name: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          mcp_server_id: string;
          prompt?: string | null;
          tool_name: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          mcp_server_id?: string;
          prompt?: string | null;
          tool_name?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mcp_tool_customizations_mcp_server_id_fkey";
            columns: ["mcp_server_id"];
            isOneToOne: false;
            referencedRelation: "mcp_servers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mcp_tool_customizations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      projects: {
        Row: {
          created_at: string | null;
          id: string;
          instructions: Json | null;
          name: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          instructions?: Json | null;
          name: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          instructions?: Json | null;
          name?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      users: {
        Row: {
          created_at: string | null;
          email: string;
          id: string;
          image: string | null;
          name: string;
          preferences: Json | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          id: string;
          image?: string | null;
          name: string;
          preferences?: Json | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          email?: string;
          id?: string;
          image?: string | null;
          name?: string;
          preferences?: Json | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      workflow_edges: {
        Row: {
          created_at: string | null;
          id: string;
          source: string;
          target: string;
          ui_config: Json | null;
          version: string | null;
          workflow_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          source: string;
          target: string;
          ui_config?: Json | null;
          version?: string | null;
          workflow_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          source?: string;
          target?: string;
          ui_config?: Json | null;
          version?: string | null;
          workflow_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workflow_edges_source_fkey";
            columns: ["source"];
            isOneToOne: false;
            referencedRelation: "workflow_nodes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_edges_target_fkey";
            columns: ["target"];
            isOneToOne: false;
            referencedRelation: "workflow_nodes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_edges_workflow_id_fkey";
            columns: ["workflow_id"];
            isOneToOne: false;
            referencedRelation: "workflows";
            referencedColumns: ["id"];
          }
        ];
      };
      workflow_nodes: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          kind: string;
          name: string;
          node_config: Json | null;
          ui_config: Json | null;
          updated_at: string | null;
          version: string | null;
          workflow_id: string;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          kind: string;
          name: string;
          node_config?: Json | null;
          ui_config?: Json | null;
          updated_at?: string | null;
          version?: string | null;
          workflow_id: string;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          kind?: string;
          name?: string;
          node_config?: Json | null;
          ui_config?: Json | null;
          updated_at?: string | null;
          version?: string | null;
          workflow_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workflow_nodes_workflow_id_fkey";
            columns: ["workflow_id"];
            isOneToOne: false;
            referencedRelation: "workflows";
            referencedColumns: ["id"];
          }
        ];
      };
      workflows: {
        Row: {
          created_at: string | null;
          description: string | null;
          icon: Json | null;
          id: string;
          is_published: boolean | null;
          name: string;
          updated_at: string | null;
          user_id: string;
          version: string | null;
          visibility: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          icon?: Json | null;
          id?: string;
          is_published?: boolean | null;
          name: string;
          updated_at?: string | null;
          user_id: string;
          version?: string | null;
          visibility?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          icon?: Json | null;
          id?: string;
          is_published?: boolean | null;
          name?: string;
          updated_at?: string | null;
          user_id?: string;
          version?: string | null;
          visibility?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "workflows_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
