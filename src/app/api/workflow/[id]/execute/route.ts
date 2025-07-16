import { DBEdge, DBNode } from "app-types/workflow";
import { colorize } from "consola/utils";
import { createWorkflowExecutor } from "lib/ai/workflow/executor/workflow-executor";
import { encodeWorkflowEvent } from "lib/ai/workflow/shared.workflow";
import { getSession } from "lib/auth/server";
import { workflowRepository } from "lib/supabase/repositories";
import { safeJSONParse, toAny } from "lib/utils";
import logger from "logger";

// Helper to convert snake_case DB fields to camelCase
function toCamelCaseNode(dbNode: any): DBNode {
  return {
    id: dbNode.id,
    workflowId: dbNode.workflow_id,
    kind: dbNode.kind,
    name: dbNode.name,
    description: dbNode.description,
    nodeConfig: dbNode.node_config,
    uiConfig: dbNode.ui_config,
    createdAt: dbNode.created_at,
    updatedAt: dbNode.updated_at,
  };
}

function toCamelCaseEdge(dbEdge: any): DBEdge {
  return {
    id: dbEdge.id,
    workflowId: dbEdge.workflow_id,
    source: dbEdge.source,
    target: dbEdge.target,
    uiConfig: dbEdge.ui_config,
    createdAt: dbEdge.created_at,
  };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { query } = await request.json();
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  const hasAccess = await workflowRepository.checkAccess(id, session.user.id);
  if (!hasAccess) {
    return new Response("Unauthorized", { status: 401 });
  }
  const workflow = await workflowRepository.selectStructureById(id);
  if (!workflow) {
    return new Response("Workflow not found", { status: 404 });
  }

  const wfLogger = logger.withDefaults({
    message: colorize("cyan", `WORKFLOW '${workflow.name}' `),
  });
  const app = createWorkflowExecutor({
    edges: workflow.edges.map(toCamelCaseEdge),
    nodes: workflow.nodes.map(toCamelCaseNode),
    logger: wfLogger,
  });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let isAborted = false;
      // Subscribe to workflow events
      app.subscribe((evt) => {
        if (isAborted) return;
        if (
          (evt.eventType == "NODE_START" || evt.eventType == "NODE_END") &&
          evt.node.name == "SKIP"
        ) {
          return;
        }
        try {
          const err = toAny(evt)?.error;
          if (err) {
            toAny(evt).error = {
              name: err.name || "ERROR",
              message: err?.message || safeJSONParse(err).value,
            };
          }
          // Use custom encoding instead of SSE format
          const data = encodeWorkflowEvent(evt);
          controller.enqueue(encoder.encode(data));
          // Close stream when workflow ends
          if (evt.eventType === "WORKFLOW_END") {
            controller.close();
          }
        } catch (error) {
          logger.error("Stream write error:", error);
          controller.error(error);
        }
      });

      // Handle client disconnection
      request.signal.addEventListener("abort", async () => {
        isAborted = true;
        void app.exit();
        controller.close();
      });

      // Start the workflow
      app
        .run(
          { query },
          {
            disableHistory: true,
            timeout: 1000 * 60 * 5,
          }
        )
        .then((result) => {
          if (!result.isOk) {
            logger.error("Workflow execution error:", result.error);
          }
        });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
