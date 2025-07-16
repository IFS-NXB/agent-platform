"use client";
import { selectMcpClientsAction } from "@/app/api/mcp/actions";
import { appStore } from "@/app/store";
import useSWR, { SWRConfiguration } from "swr";
import { handleErrorWithToast } from "ui/shared-toast";

export function useMcpList(options?: SWRConfiguration) {
  return useSWR("mcp-list", selectMcpClientsAction, {
    revalidateOnFocus: false,
    errorRetryCount: 0,
    focusThrottleInterval: 1000 * 60 * 5,
    fallbackData: [],
    onError: handleErrorWithToast,
    onSuccess: (data) => {
      appStore.setState({
        mcpList: data.map((server: any) => ({
          id: server.id ?? server.name, // fallback if id is missing
          name: server.name,
          config: server.config,
          error: server.error,
          status: server.status ?? "disconnected",
          toolInfo: server.toolInfo ?? [],
        })),
      });
    },
    ...options,
  });
}
