import { chatRepository } from "lib/supabase/repositories";
import { NextRequest } from "next/server";
import { generateTitleFromUserMessageAction } from "../actions";

import { getSession } from "auth/server";
import { customModelProvider } from "lib/ai/models";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { threadId } = await params;
  const { messages, chatModel, projectId } = await request.json();

  let thread = await chatRepository.selectThread(threadId, session.user.id);
  if (!thread) {
    const title = await generateTitleFromUserMessageAction({
      message: messages[0],
      model: customModelProvider.getModel(chatModel),
    });
    const newThread = await chatRepository.insertThread({
      id: threadId,
      projectId: projectId ?? null,
      title,
      userId: session.user.id,
    });
    thread = {
      ...newThread,
      messages: [],
    };
  }
  if (thread.user_id !== session.user.id) {
    return new Response("Forbidden", { status: 403 });
  }
  await chatRepository.insertMessages(
    messages.map((message) => ({
      ...message,
      threadId: thread.id,
      createdAt: message.createdAt ? new Date(message.createdAt) : undefined,
    }))
  );
  return new Response(
    JSON.stringify({
      success: true,
    }),
    {
      status: 200,
    }
  );
}
