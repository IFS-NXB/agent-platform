"use server";

import {
  generateObject,
  generateText,
  jsonSchema,
  LanguageModel,
  type Message,
} from "ai";

import {
  CREATE_THREAD_TITLE_PROMPT,
  generateExampleToolSchemaPrompt,
} from "lib/ai/prompts";

import type { ChatModel, ChatThread, Project } from "app-types/chat";

import { MCPToolInfo } from "app-types/mcp";
import { customModelProvider } from "lib/ai/models";
import { chatRepository, projectRepository } from "lib/supabase/repositories";
import { toAny } from "lib/utils";
import logger from "logger";

import { auth } from "@clerk/nextjs/server";
import { ObjectJsonSchema7 } from "app-types/util";
import { JSONSchema7 } from "json-schema";
import { jsonSchemaToZod } from "lib/json-schema-to-zod";

export async function getUserId() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User not found");
  }
  return userId;
}

export async function generateTitleFromUserMessageAction({
  message,
  model,
}: {
  message: Message;
  model: LanguageModel;
}) {
  await getUserId(); // Ensure user is authenticated
  const prompt = toAny(message.parts?.at(-1))?.text || "unknown";

  const { text: title } = await generateText({
    model,
    system: CREATE_THREAD_TITLE_PROMPT,
    prompt,
  });

  return title.trim();
}

export async function selectThreadWithMessagesAction(threadId: string) {
  const userId = await getUserId();
  const thread = await chatRepository.getThread(threadId, userId);

  if (!thread) {
    logger.error("Thread not found", { threadId, userId });
    return null;
  }
  if (thread.user_id !== userId) {
    logger.error("Thread access denied", {
      threadId,
      userId,
      threadUserId: thread.user_id,
    });
    return null;
  }
  const messages = await chatRepository.getMessages(threadId);
  return { ...thread, messages: messages ?? [] };
}

export async function deleteMessageAction(messageId: string) {
  // TODO: Implement message deletion
  logger.warn("deleteMessageAction not implemented");
}

export async function deleteThreadAction(threadId: string) {
  try {
    const userId = await getUserId();
    await chatRepository.deleteThread(threadId, userId);
    logger.info("Thread deleted successfully", { threadId, userId });
    return { success: true };
  } catch (error) {
    logger.error("Error deleting thread", { threadId, error });
    throw error;
  }
}

export async function deleteMessagesByChatIdAfterTimestampAction(
  messageId: string
) {
  // TODO: Implement message deletion after timestamp
  logger.warn("deleteMessagesByChatIdAfterTimestampAction not implemented");
}

export async function selectThreadListByUserIdAction() {
  const userId = await getUserId();
  const threads = await chatRepository.getThreads(userId);
  return threads;
}

export async function selectMessagesByThreadIdAction(threadId: string) {
  const messages = await chatRepository.getMessages(threadId);
  return messages;
}

export async function updateThreadAction(
  id: string,
  thread: Partial<Omit<ChatThread, "createdAt" | "updatedAt" | "userId">>
) {
  // TODO: Implement thread update
  logger.warn("updateThreadAction not implemented");
}

export async function deleteThreadsAction() {
  try {
    const userId = await getUserId();
    const threads = await chatRepository.getThreads(userId);

    // Delete each thread individually (which will cascade delete messages)
    await Promise.all(
      threads.map((thread) => chatRepository.deleteThread(thread.id, userId))
    );

    logger.info("All threads deleted successfully", {
      userId,
      count: threads.length,
    });
    return { success: true, count: threads.length };
  } catch (error) {
    logger.error("Error deleting all threads", { error });
    throw error;
  }
}

export async function generateExampleToolSchemaAction(options: {
  model?: ChatModel;
  toolInfo: MCPToolInfo;
  prompt?: string;
}) {
  const model = customModelProvider.getModel(options.model);

  const schema = jsonSchema(
    toAny({
      ...options.toolInfo.inputSchema,
      properties: options.toolInfo.inputSchema?.properties ?? {},
      additionalProperties: false,
    })
  );
  const { object } = await generateObject({
    model,
    schema,
    prompt: generateExampleToolSchemaPrompt({
      toolInfo: options.toolInfo,
      prompt: options.prompt,
    }),
  });

  return object;
}

export async function selectProjectListByUserIdAction() {
  const userId = await getUserId();
  const projects = await projectRepository.getProjects(userId);
  return projects;
}

export async function insertProjectAction({
  name,
  instructions,
}: {
  name: string;
  instructions?: Project["instructions"];
}) {
  const userId = await getUserId();
  const project = await projectRepository.createProject({
    name,
    userId,
    instructions,
  });
  return project;
}

export async function insertProjectWithThreadAction({
  name,
  instructions,
  threadId,
}: {
  name: string;
  instructions?: Project["instructions"];
  threadId: string;
}) {
  const userId = await getUserId();
  // First create the project
  const project = await projectRepository.createProject({
    name,
    userId,
    instructions,
  });

  // Then update the thread to associate it with the project
  // TODO: Implement thread update to associate with project
  // For now, just return the project
  return project;
}

export async function selectProjectByIdAction(id: string) {
  const userId = await getUserId();
  const project = await projectRepository.getProject(id);

  // Check if user has access to this project
  if (!project || project.user_id !== userId) {
    return null;
  }

  // Get threads associated with this project
  const threads = await chatRepository.getThreads(userId);
  const projectThreads = threads.filter((thread) => thread.project_id === id);

  // Transform database row to application type
  return {
    id: project.id,
    name: project.name,
    instructions: project.instructions as Project["instructions"],
    userId: project.user_id,
    createdAt: new Date(project.created_at || ""),
    updatedAt: new Date(project.updated_at || ""),
    threads: projectThreads.map((thread) => ({
      id: thread.id,
      title: thread.title,
      userId: thread.user_id,
      projectId: thread.project_id,
      createdAt: new Date(thread.created_at || ""),
    })),
  };
}

export async function updateProjectAction(
  id: string,
  project: Partial<Pick<Project, "name" | "instructions">>
) {
  const userId = await getUserId();
  // Check if user has access to this project
  const existingProject = await projectRepository.getProject(id);
  if (!existingProject || existingProject.user_id !== userId) {
    return null;
  }

  const updatedProject = await projectRepository.updateProject(id, project);
  return updatedProject;
}

export async function deleteProjectAction(id: string) {
  const userId = await getUserId();
  // Check if user has access to this project
  const existingProject = await projectRepository.getProject(id);
  if (!existingProject || existingProject.user_id !== userId) {
    return;
  }

  await projectRepository.deleteProject(id);
}

export async function rememberProjectInstructionsAction(
  projectId: string
): Promise<Project["instructions"] | null> {
  const userId = await getUserId();
  const project = await projectRepository.getProject(projectId);

  // Check if user has access to this project
  if (!project || project.user_id !== userId) {
    return null;
  }

  return (project.instructions as Project["instructions"]) || null;
}

export async function rememberThreadAction(threadId: string) {
  // TODO: Implement thread caching
  logger.warn("rememberThreadAction not implemented");
  return null;
}

export async function updateProjectNameAction(id: string, name: string) {
  // TODO: Implement project name update
  logger.warn("updateProjectNameAction not implemented");
  return null;
}

export async function rememberMcpServerCustomizationsAction(userId: string) {
  // TODO: Implement MCP server customizations caching
  logger.warn("rememberMcpServerCustomizationsAction not implemented");
  return {};
}

export async function generateObjectAction({
  model,
  prompt,
  schema,
}: {
  model?: ChatModel;
  prompt: {
    system?: string;
    user?: string;
  };
  schema: JSONSchema7 | ObjectJsonSchema7;
}) {
  const result = await generateObject({
    model: customModelProvider.getModel(model),
    system: prompt.system,
    prompt: prompt.user,
    schema: jsonSchemaToZod(schema),
  });
  return result.object;
}
