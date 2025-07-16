"use client";
import { selectExecuteAbilityWorkflowsAction } from "@/app/api/workflow/actions";
import useSWR, { SWRConfiguration } from "swr";
import { appStore } from "@/app/store";

export function useWorkflowToolList(options?: SWRConfiguration) {
  return useSWR("workflow-tool-list", selectExecuteAbilityWorkflowsAction, {
    errorRetryCount: 0,
    revalidateOnFocus: false,
    focusThrottleInterval: 1000 * 60 * 30,
    fallbackData: [],
    onSuccess: (data) => {
      appStore.setState({
        workflowToolList: data.map((w: any) => ({
          id: w.id,
          name: w.name,
          description: w.description ?? undefined,
          icon: w.icon ?? undefined,
          visibility: (w.visibility as "public" | "private" | "readonly") ?? "private",
          isPublished: w.is_published ?? false,
          userName: w.user_name ?? "",
          userAvatar: w.user_avatar ?? undefined,
          updatedAt: new Date(w.updated_at || ""),
        })),
      });
    },
    ...options,
  });
}
