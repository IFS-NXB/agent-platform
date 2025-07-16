import { getSession } from "auth/server";
import { chatRepository } from "lib/supabase/repositories";
import { redirect } from "next/navigation";
import { generateTitleFromUserMessageAction } from "../chat/actions";

export async function POST(request: Request) {
  const { id, projectId, message, model } = await request.json();

  const session = await getSession();

  if (!session?.user?.id) {
    return redirect("/sign-in");
  }

  const title = await generateTitleFromUserMessageAction({
    message,
    model,
  });

  const newThread = await chatRepository.createThread(
    session.user.id,
    title,
    projectId
  );

  return Response.json({
    threadId: newThread.id,
  });
}
