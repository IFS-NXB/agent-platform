"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { userRepository } from "lib/supabase/repositories";

export async function syncUserAction() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Get user data from Clerk
  const clerk = await clerkClient();
  const clerkUser = await clerk.users.getUser(userId);

  // Sync user data from Clerk to local database
  await userRepository.syncUser({
    id: userId,
    email: clerkUser.emailAddresses[0]?.emailAddress || "",
    name:
      clerkUser.firstName && clerkUser.lastName
        ? `${clerkUser.firstName} ${clerkUser.lastName}`
        : clerkUser.username ||
          clerkUser.emailAddresses[0]?.emailAddress ||
          "User",
    image: clerkUser.imageUrl || null,
  });

  return userId;
}

export async function existsByEmailAction(email: string) {
  const exists = await userRepository.existsByEmail(email);
  return exists;
}
