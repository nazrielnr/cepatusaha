type LogEnv = { NODE_ENV?: string; DEBUG_LOGS?: string } | undefined;
type Level = 'debug' | 'warn' | 'error';

function emit(level: Level, env: LogEnv, message: unknown, data: unknown[]): void {
  if (level === 'debug' && env?.DEBUG_LOGS !== 'true') return;
  const entry = JSON.stringify({ level, message, ...(data.length ? { data } : {}) });
  if (level === 'error') console.error(entry);
  else if (level === 'warn') console.warn(entry);
  else console.log(entry);
}

export function debugLog(env: LogEnv, message: unknown, ...data: unknown[]): void { emit('debug', env, message, data); }
export function warnLog(env: LogEnv, message: unknown, ...data: unknown[]): void { emit('warn', env, message, data); }
export function errorLog(env: LogEnv, message: unknown, ...data: unknown[]): void { emit('error', env, message, data); }
