import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const getSession = async () => {
  const { userId } = await auth();

  if (!userId) {
    // Don't redirect in API routes - let the caller handle the null case
    return null;
  }

  return { user: { id: userId } };
};

export const getSessionOrRedirect = async () => {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return { user: { id: userId } };
};

export const getCurrentUser = async () => {
  const { userId } = await auth();
  return userId;
};
