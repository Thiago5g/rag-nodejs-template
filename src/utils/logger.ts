type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel = (process.env.MCP_LOG_LEVEL as LogLevel) ?? 'info';

/**
 * Simple structured logger for MCP servers.
 *
 * Outputs JSON to stderr (stdout is reserved for MCP protocol messages).
 * In production, replace with Pino or Winston if needed.
 */
export const logger = {
  debug: (data: Record<string, unknown> | string, message?: string) => log('debug', data, message),
  info: (data: Record<string, unknown> | string, message?: string) => log('info', data, message),
  warn: (data: Record<string, unknown> | string, message?: string) => log('warn', data, message),
  error: (data: Record<string, unknown> | string, message?: string) => log('error', data, message),
};

function log(level: LogLevel, data: Record<string, unknown> | string, message?: string): void {
  if (LOG_LEVELS[level] < LOG_LEVELS[currentLevel]) return;

  const entry = {
    level,
    timestamp: new Date().toISOString(),
    ...(typeof data === 'string' ? { message: data } : { ...data, message }),
  };

  // Always write to stderr — stdout is for MCP protocol communication
  process.stderr.write(JSON.stringify(entry) + '\n');
}
