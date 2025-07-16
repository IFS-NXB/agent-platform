"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { toast } from "sonner";

export const useAuthClient = () => {
  const { signOut } = useAuth();
  const { user } = useUser();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Error signing out");
    }
  };

  return {
    user,
    signOut: handleSignOut,
  };
};
