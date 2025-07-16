"use server";
import { auth } from "@clerk/nextjs/server";
import { workflowRepository } from "lib/supabase/repositories";
import logger from "logger";

export async function selectExecuteAbilityWorkflowsAction() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User not found");
  }

  try {
    // Get workflows owned by the user
    const userWorkflows = await workflowRepository.getWorkflows(userId);

    // Get all public workflows (workflows with visibility = "public")
    const publicWorkflows = await workflowRepository.getPublicWorkflows();

    // Filter out user's own workflows from public workflows to avoid duplicates
    const publicWorkflowsFiltered = publicWorkflows.filter(
      (workflow) => workflow.user_id !== userId
    );

    // Combine user workflows and public workflows
    const allExecutableWorkflows = [
      ...userWorkflows,
      ...publicWorkflowsFiltered,
    ];

    logger.info("Retrieved executable workflows", {
      userId,
      userWorkflowCount: userWorkflows.length,
      publicWorkflowCount: publicWorkflowsFiltered.length,
      totalCount: allExecutableWorkflows.length,
    });

    return allExecutableWorkflows;
  } catch (error) {
    logger.error("Error selecting executable workflows", { userId, error });
    throw error;
  }
}
