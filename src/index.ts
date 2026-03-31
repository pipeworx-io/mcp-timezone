interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Timezone MCP — wraps WorldTimeAPI (free, no auth)
 *
 * Tools:
 * - get_time_by_timezone: current time for a named IANA timezone
 * - list_timezones: all available timezone strings
 * - get_time_by_ip: current time based on caller/specified IP address
 * - convert_time: convert a datetime between two timezones
 */


const BASE_URL = 'http://worldtimeapi.org/api';

// Shape returned by WorldTimeAPI for a single timezone or IP lookup
interface WorldTimeResponse {
  datetime: string;
  timezone: string;
  utc_offset: string;
  day_of_week: number;
  day_of_year: number;
  week_number: number;
  utc_datetime: string;
  unixtime: number;
}

const tools: McpToolExport['tools'] = [
  {
    name: 'get_time_by_timezone',
    description:
      'Get the current date and time in a specific IANA timezone (e.g. "America/New_York", "Europe/London", "Asia/Tokyo").',
    inputSchema: {
      type: 'object',
      properties: {
        timezone: {
          type: 'string',
          description: 'IANA timezone string, e.g. "America/New_York"',
        },
      },
      required: ['timezone'],
    },
  },
  {
    name: 'list_timezones',
    description: 'List all IANA timezone strings available from WorldTimeAPI.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_time_by_ip',
    description:
      'Get the current date and time based on the geolocation of an IP address.',
    inputSchema: {
      type: 'object',
      properties: {
        ip: {
          type: 'string',
          description: 'IPv4 or IPv6 address to look up',
        },
      },
      required: ['ip'],
    },
  },
  {
    name: 'convert_time',
    description:
      'Convert a datetime from one timezone to another. If no time is provided the current time is used.',
    inputSchema: {
      type: 'object',
      properties: {
        from_timezone: {
          type: 'string',
          description: 'Source IANA timezone, e.g. "America/New_York"',
        },
        to_timezone: {
          type: 'string',
          description: 'Target IANA timezone, e.g. "Europe/Paris"',
        },
        time: {
          type: 'string',
          description:
            'ISO 8601 datetime to convert (optional — defaults to now). E.g. "2024-06-15T14:30:00"',
        },
      },
      required: ['from_timezone', 'to_timezone'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'get_time_by_timezone':
      return getTimeByTimezone(args.timezone as string);
    case 'list_timezones':
      return listTimezones();
    case 'get_time_by_ip':
      return getTimeByIp(args.ip as string);
    case 'convert_time':
      return convertTime(
        args.from_timezone as string,
        args.to_timezone as string,
        args.time as string | undefined,
      );
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function fetchTimezone(path: string): Promise<WorldTimeResponse> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    throw new Error(`WorldTimeAPI error ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<WorldTimeResponse>;
}

async function getTimeByTimezone(timezone: string) {
  const data = await fetchTimezone(`/timezone/${timezone}`);
  return {
    datetime: data.datetime,
    timezone: data.timezone,
    utc_offset: data.utc_offset,
    day_of_week: data.day_of_week,
    day_of_year: data.day_of_year,
    week_number: data.week_number,
  };
}

async function listTimezones(): Promise<{ timezones: string[] }> {
  const res = await fetch(`${BASE_URL}/timezone`);
  if (!res.ok) {
    throw new Error(`WorldTimeAPI error ${res.status}: ${res.statusText}`);
  }
  const data = (await res.json()) as string[];
  return { timezones: data };
}

async function getTimeByIp(ip: string) {
  const data = await fetchTimezone(`/ip/${ip}`);
  return {
    datetime: data.datetime,
    timezone: data.timezone,
    utc_offset: data.utc_offset,
  };
}

// Parse a UTC offset string like "+05:30" or "-04:00" into total minutes.
function parseOffsetMinutes(offset: string): number {
  const match = offset.match(/^([+-])(\d{2}):(\d{2})$/);
  if (!match) throw new Error(`Unrecognised UTC offset format: "${offset}"`);
  const sign = match[1] === '+' ? 1 : -1;
  return sign * (parseInt(match[2], 10) * 60 + parseInt(match[3], 10));
}

// Format a total-minutes offset back to "+HH:MM" / "-HH:MM".
function formatOffset(totalMinutes: number): string {
  const sign = totalMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(totalMinutes);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return `${sign}${hh}:${mm}`;
}

async function convertTime(
  fromTimezone: string,
  toTimezone: string,
  time?: string,
) {
  // Fetch both timezones in parallel to get their current UTC offsets.
  const [fromData, toData] = await Promise.all([
    fetchTimezone(`/timezone/${fromTimezone}`),
    fetchTimezone(`/timezone/${toTimezone}`),
  ]);

  const fromOffsetMin = parseOffsetMinutes(fromData.utc_offset);
  const toOffsetMin = parseOffsetMinutes(toData.utc_offset);
  const diffMinutes = toOffsetMin - fromOffsetMin;

  // Determine the source datetime: use the provided time or the current time
  // in the source timezone as reported by the API.
  const sourceDatetime = time ?? fromData.datetime;

  // Parse the source datetime as a local wall-clock time (strip any existing
  // offset/Z so we treat it as the from-timezone's local time).
  const localStr = sourceDatetime.replace(/([+-]\d{2}:\d{2}|Z)$/, '');
  const sourceMs = new Date(localStr).getTime();

  if (isNaN(sourceMs)) {
    throw new Error(`Could not parse datetime: "${sourceDatetime}"`);
  }

  // Shift by the offset difference to obtain the target wall-clock time.
  const targetMs = sourceMs + diffMinutes * 60 * 1000;
  const targetDate = new Date(targetMs);

  // Format as ISO 8601 local datetime (no trailing Z — it is a wall-clock time).
  const pad = (n: number) => String(n).padStart(2, '0');
  const targetDatetime =
    `${targetDate.getUTCFullYear()}-${pad(targetDate.getUTCMonth() + 1)}-${pad(targetDate.getUTCDate())}` +
    `T${pad(targetDate.getUTCHours())}:${pad(targetDate.getUTCMinutes())}:${pad(targetDate.getUTCSeconds())}`;

  return {
    from_timezone: fromTimezone,
    from_datetime: localStr,
    from_utc_offset: fromData.utc_offset,
    to_timezone: toTimezone,
    to_datetime: targetDatetime,
    to_utc_offset: toData.utc_offset,
    offset_difference: formatOffset(diffMinutes),
  };
}

export default { tools, callTool } satisfies McpToolExport;
