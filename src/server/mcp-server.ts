import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { allTools } from './mcp/tools';

/**
 * Create and configure the MCP server
 */
function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "particles-server",
    version: "1.0.0"
  });

  // Register all tools
  allTools.forEach(tool => {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema
      },
      tool.handler
    );
  });

  return server;
}

/**
 * Start the MCP server with stdio transport
 */
async function startMcpServer(): Promise<void> {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  
  console.log("Starting MCP server...");
  await server.connect(transport);
  console.log("MCP server connected and ready");
}

// Start the MCP server
startMcpServer().catch(console.error);
