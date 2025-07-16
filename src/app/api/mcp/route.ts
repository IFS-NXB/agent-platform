import { NextResponse } from "next/server";
import { TablesInsert } from "../../../../supabase/types";
import { getSession } from "../../../lib/auth/server";
import { saveMcpClientAction } from "./actions";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = (await request.json()) as TablesInsert<"mcp_servers">;

  try {
    await saveMcpClientAction(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to save MCP client" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
