import { selectThreadWithMessagesAction } from "@/app/api/chat/actions";
import ChatBot from "@/components/chat-bot";

import { convertToUIMessage } from "lib/utils";
import { redirect, RedirectType } from "next/navigation";

const fetchThread = async (threadId: string) => {
  return await selectThreadWithMessagesAction(threadId);
};

export default async function Page({
  params,
}: {
  params: Promise<{ thread: string }>;
}) {
  const { thread: threadId } = await params;

  const thread = await fetchThread(threadId);

  if (!thread) redirect("/", RedirectType.replace);

  const initialMessages = thread.messages.map((msg) =>
    convertToUIMessage({
      id: msg.id,
      threadId: msg.thread_id,
      role: msg.role as "user" | "assistant" | "system" | "data",
      parts: (msg.parts as any[]) || [],
      attachments: (msg.attachments as any[]) || undefined,
      annotations: (msg.annotations as any[]) || undefined,
      model: msg.model || null,
      createdAt: msg.created_at ? new Date(msg.created_at) : new Date(),
    })
  );

  return (
    <ChatBot
      threadId={threadId}
      key={threadId}
      initialMessages={initialMessages}
    />
  );
}
