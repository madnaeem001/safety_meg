/**
 * Simple Logger Service
 * Structured logging for debugging and production monitoring
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  data?: any;
  error?: string;
}

class Logger {
  private service: string;

  constructor(service: string) {
    this.service = service;
  }

  private format(level: LogLevel, message: string, data?: any, error?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      message,
      ...(data && { data }),
      ...(error && { error: error instanceof Error ? error.message : String(error) })
    };
  }

  debug(message: string, data?: any) {
    const entry = this.format('DEBUG', message, data);
    console.log(`[${entry.level}] ${entry.service}: ${message}`, data ? JSON.stringify(data) : '');
  }

  info(message: string, data?: any) {
    const entry = this.format('INFO', message, data);
    console.log(`[${entry.level}] ${entry.service}: ${message}`, data ? JSON.stringify(data) : '');
  }

  warn(message: string, data?: any) {
    const entry = this.format('WARN', message, data);
    console.warn(`[${entry.level}] ${entry.service}: ${message}`, data ? JSON.stringify(data) : '');
  }

  error(message: string, error?: any, data?: any) {
    const entry = this.format('ERROR', message, data, error);
    console.error(`[${entry.level}] ${entry.service}: ${message}`, error instanceof Error ? error.message : error, data ? JSON.stringify(data) : '');
  }
}

// Export factory function to create loggers
export function createLogger(service: string): Logger {
  return new Logger(service);
}

// Export default instance for global use
export const logger = createLogger('App');
