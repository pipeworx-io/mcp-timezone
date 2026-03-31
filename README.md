# mcp-timezone

Timezone MCP — wraps WorldTimeAPI (free, no auth)

Part of the [Pipeworx](https://pipeworx.io) open MCP gateway.

## Tools

| Tool | Description |
|------|-------------|
| `list_timezones` | List all IANA timezone strings available from WorldTimeAPI. |

## Quick Start

Add to your MCP client config:

```json
{
  "mcpServers": {
    "timezone": {
      "url": "https://gateway.pipeworx.io/timezone/mcp"
    }
  }
}
```

Or use the CLI:

```bash
npx pipeworx use timezone
```

## License

MIT
