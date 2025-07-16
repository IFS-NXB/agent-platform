import { colorize } from "consola/utils";
import equal from "lib/equal";
import { mcpRepository } from "lib/supabase/repositories";
import { createDebounce } from "lib/utils";
import defaultLogger from "logger";
import type {
  MCPClientsManager,
  MCPConfigStorage,
} from "./create-mcp-clients-manager";

const logger = defaultLogger.withDefaults({
  message: colorize("gray", `MCP Config Storage: `),
});

export function createDbBasedMCPConfigsStorage(): MCPConfigStorage {
  let manager: MCPClientsManager;

  const debounce = createDebounce();

  // Initializes the manager with configs from the database
  async function init(_manager: MCPClientsManager): Promise<void> {
    manager = _manager;
  }

  // This function should only be called in response to a user request
  async function checkAndRefreshClients() {
    try {
      logger.debug("Checking MCP clients Diff");
      const servers = await mcpRepository.selectAll();
      const dbConfigs = servers
        .map((server) => ({
          id: server.id,
          name: server.name,
          config: server.config,
        }))
        .sort((a, b) => a.id.localeCompare(b.id));

      const managerConfigs = await manager
        .getClients()
        .then((clients) =>
          clients.map(({ id, client }) => {
            const info = client.getInfo();
            return {
              id: id,
              name: info.name,
              config: info.config,
            };
          })
        )
        .then((configs) => configs.sort((a, b) => a.id.localeCompare(b.id)));

      let shouldRefresh = false;
      if (dbConfigs.length !== managerConfigs.length) {
        shouldRefresh = true;
      } else if (!equal(dbConfigs, managerConfigs)) {
        shouldRefresh = true;
      }

      if (shouldRefresh) {
        const refreshPromises = dbConfigs.map(async ({ id, name, config }) => {
          const managerConfig = await manager.getClient(id);
          if (!managerConfig) {
            logger.debug(`Adding MCP client ${name}`);
            return manager.addClient(id, name, config as any);
          }
          if (
            !equal(
              { name, config },
              {
                name: managerConfig.name,
                config: managerConfig.client.getInfo().config,
              }
            )
          ) {
            logger.debug(`Refreshing MCP client ${name}`);
            return manager.refreshClient(id);
          }
        });
        const deletePromises = managerConfigs
          .filter((c) => {
            const dbConfig = dbConfigs.find((c2) => c2.id === c.id);
            return !dbConfig;
          })
          .map((c) => {
            logger.debug(`Removing MCP client ${c.name}`);
            return manager.removeClient(c.id);
          });
        await Promise.allSettled([...refreshPromises, ...deletePromises]);
      }
    } catch (error) {
      logger.error("Failed to check and refresh clients:", error);
    }
  }

  // Removed background refresh: only call checkAndRefreshClients() in response to a user request
  // setInterval(() => debounce(checkAndRefreshClients, 5000), 60000).unref();

  return {
    init,
    async loadAll() {
      try {
        // Optionally, you can call checkAndRefreshClients() here if this is always called in a request context
        // await checkAndRefreshClients();
        // Return empty array during initialization to avoid auth issues
        // The actual loading will happen when checkAndRefreshClients runs
        return [];
      } catch (error) {
        logger.error("Failed to load MCP configs from database:", error);
        return [];
      }
    },
    async save(server) {
      try {
        return mcpRepository.save({
          ...server,
          enabled: server.enabled ?? true,
        });
      } catch (error) {
        logger.error(
          `Failed to save MCP config "${server.name}" to database:`,
          error
        );
        throw error;
      }
    },
    async delete(id) {
      try {
        await mcpRepository.deleteById(id);
      } catch (error) {
        logger.error(
          `Failed to delete MCP config "${id}" from database:",`,
          error
        );
        throw error;
      }
    },
    async has(id: string): Promise<boolean> {
      try {
        const server = await mcpRepository.selectById(id);
        return !!server;
      } catch (error) {
        logger.error(`Failed to check MCP config "${id}" in database:`, error);
        return false;
      }
    },
    async get(id) {
      return mcpRepository.selectById(id);
    },
  };
}
