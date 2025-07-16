import { Database } from "../../../supabase/types";
import { UserPreferences } from "../../types/user";
import { createServerSupabaseClient } from "./server";

// Import types directly to avoid import issues
import type { AppUser, ClerkUserData } from "../../types/user";

// Type helpers to cast Json to specific types
type ChatThread = Database["public"]["Tables"]["chat_threads"]["Row"];
type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"];
type Project = Database["public"]["Tables"]["projects"]["Row"];

// Insert and Update types
type ChatThreadInsert = Database["public"]["Tables"]["chat_threads"]["Insert"];
type ChatMessageInsert = Database["public"]["Tables"]["chat_messages"]["Insert"];
type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];

// Extended types for better type safety
type ChatThreadWithMessages = ChatThread & {
  messages: ChatMessage[];
};

// Json field types (these should match your actual data structures)
type MessageParts = Array<{
  type: string;
  content: string;
  [key: string]: any;
}>;

type MessageAttachments = Array<{
  id: string;
  name: string;
  type: string;
  url: string;
  [key: string]: any;
}>;

type MessageAnnotations = Array<{
  id: string;
  type: string;
  content: any;
  [key: string]: any;
}>;

type ProjectInstructions = {
  systemMessage?: string;
  rules?: string[];
  context?: string;
  [key: string]: any;
};

type MCPServerConfig = {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  [key: string]: any;
};

// Workflow types
type WorkflowNode = Database["public"]["Tables"]["workflow_nodes"]["Row"];
type WorkflowEdge = Database["public"]["Tables"]["workflow_edges"]["Row"];
type WorkflowNodeInsert = Database["public"]["Tables"]["workflow_nodes"]["Insert"];
type WorkflowEdgeInsert = Database["public"]["Tables"]["workflow_edges"]["Insert"];

// User Repository
export const userRepository = {
  async getPreferences(userId: string): Promise<UserPreferences | null> {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("users")
      .select("preferences")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user preferences:", error);
      return null;
    }

    return (data?.preferences as UserPreferences) || {};
  },

  async updatePreferences(
    userId: string,
    preferences: UserPreferences
  ): Promise<void> {
    const supabase = createServerSupabaseClient();

    // First, ensure user exists, then update preferences
    await supabase
      .from("users")
      .update({
        preferences: preferences as UserPreferences,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
  },

  async existsByEmail(email: string): Promise<boolean> {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    return !error && !!data;
  },

  async syncUser(userData: ClerkUserData): Promise<void> {
    const supabase = createServerSupabaseClient();

    const { error } = await supabase.from("users").upsert({
      id: userData.id,
      email: userData.email,
      name: userData.name,
      image: userData.image,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error syncing user:", error);
      throw error;
    }
  },

  async findById(userId: string): Promise<AppUser | null> {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user:", error);
      return null;
    }

    if (!data) return null;

    return {
      ...data,
      preferences: (data.preferences as UserPreferences) || {},
    };
  },

  async updateUser(
    id: string,
    updates: Pick<AppUser, "name" | "image">
  ): Promise<AppUser> {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("users")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating user:", error);
      throw error;
    }

    return {
      ...data,
      preferences: (data.preferences as UserPreferences) || {},
    };
  },
};

// Chat Repository
export const chatRepository = {
  async getThreads(userId: string) {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("chat_threads")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching chat threads:", error);
      return [];
    }

    return data || [];
  },

  async getThread(threadId: string, userId?: string) {
    const supabase = createServerSupabaseClient();

    // Log the attempt
    console.log("Fetching thread:", { threadId, userId });

    let query = supabase.from("chat_threads").select("*").eq("id", threadId);

    // If userId is provided, add it to the query for additional safety
    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query.single();

    if (error) {
      console.error("Error fetching chat thread:", {
        error,
        threadId,
        userId,
        errorCode: error.code,
        errorDetails: error.details,
      });
      return null;
    }

    // Also fetch messages for this thread
    const messages = await this.getMessages(threadId);

    return {
      ...data,
      messages,
    };
  },

  async createThread(
    userId: string,
    title: string,
    projectId?: string,
    id?: string
  ) {
    const supabase = createServerSupabaseClient();

    const threadData: ChatThreadInsert = {
      title,
      user_id: userId,
      project_id: projectId,
    };

    // If an ID is provided, use it; otherwise let the database generate one
    if (id) {
      threadData.id = id;
    }

    const { data, error } = await supabase
      .from("chat_threads")
      .insert(threadData)
      .select()
      .single();

    if (error) {
      console.error("Error creating chat thread:", {
        error,
        userId,
        projectId,
        id,
        errorCode: error.code,
        errorDetails: error.details,
      });
      throw error;
    }

    return data;
  },

  async getMessages(threadId: string) {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching chat messages:", error);
      return [];
    }

    return data || [];
  },

  async createMessage(message: {
    id: string;
    threadId: string;
    role: string;
    parts: MessageParts;
    attachments?: MessageAttachments;
    annotations?: MessageAnnotations;
    model?: string;
  }) {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        id: message.id,
        thread_id: message.threadId,
        role: message.role,
        parts: message.parts as MessageParts,
        attachments: message.attachments as MessageAttachments,
        annotations: message.annotations as MessageAnnotations,
        model: message.model,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating chat message:", error);
      throw error;
    }

    return data;
  },

  async insertMessage(message: {
    id: string;
    threadId: string;
    role: string;
    parts: MessageParts;
    attachments?: MessageAttachments;
    annotations?: MessageAnnotations;
    model?: string;
  }) {
    return this.createMessage(message);
  },

  async upsertMessage(message: {
    id: string;
    threadId: string;
    role: string;
    parts: MessageParts;
    attachments?: MessageAttachments;
    annotations?: MessageAnnotations;
    model?: string;
  }) {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("chat_messages")
      .upsert({
        id: message.id,
        thread_id: message.threadId,
        role: message.role,
        parts: message.parts as MessageParts,
        attachments: message.attachments as MessageAttachments,
        annotations: message.annotations as MessageAnnotations,
        model: message.model,
      })
      .select()
      .single();

    if (error) {
      console.error("Error upserting chat message:", error);
      throw error;
    }

    return data;
  },

  // Compatibility methods
  async selectThread(threadId: string, userId?: string) {
    return this.getThread(threadId, userId);
  },

  async insertThread(thread: {
    id: string;
    title: string;
    userId: string;
    projectId?: string | null;
  }) {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("chat_threads")
      .insert({
        id: thread.id,
        title: thread.title,
        user_id: thread.userId,
        project_id: thread.projectId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting chat thread:", error);
      throw error;
    }

    return data;
  },

  async insertMessages(
    messages: Array<{
      id: string;
      threadId: string;
      role: string;
      parts: MessageParts;
      attachments?: MessageAttachments;
      annotations?: MessageAnnotations;
      model?: string;
      createdAt?: Date;
    }>
  ) {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("chat_messages")
      .insert(
        messages.map((msg) => ({
          id: msg.id,
          thread_id: msg.threadId,
          role: msg.role,
          parts: msg.parts as MessageParts,
          attachments: msg.attachments as MessageAttachments,
          annotations: msg.annotations as MessageAnnotations,
          model: msg.model,
          created_at: msg.createdAt?.toISOString(),
        }))
      )
      .select();

    if (error) {
      console.error("Error inserting chat messages:", error);
      throw error;
    }

    return data;
  },

  async selectThreadInstructionsByProjectId(userId: string, projectId: string) {
    const supabase = createServerSupabaseClient();

    // Get project instructions
    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .select("instructions")
      .eq("id", projectId)
      .eq("user_id", userId)
      .single();

    if (projectError && projectError.code !== "PGRST116") {
      console.error("Error fetching project instructions:", projectError);
    }

    // Get user preferences
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("preferences")
      .eq("id", userId)
      .single();

    if (userError && userError.code !== "PGRST116") {
      console.error("Error fetching user preferences:", userError);
    }

    return {
      instructions: (projectData?.instructions as ProjectInstructions) || "",
      userPreferences: (userData?.preferences as UserPreferences) || {},
    };
  },

  async selectThreadInstructions(userId: string, threadId?: string) {
    const supabase = createServerSupabaseClient();

    let instructions = "";

    if (threadId) {
      // Get thread and its associated project
      const { data: threadData, error: threadError } = await supabase
        .from("chat_threads")
        .select("project_id")
        .eq("id", threadId)
        .eq("user_id", userId)
        .single();

      if (threadError && threadError.code !== "PGRST116") {
        console.error("Error fetching thread:", threadError);
      }

      if (threadData?.project_id) {
        // Get project instructions
        const { data: projectData, error: projectError } = await supabase
          .from("projects")
          .select("instructions")
          .eq("id", threadData.project_id)
          .eq("user_id", userId)
          .single();

        if (projectError && projectError.code !== "PGRST116") {
          console.error("Error fetching project instructions:", projectError);
        }

        instructions = (projectData?.instructions as string) || "";
      }
    }

    // Get user preferences
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("preferences")
      .eq("id", userId)
      .single();

    if (userError && userError.code !== "PGRST116") {
      console.error("Error fetching user preferences:", userError);
    }

    return {
      instructions,
      userPreferences: (userData?.preferences as UserPreferences) || {},
    };
  },

  async deleteThread(threadId: string, userId: string) {
    const supabase = createServerSupabaseClient();

    // First verify that the thread belongs to the user
    const { data: threadData, error: threadError } = await supabase
      .from("chat_threads")
      .select("id, user_id")
      .eq("id", threadId)
      .eq("user_id", userId)
      .single();

    if (threadError) {
      console.error("Error verifying thread ownership:", threadError);
      throw new Error("Thread not found or access denied");
    }

    if (!threadData) {
      throw new Error("Thread not found or access denied");
    }

    // Delete all messages associated with this thread first
    const { error: messagesError } = await supabase
      .from("chat_messages")
      .delete()
      .eq("thread_id", threadId);

    if (messagesError) {
      console.error("Error deleting thread messages:", messagesError);
      throw new Error("Failed to delete thread messages");
    }

    // Then delete the thread itself
    const { error: threadDeleteError } = await supabase
      .from("chat_threads")
      .delete()
      .eq("id", threadId)
      .eq("user_id", userId);

    if (threadDeleteError) {
      console.error("Error deleting thread:", threadDeleteError);
      throw new Error("Failed to delete thread");
    }

    return true;
  },
};

// Workflow Repository
export const workflowRepository = {
  async getWorkflows(userId: string) {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("workflows")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching workflows:", error);
      return [];
    }

    return data || [];
  },

  async getPublicWorkflows() {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("workflows")
      .select("*")
      .eq("visibility", "public")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching public workflows:", error);
      return [];
    }

    return data || [];
  },

  async getWorkflow(workflowId: string) {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("workflows")
      .select("*")
      .eq("id", workflowId)
      .single();

    if (error) {
      console.error("Error fetching workflow:", error);
      return null;
    }

    return data;
  },

  async checkAccess(workflowId: string, userId: string, requireWrite = true) {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("workflows")
      .select("user_id, visibility")
      .eq("id", workflowId)
      .single();

    if (error) {
      console.error("Error checking workflow access:", error);
      return false;
    }

    if (data.user_id === userId) {
      return true;
    }

    if (!requireWrite && data.visibility === "public") {
      return true;
    }

    return false;
  },

  async selectStructureById(
    workflowId: string,
    _options?: { ignoreNote?: boolean }
  ) {
    const supabase = createServerSupabaseClient();

    // Get workflow
    const { data: workflow, error: workflowError } = await supabase
      .from("workflows")
      .select("*")
      .eq("id", workflowId)
      .single();

    if (workflowError) {
      console.error("Error fetching workflow structure:", workflowError);
      return null;
    }

    // Get nodes
    const { data: nodes, error: nodesError } = await supabase
      .from("workflow_nodes")
      .select("*")
      .eq("workflow_id", workflowId);

    if (nodesError) {
      console.error("Error fetching workflow nodes:", nodesError);
      return null;
    }

    // Get edges
    const { data: edges, error: edgesError } = await supabase
      .from("workflow_edges")
      .select("*")
      .eq("workflow_id", workflowId);

    if (edgesError) {
      console.error("Error fetching workflow edges:", edgesError);
      return null;
    }

    return {
      ...workflow,
      nodes: nodes || [],
      edges: edges || [],
    };
  },

  async selectToolByIds(workflowIds: string[]) {
    if (workflowIds.length === 0) return [];

    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("workflows")
      .select("*")
      .in("id", workflowIds);

    if (error) {
      console.error("Error fetching workflow tools:", error);
      return [];
    }

    return data || [];
  },

  // Alias for compatibility
  async selectAll(userId: string) {
    return this.getWorkflows(userId);
  },

  async save(
    workflowData: {
      id?: string;
      name: string;
      description?: string;
      icon?: string;
      userId: string;
      isPublished?: boolean;
      visibility?: string;
    },
    _noGenerateInputNode?: boolean
  ) {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("workflows")
      .upsert({
        id: workflowData.id,
        name: workflowData.name,
        description: workflowData.description,
        icon: workflowData.icon,
        user_id: workflowData.userId,
        is_published: workflowData.isPublished ?? false,
        visibility: workflowData.visibility ?? "private",
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving workflow:", error);
      throw error;
    }

    return data;
  },

  // Alias for compatibility
  async selectById(workflowId: string) {
    return this.getWorkflow(workflowId);
  },

  async delete(workflowId: string) {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase
      .from("workflows")
      .delete()
      .eq("id", workflowId);

    if (error) {
      console.error("Error deleting workflow:", error);
      throw error;
    }
  },

  async saveStructure(params: {
    workflowId: string;
    nodes: WorkflowNodeInsert[];
    edges: WorkflowEdgeInsert[];
    deleteNodes?: string[];
    deleteEdges?: string[];
  }) {
    const supabase = createServerSupabaseClient();

    // Delete nodes if requested
    if (params.deleteNodes && params.deleteNodes.length > 0) {
      const { error } = await supabase
        .from("workflow_nodes")
        .delete()
        .in("id", params.deleteNodes);

      if (error) {
        console.error("Error deleting workflow nodes:", error);
        throw error;
      }
    }

    // Delete edges if requested
    if (params.deleteEdges && params.deleteEdges.length > 0) {
      const { error } = await supabase
        .from("workflow_edges")
        .delete()
        .in("id", params.deleteEdges);

      if (error) {
        console.error("Error deleting workflow edges:", error);
        throw error;
      }
    }

    // Upsert nodes
    if (params.nodes.length > 0) {
      const { error } = await supabase
        .from("workflow_nodes")
        .upsert(params.nodes);

      if (error) {
        console.error("Error upserting workflow nodes:", error);
        throw error;
      }
    }

    // Upsert edges
    if (params.edges.length > 0) {
      const { error } = await supabase
        .from("workflow_edges")
        .upsert(params.edges);

      if (error) {
        console.error("Error upserting workflow edges:", error);
        throw error;
      }
    }
  },
};

// Project Repository
export const projectRepository = {
  async getProjects(userId: string) {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching projects:", error);
      return [];
    }

    return data || [];
  },

  async getProject(projectId: string) {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (error) {
      console.error("Error fetching project:", error);
      return null;
    }

    return data;
  },

  async createProject(project: {
    name: string;
    userId: string;
    instructions?: ProjectInstructions;
  }) {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("projects")
      .insert({
        name: project.name,
        user_id: project.userId,
        instructions: project.instructions as ProjectInstructions,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating project:", error);
      throw error;
    }

    return data;
  },

  async updateProject(
    projectId: string,
    updates: {
      name?: string;
      instructions?: ProjectInstructions;
    }
  ) {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("projects")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId)
      .select()
      .single();

    if (error) {
      console.error("Error updating project:", error);
      throw error;
    }

    return data;
  },

  async deleteProject(projectId: string) {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (error) {
      console.error("Error deleting project:", error);
      throw error;
    }
  },
};

// MCP Repository
export const mcpRepository = {
  async getAllServers() {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("mcp_servers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching MCP servers:", error);
      return [];
    }

    return data || [];
  },

  async getServerById(serverId: string) {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("mcp_servers")
      .select("*")
      .eq("id", serverId)
      .single();

    if (error) {
      console.error("Error fetching MCP server:", error);
      return null;
    }

    return data;
  },

  // Aliases for compatibility
  async selectAll() {
    return this.getAllServers();
  },

  async selectById(id: string) {
    return this.getServerById(id);
  },

  async save(server: {
    id?: string;
    name: string;
    config: MCPServerConfig;
    enabled?: boolean;
  }) {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("mcp_servers")
      .upsert({
        id: server.id,
        name: server.name,
        config: server.config as MCPServerConfig,
        enabled: server.enabled ?? true,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving MCP server:", error);
      throw error;
    }

    return data;
  },

  async deleteById(id: string) {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.from("mcp_servers").delete().eq("id", id);

    if (error) {
      console.error("Error deleting MCP server:", error);
      throw error;
    }
  },
};

// MCP Tool Customization Repository
export const mcpMcpToolCustomizationRepository = {
  async getCustomizations(userId: string, serverId: string) {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("mcp_tool_customizations")
      .select("*")
      .eq("user_id", userId)
      .eq("mcp_server_id", serverId);

    if (error) {
      console.error("Error fetching tool customizations:", error);
      return [];
    }

    return data || [];
  },

  async upsertCustomization(customization: {
    userId: string;
    toolName: string;
    mcpServerId: string;
    prompt: string;
  }) {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("mcp_tool_customizations")
      .upsert({
        user_id: customization.userId,
        tool_name: customization.toolName,
        mcp_server_id: customization.mcpServerId,
        prompt: customization.prompt,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error upserting tool customization:", error);
      throw error;
    }

    return data;
  },

  // Compatibility methods
  async selectByUserIdAndMcpServerId(params: {
    userId: string;
    mcpServerId: string;
  }) {
    return this.getCustomizations(params.userId, params.mcpServerId);
  },

  async select(params: {
    userId: string;
    mcpServerId: string;
    toolName: string;
  }) {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("mcp_tool_customizations")
      .select("*")
      .eq("user_id", params.userId)
      .eq("mcp_server_id", params.mcpServerId)
      .eq("tool_name", params.toolName)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching tool customization:", error);
      return null;
    }

    return data;
  },

  async upsertToolCustomization(customization: {
    userId: string;
    toolName: string;
    mcpServerId: string;
    prompt: string;
  }) {
    return this.upsertCustomization(customization);
  },

  async deleteToolCustomization(params: {
    userId: string;
    mcpServerId: string;
    toolName: string;
  }) {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase
      .from("mcp_tool_customizations")
      .delete()
      .eq("user_id", params.userId)
      .eq("mcp_server_id", params.mcpServerId)
      .eq("tool_name", params.toolName);

    if (error) {
      console.error("Error deleting tool customization:", error);
      throw error;
    }
  },
};

// MCP Server Customization Repository
export const mcpServerCustomizationRepository = {
  async getCustomization(userId: string, serverId: string) {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("mcp_server_customizations")
      .select("*")
      .eq("user_id", userId)
      .eq("mcp_server_id", serverId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching server customization:", error);
      return null;
    }

    return data;
  },

  async upsertCustomization(customization: {
    userId: string;
    mcpServerId: string;
    prompt: string;
  }) {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("mcp_server_customizations")
      .upsert({
        user_id: customization.userId,
        mcp_server_id: customization.mcpServerId,
        prompt: customization.prompt,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error upserting server customization:", error);
      throw error;
    }

    return data;
  },

  // Compatibility methods
  async selectByUserIdAndMcpServerId(params: {
    userId: string;
    mcpServerId: string;
  }) {
    return this.getCustomization(params.userId, params.mcpServerId);
  },

  async upsertMcpServerCustomization(customization: {
    userId: string;
    mcpServerId: string;
    prompt: string;
  }) {
    return this.upsertCustomization(customization);
  },

  async deleteMcpServerCustomizationByMcpServerIdAndUserId(params: {
    userId: string;
    mcpServerId: string;
  }) {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase
      .from("mcp_server_customizations")
      .delete()
      .eq("user_id", params.userId)
      .eq("mcp_server_id", params.mcpServerId);

    if (error) {
      console.error("Error deleting server customization:", error);
      throw error;
    }
  },
};
