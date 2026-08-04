# mcp-timezone

Timezone MCP — wraps timeapi.io (free, no auth)

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `get_time_by_timezone` | Get the current date and time in a specific IANA timezone (e.g. "America/New_York", "Europe/London", "Asia/Tokyo"). |
| `list_timezones` | List all 590+ IANA timezone strings available from timeapi.io. |
| `get_time_by_ip` | Get the current date and time for the timezone of an IP address (resolved via ip-api.com → timeapi.io). |
| `convert_time` | Convert a datetime from one timezone to another. If no time is provided the current time in the source timezone is used. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "timezone": {
      "url": "https://gateway.pipeworx.io/timezone/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Timezone data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
