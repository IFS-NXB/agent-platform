import Workflow from "@/components/workflow/workflow";
import { DBEdge, DBNode } from "app-types/workflow";
import {
  convertDBEdgeToUIEdge,
  convertDBNodeToUINode,
} from "lib/ai/workflow/shared.workflow";
import { getSessionOrRedirect } from "lib/auth/server";
import { workflowRepository } from "lib/supabase/repositories";
import { notFound } from "next/navigation";

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

export default async function WorkflowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSessionOrRedirect();
  const hasAccess = await workflowRepository.checkAccess(id, session.user.id);
  if (!hasAccess) {
    return new Response("Unauthorized", { status: 401 });
  }
  const workflow = await workflowRepository.selectStructureById(id);
  if (!workflow) {
    return notFound();
  }
  const hasEditAccess = await workflowRepository.checkAccess(
    id,
    session.user.id,
    false
  );
  const initialNodes = workflow.nodes
    .map(toCamelCaseNode)
    .map(convertDBNodeToUINode);
  const initialEdges = workflow.edges
    .map(toCamelCaseEdge)
    .map(convertDBEdgeToUIEdge);
  return (
    <Workflow
      key={id}
      workflowId={id}
      initialNodes={initialNodes}
      initialEdges={initialEdges}
      hasEditAccess={hasEditAccess}
    />
  );
}
