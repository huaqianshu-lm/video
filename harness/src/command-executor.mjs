import { spawn } from "node:child_process";

const DEFAULT_TIMEOUT_MS = 45 * 60 * 1_000;
const DEFAULT_OUTPUT_LIMIT = 20_000;

function appendLimited(current, chunk, limit) {
  const next = `${current}${chunk}`;
  return next.length > limit ? next.slice(-limit) : next;
}

function requireCommand(command) {
  if (!command || typeof command !== "string") {
    const error = new Error("Executor command is not configured");
    error.code = "executor-not-configured";
    throw error;
  }
  return command;
}

function parseArgs(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string")) {
      throw new Error("must be a JSON string array");
    }
    return parsed;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const configurationError = new Error(`Executor arguments must be a JSON string array: ${message}`);
    configurationError.code = "executor-config-invalid";
    throw configurationError;
  }
}

export function createCommandExecutor({
  name,
  command,
  args = [],
  cwd,
  env = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
  outputLimit = DEFAULT_OUTPUT_LIMIT,
  input,
  spawnImpl = spawn,
} = {}) {
  requireCommand(command);
  if (typeof input !== "function") throw new Error(`${name ?? "Command executor"} requires input()`);

  return {
    async run(context) {
      const payload = input(context);
      const child = spawnImpl(command, args, {
        cwd,
        env: { ...process.env, ...env },
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";
      let settled = false;
      let timeout = null;

      const result = await new Promise((resolve, reject) => {
        const finish = (callback, value) => {
          if (settled) return;
          settled = true;
          if (timeout) clearTimeout(timeout);
          callback(value);
        };

        child.stdout?.on("data", (chunk) => {
          stdout = appendLimited(stdout, chunk.toString(), outputLimit);
        });
        child.stderr?.on("data", (chunk) => {
          stderr = appendLimited(stderr, chunk.toString(), outputLimit);
        });
        child.once("error", (error) => finish(reject, error));
        child.once("close", (code, signal) => {
          if (code === 0) {
            finish(resolve, { executor: name ?? command, stdout, stderr });
            return;
          }
          const error = new Error(
            `${name ?? command} exited with ${signal ? `signal ${signal}` : `code ${code}`}`,
          );
          error.code = "executor-process-failed";
          error.stdout = stdout;
          error.stderr = stderr;
          finish(reject, error);
        });
        timeout = setTimeout(() => {
          child.kill("SIGTERM");
          const error = new Error(`${name ?? command} timed out after ${timeoutMs}ms`);
          error.code = "executor-timeout";
          error.stdout = stdout;
          error.stderr = stderr;
          finish(reject, error);
        }, timeoutMs);

        child.stdin?.end(JSON.stringify(payload));
      });

      return result;
    },
  };
}

export function commandConfigFromEnv(prefix) {
  const command = process.env[`${prefix}_COMMAND`];
  if (!command) {
    const error = new Error(`${prefix}_COMMAND is required`);
    error.code = "executor-not-configured";
    throw error;
  }
  return {
    command,
    args: parseArgs(process.env[`${prefix}_ARGS`]),
    cwd: process.env[`${prefix}_CWD`] || undefined,
  };
}
