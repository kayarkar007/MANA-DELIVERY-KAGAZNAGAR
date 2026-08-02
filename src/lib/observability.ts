type LogContext = Record<string, unknown>;

const SENSITIVE_KEY_PATTERN = /password|token|secret|otp|authorization|cookie|email|phone|address|payment|card|signature/i;

function redact(value: unknown, key = ""): unknown {
    if (SENSITIVE_KEY_PATTERN.test(key)) return "[REDACTED]";
    if (Array.isArray(value)) return value.map((item) => redact(item));
    if (value && typeof value === "object") {
        return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([entryKey, entryValue]) => [entryKey, redact(entryValue, entryKey)]));
    }
    return value;
}

function write(level: "info" | "warn" | "error", event: string, context: LogContext = {}) {
    const payload = JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        event,
        ...redact(context) as LogContext,
    });
    console[level](payload);
}

export function getRequestId(request: Request) {
    return request.headers.get("x-request-id") || crypto.randomUUID();
}

export function logInfo(event: string, context?: LogContext) {
    write("info", event, context);
}

export function logWarn(event: string, context?: LogContext) {
    write("warn", event, context);
}

export function logError(event: string, error: unknown, context?: LogContext) {
    const message = error instanceof Error ? error.message : "Unknown error";
    write("error", event, { ...context, error: message });
}
