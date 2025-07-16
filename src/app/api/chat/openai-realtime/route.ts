import { clerkClient } from '@clerk/nextjs/server';
import { AllowedMCPServer, VercelAIMcpTool } from "app-types/mcp";
import { UserPreferences } from "app-types/user";
import { getSession } from "auth/server";
import { mcpClientsManager } from "lib/ai/mcp/mcp-manager";
import {
  buildMcpServerCustomizationsSystemPrompt,
  buildProjectInstructionsSystemPrompt,
  buildSpeechSystemPrompt,
} from "lib/ai/prompts";
import { DEFAULT_VOICE_TOOLS } from "lib/ai/speech";
import { chatRepository } from "lib/supabase/repositories";
import { NextRequest } from "next/server";
import { errorIf, safe } from "ts-safe";
import { rememberMcpServerCustomizationsAction } from "../actions";
import {
  filterMcpServerCustomizations,
  filterMCPToolsByAllowedMCPServers,
  mergeSystemPrompt,
} from "../shared.chat";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY is not set" }),
        {
          status: 500,
        }
      );
    }

    const session = await getSession();

    if (!session?.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { voice, allowedMcpServers, toolChoice, threadId, projectId } =
      (await request.json()) as {
        model: string;
        voice: string;
        allowedMcpServers: Record<string, AllowedMCPServer>;
        toolChoice: "auto" | "none" | "manual";
        projectId?: string;
        threadId?: string;
      };

    const mcpTools = mcpClientsManager.tools();

    const tools = safe(mcpTools)
      .map(errorIf(() => toolChoice === "none" && "Not allowed"))
      .map((tools) => {
        return filterMCPToolsByAllowedMCPServers(tools, allowedMcpServers);
      })
      .orElse(undefined);

    const threadData = projectId
      ? await chatRepository.selectThreadInstructionsByProjectId(
          session.user.id,
          projectId
        )
      : await chatRepository.selectThreadInstructions(
          session.user.id,
          threadId
        );

    // Type cast the returned values
    const instructions = threadData.instructions as { systemPrompt: string } | null;
    const userPreferences = threadData.userPreferences as UserPreferences | undefined;

    const mcpServerCustomizations = await safe()
      .map(async () => {
        if (!tools || Object.keys(tools).length === 0)
          throw new Error("No tools found");
        return await rememberMcpServerCustomizationsAction(session.user.id);
      })
      .map((v) => filterMcpServerCustomizations(tools || {}, v))
      .orElse({});

    const openAITools = Object.entries(tools ?? {}).map(([name, tool]) => {
      return vercelAIToolToOpenAITool(tool, name);
    });

    const clerk = await clerkClient();
    const fullUser = await clerk.users.getUser(session.user.id);

    const systemPrompt = mergeSystemPrompt(
      buildSpeechSystemPrompt(fullUser, userPreferences),
      buildProjectInstructionsSystemPrompt(instructions),
      buildMcpServerCustomizationsSystemPrompt(mcpServerCustomizations)
    );

    const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        model: "gpt-4o-realtime-preview",
        voice: voice || "alloy",
        input_audio_transcription: {
          model: "whisper-1",
        },
        instructions: systemPrompt,
        tools: [...openAITools, ...DEFAULT_VOICE_TOOLS],
      }),
    });

    return new Response(r.body, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}

function vercelAIToolToOpenAITool(tool: VercelAIMcpTool, name: string) {
  return {
    name,
    type: "function",
    description: tool.description,
    parameters: tool.parameters?.jsonSchema ?? {
      type: "object",
      properties: {},
      required: [],
    },
  };
}
