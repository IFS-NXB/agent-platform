import { exec } from "child_process";
import { FILE_BASED_MCP_CONFIG, IS_DOCKER_ENV, IS_VERCEL_ENV } from "lib/const";
import "load-env";
import { promisify } from "util";
const execPromise = promisify(exec);

async function runCommand(command: string, description: string) {
  console.log(`Starting: ${description}`);
  try {
    const { stdout, stderr } = await execPromise(command, {
      cwd: process.cwd(),
      env: process.env,
    });

    console.log(`${description} output:`);
    console.log(stdout);

    if (stderr) {
      console.error(`${description} stderr:`);
      console.error(stderr);
    }
    console.log(`${description} finished successfully.`);
  } catch (error: any) {
    console.error(`${description} error:`, error);
    process.exit(1);
  }
}

async function main() {
  if (IS_VERCEL_ENV) {
    if (FILE_BASED_MCP_CONFIG) {
      console.error("File based MCP config is not supported on Vercel.");
      process.exit(1);
    }
    console.log("Running on Vercel, performing database migration.");
    await runCommand("yarn db:migrate", "Database migration");
  } else if (IS_DOCKER_ENV) {
    if (FILE_BASED_MCP_CONFIG) {
      console.error("File based MCP config is not supported in Docker.");
      process.exit(1);
    }
  } else {
    console.log(
      "Running in a normal environment, performing initial environment setup.",
    );
    await runCommand("yarn initial:env", "Initial environment setup");
    await runCommand(
      "yarn openai-compatiable:init",
      "Initial openAI compatiable config setup",
    );
  }
}

main();
