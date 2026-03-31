# @pipeworx/mcp-timezone

MCP server for timezone data — current time, timezone conversion, and IP-based lookup via WorldTimeAPI.

## Tools

| Tool | Description |
|------|-------------|
| `get_time_by_timezone` | Get current date and time in a specific IANA timezone |
| `list_timezones` | List all available IANA timezone strings |
| `get_time_by_ip` | Get current time based on geolocation of an IP address |
| `convert_time` | Convert a datetime between two timezones |

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

Or run via CLI:

```bash
npx pipeworx use timezone
```

## License

MIT
