import { execFile } from "child_process";
import { writeFile, mkdir, rm } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { tmpdir } from "os";
import type { Language, SubmissionStatus } from "@site-exo/shared";

const MAX_TIMEOUT = 10_000;
const MAX_OUTPUT = 10_000;

interface RunResult {
  status: SubmissionStatus;
  output: string;
  passed: boolean;
}

async function runInSandbox(
  cmd: string,
  args: string[],
  cwd: string,
  timeoutMs: number
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    const proc = execFile(cmd, args, {
      cwd,
      timeout: timeoutMs,
      maxBuffer: 1024 * 1024,
      env: { ...process.env, PATH: process.env.PATH },
    }, (error, stdout, stderr) => {
      const exitCode = error ? (error as any).code ?? 1 : 0;
      resolve({
        stdout: (stdout || "").slice(0, MAX_OUTPUT),
        stderr: (stderr || "").slice(0, MAX_OUTPUT),
        exitCode: typeof exitCode === "number" ? exitCode : 1,
      });
    });
  });
}

async function runC(code: string, tests: string, workDir: string): Promise<RunResult> {
  const combined = `${code}\n\n// --- TESTS ---\n${tests}`;
  const srcFile = join(workDir, "solution.c");
  const outFile = join(workDir, "solution");

  await writeFile(srcFile, combined);

  // Compile
  const compile = await runInSandbox("gcc", ["-o", outFile, srcFile, "-lm", "-Wall"], workDir, MAX_TIMEOUT);
  if (compile.exitCode !== 0) {
    return { status: "error", output: `Erreur de compilation:\n${compile.stderr}`, passed: false };
  }

  // Run
  const run = await runInSandbox(outFile, [], workDir, MAX_TIMEOUT);
  if (run.exitCode !== 0) {
    return {
      status: run.stderr.includes("timeout") ? "timeout" : "failure",
      output: run.stdout + (run.stderr ? `\nStderr:\n${run.stderr}` : ""),
      passed: false,
    };
  }

  const passed = run.stdout.includes("ALL TESTS PASSED");
  return { status: passed ? "success" : "failure", output: run.stdout, passed };
}

async function runPython(code: string, tests: string, workDir: string): Promise<RunResult> {
  const combined = `${code}\n\n# --- TESTS ---\n${tests}`;
  const srcFile = join(workDir, "solution.py");

  await writeFile(srcFile, combined);

  const run = await runInSandbox("python3", [srcFile], workDir, MAX_TIMEOUT);
  if (run.exitCode !== 0) {
    return {
      status: run.stderr.includes("timeout") ? "timeout" : "failure",
      output: run.stdout + (run.stderr ? `\nErreur:\n${run.stderr}` : ""),
      passed: false,
    };
  }

  const passed = run.stdout.includes("ALL TESTS PASSED");
  return { status: passed ? "success" : "failure", output: run.stdout, passed };
}

async function runTypescript(code: string, tests: string, workDir: string): Promise<RunResult> {
  const srcFile = join(workDir, "solution.ts");
  const testFile = join(workDir, "tests.ts");

  await writeFile(srcFile, code);
  await writeFile(testFile, tests);

  const run = await runInSandbox("npx", ["tsx", testFile], workDir, MAX_TIMEOUT);
  if (run.exitCode !== 0) {
    return {
      status: run.stderr.includes("timeout") ? "timeout" : "failure",
      output: run.stdout + (run.stderr ? `\nErreur:\n${run.stderr}` : ""),
      passed: false,
    };
  }

  const passed = run.stdout.includes("ALL TESTS PASSED");
  return { status: passed ? "success" : "failure", output: run.stdout, passed };
}

export async function runCode(
  language: Language,
  code: string,
  tests: string
): Promise<RunResult> {
  const workDir = join(tmpdir(), `exo-run-${randomUUID()}`);
  await mkdir(workDir, { recursive: true });

  try {
    switch (language) {
      case "c":
        return await runC(code, tests, workDir);
      case "python":
        return await runPython(code, tests, workDir);
      case "typescript":
        return await runTypescript(code, tests, workDir);
      default:
        return { status: "error", output: "Langage non supporté", passed: false };
    }
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
