import { AppHeader } from "@/components/layouts/app-header";
import { AppSidebar } from "@/components/layouts/app-sidebar";
import { cookies } from "next/headers";
import { SidebarProvider } from "ui/sidebar";

import { syncUserAction } from "@/app/api/auth/actions";
import { AppPopupProvider } from "@/components/layouts/app-popup-provider";
import { COOKIE_KEY_SIDEBAR_STATE } from "lib/const";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  // Sync user to database on each chat access
  await syncUserAction();

  const isCollapsed =
    cookieStore.get(COOKIE_KEY_SIDEBAR_STATE)?.value !== "true";
  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <AppPopupProvider />
      <AppSidebar />
      <main className="relative bg-background  w-full flex flex-col h-screen">
        <AppHeader />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </SidebarProvider>
  );
}
