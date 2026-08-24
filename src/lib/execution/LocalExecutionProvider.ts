import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import {
  ExecutionRequest,
  ExecutionResult,
  IExecutionProvider,
  LanguageType
} from './types';

const MAX_OUTPUT_LIMIT = 100000; // 100KB character limit
const DEFAULT_TIMEOUT_MS = 5000; // 5 seconds execution timeout

interface ProcessRunResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
  error?: Error;
}

export class LocalExecutionProvider implements IExecutionProvider {
  private isWindows = os.platform() === 'win32';

  public async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const { language, code, stdin = '' } = request;

    // 1. Check local runtime availability
    const missingRuntimeMessage = await this.checkRuntimeAvailability(language);
    if (missingRuntimeMessage) {
      return {
        status: 'execution_error',
        stdout: '',
        stderr: missingRuntimeMessage,
        executionTimeMs: 0,
        exitCode: 1
      };
    }

    // 2. Create unique temporary workspace
    const uniqueId = crypto.randomUUID();
    const tmpDir = path.join(os.tmpdir(), `codespace-exec-${uniqueId}`);

    try {
      await fs.mkdir(tmpDir, { recursive: true });

      switch (language) {
        case 'c':
          return await this.executeC(tmpDir, code, stdin);
        case 'cpp':
          return await this.executeCpp(tmpDir, code, stdin);
        case 'python':
          return await this.executePython(tmpDir, code, stdin);
        case 'java':
          return await this.executeJava(tmpDir, code, stdin);
        default:
          return {
            status: 'execution_error',
            stdout: '',
            stderr: `Unsupported language: ${language}`,
            executionTimeMs: 0
          };
      }
    } catch (err: any) {
      return {
        status: 'execution_error',
        stdout: '',
        stderr: `Local execution error: ${err.message || String(err)}`,
        executionTimeMs: 0
      };
    } finally {
      // 3. Cleanup temporary directory in finally block
      try {
        await fs.rm(tmpDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors to prevent application crash
      }
    }
  }

  /**
   * Checks whether the required binary exists in system PATH
   */
  private async checkRuntimeAvailability(language: LanguageType): Promise<string | null> {
    const checker = this.isWindows ? 'where.exe' : 'which';

    if (language === 'c') {
      const res = await this.runProcess(checker, ['gcc'], process.cwd(), '', 2000);
      if (res.exitCode !== 0) {
        return 'C compiler not found.\n\nCodeSpace could not find gcc in your system PATH.\nInstall a C compiler (e.g. GCC/MinGW) and make sure gcc is available from the terminal.';
      }
    } else if (language === 'cpp') {
      const res = await this.runProcess(checker, ['g++'], process.cwd(), '', 2000);
      if (res.exitCode !== 0) {
        return 'C++ compiler not found.\n\nCodeSpace could not find g++ in your system PATH.\nInstall a C++ compiler (e.g. G++/MinGW) and make sure g++ is available from the terminal.';
      }
    } else if (language === 'python') {
      const res1 = await this.runProcess(checker, ['python'], process.cwd(), '', 2000);
      const res2 = await this.runProcess(checker, ['python3'], process.cwd(), '', 2000);
      if (res1.exitCode !== 0 && res2.exitCode !== 0) {
        return 'Python runtime not found.\n\nCodeSpace could not find python or python3 in your system PATH.\nInstall Python and make sure python is available from the terminal.';
      }
    } else if (language === 'java') {
      const resJavac = await this.runProcess(checker, ['javac'], process.cwd(), '', 2000);
      const resJava = await this.runProcess(checker, ['java'], process.cwd(), '', 2000);
      if (resJavac.exitCode !== 0 || resJava.exitCode !== 0) {
        return 'Java JDK runtime not found.\n\nCodeSpace could not find javac or java in your system PATH.\nInstall OpenJDK / Java JDK and make sure javac and java are available from the terminal.';
      }
    }

    return null;
  }

  // C Execution Logic
  private async executeC(tmpDir: string, code: string, stdin: string): Promise<ExecutionResult> {
    const sourcePath = path.join(tmpDir, 'main.c');
    const exeName = this.isWindows ? 'main.exe' : 'main';
    const exePath = path.join(tmpDir, exeName);

    await fs.writeFile(sourcePath, code, 'utf-8');

    // Compile C
    const compile = await this.runProcess('gcc', ['main.c', '-o', exeName], tmpDir, '', DEFAULT_TIMEOUT_MS);

    if (compile.timedOut) {
      return {
        status: 'timeout',
        stdout: '',
        stderr: 'Compilation timed out after 5 seconds.',
        executionTimeMs: DEFAULT_TIMEOUT_MS
      };
    }

    if (compile.exitCode !== 0) {
      return {
        status: 'compile_error',
        stdout: compile.stdout,
        stderr: compile.stderr || 'Compilation failed.',
        exitCode: compile.exitCode
      };
    }

    // Run C Binary
    const startTime = performance.now();
    const run = await this.runProcess(exePath, [], tmpDir, stdin, DEFAULT_TIMEOUT_MS);
    const executionTimeMs = Math.round(performance.now() - startTime);

    if (run.timedOut) {
      return {
        status: 'timeout',
        stdout: run.stdout,
        stderr: 'Execution timed out after 5 seconds.',
        executionTimeMs
      };
    }

    if (run.exitCode !== 0) {
      return {
        status: 'runtime_error',
        stdout: run.stdout,
        stderr: run.stderr || `Process exited with code ${run.exitCode}`,
        exitCode: run.exitCode,
        executionTimeMs
      };
    }

    return {
      status: 'success',
      stdout: run.stdout,
      stderr: run.stderr,
      exitCode: 0,
      executionTimeMs
    };
  }

  // C++ Execution Logic
  private async executeCpp(tmpDir: string, code: string, stdin: string): Promise<ExecutionResult> {
    const sourcePath = path.join(tmpDir, 'main.cpp');
    const exeName = this.isWindows ? 'main.exe' : 'main';
    const exePath = path.join(tmpDir, exeName);

    await fs.writeFile(sourcePath, code, 'utf-8');

    // Compile C++
    const compile = await this.runProcess('g++', ['main.cpp', '-o', exeName], tmpDir, '', DEFAULT_TIMEOUT_MS);

    if (compile.timedOut) {
      return {
        status: 'timeout',
        stdout: '',
        stderr: 'Compilation timed out after 5 seconds.',
        executionTimeMs: DEFAULT_TIMEOUT_MS
      };
    }

    if (compile.exitCode !== 0) {
      return {
        status: 'compile_error',
        stdout: compile.stdout,
        stderr: compile.stderr || 'Compilation failed.',
        exitCode: compile.exitCode
      };
    }

    // Run C++ Binary
    const startTime = performance.now();
    const run = await this.runProcess(exePath, [], tmpDir, stdin, DEFAULT_TIMEOUT_MS);
    const executionTimeMs = Math.round(performance.now() - startTime);

    if (run.timedOut) {
      return {
        status: 'timeout',
        stdout: run.stdout,
        stderr: 'Execution timed out after 5 seconds.',
        executionTimeMs
      };
    }

    if (run.exitCode !== 0) {
      return {
        status: 'runtime_error',
        stdout: run.stdout,
        stderr: run.stderr || `Process exited with code ${run.exitCode}`,
        exitCode: run.exitCode,
        executionTimeMs
      };
    }

    return {
      status: 'success',
      stdout: run.stdout,
      stderr: run.stderr,
      exitCode: 0,
      executionTimeMs
    };
  }

  // Python Execution Logic
  private async executePython(tmpDir: string, code: string, stdin: string): Promise<ExecutionResult> {
    const sourcePath = path.join(tmpDir, 'main.py');
    await fs.writeFile(sourcePath, code, 'utf-8');

    // Check python binary executable name
    let pyBin = 'python';
    const checker = this.isWindows ? 'where.exe' : 'which';
    const pyCheck = await this.runProcess(checker, ['python'], process.cwd(), '', 1000);
    if (pyCheck.exitCode !== 0) {
      pyBin = 'python3';
    }

    const startTime = performance.now();
    const run = await this.runProcess(pyBin, ['main.py'], tmpDir, stdin, DEFAULT_TIMEOUT_MS);
    const executionTimeMs = Math.round(performance.now() - startTime);

    if (run.timedOut) {
      return {
        status: 'timeout',
        stdout: run.stdout,
        stderr: 'Execution timed out after 5 seconds.',
        executionTimeMs
      };
    }

    if (run.exitCode !== 0) {
      return {
        status: 'runtime_error',
        stdout: run.stdout,
        stderr: run.stderr || `Process exited with code ${run.exitCode}`,
        exitCode: run.exitCode,
        executionTimeMs
      };
    }

    return {
      status: 'success',
      stdout: run.stdout,
      stderr: run.stderr,
      exitCode: 0,
      executionTimeMs
    };
  }

  // Java Execution Logic
  private async executeJava(tmpDir: string, code: string, stdin: string): Promise<ExecutionResult> {
    const sourcePath = path.join(tmpDir, 'Main.java');
    await fs.writeFile(sourcePath, code, 'utf-8');

    // Compile Java: javac Main.java
    const compile = await this.runProcess('javac', ['Main.java'], tmpDir, '', DEFAULT_TIMEOUT_MS);

    if (compile.timedOut) {
      return {
        status: 'timeout',
        stdout: '',
        stderr: 'Compilation timed out after 5 seconds.',
        executionTimeMs: DEFAULT_TIMEOUT_MS
      };
    }

    if (compile.exitCode !== 0) {
      return {
        status: 'compile_error',
        stdout: compile.stdout,
        stderr: compile.stderr || 'Java compilation failed.',
        exitCode: compile.exitCode
      };
    }

    // Run Java Class: java -cp . Main
    const startTime = performance.now();
    const run = await this.runProcess('java', ['-cp', '.', 'Main'], tmpDir, stdin, DEFAULT_TIMEOUT_MS);
    const executionTimeMs = Math.round(performance.now() - startTime);

    if (run.timedOut) {
      return {
        status: 'timeout',
        stdout: run.stdout,
        stderr: 'Execution timed out after 5 seconds.',
        executionTimeMs
      };
    }

    if (run.exitCode !== 0) {
      return {
        status: 'runtime_error',
        stdout: run.stdout,
        stderr: run.stderr || `Process exited with code ${run.exitCode}`,
        exitCode: run.exitCode,
        executionTimeMs
      };
    }

    return {
      status: 'success',
      stdout: run.stdout,
      stderr: run.stderr,
      exitCode: 0,
      executionTimeMs
    };
  }

  /**
   * Safely spawns child process with separate args, stdin piping, timeout control, and output character limits.
   */
  private runProcess(
    command: string,
    args: string[],
    cwd: string,
    stdinText: string,
    timeoutMs: number
  ): Promise<ProcessRunResult> {
    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let timedOut = false;
      let isSettled = false;

      const child = spawn(command, args, {
        cwd,
        env: { ...process.env },
        windowsHide: true
      });

      const timer = setTimeout(() => {
        timedOut = true;
        try {
          child.kill('SIGKILL');
        } catch {
          // ignore kill errors
        }
      }, timeoutMs);

      // Write stdin if provided
      if (stdinText && child.stdin) {
        try {
          child.stdin.write(stdinText);
          child.stdin.end();
        } catch {
          // Ignore stdin stream errors if process exits early
        }
      } else if (child.stdin) {
        child.stdin.end();
      }

      // Collect stdout with character limit
      if (child.stdout) {
        child.stdout.on('data', (chunk) => {
          if (stdout.length < MAX_OUTPUT_LIMIT) {
            stdout += chunk.toString('utf-8');
            if (stdout.length >= MAX_OUTPUT_LIMIT) {
              stdout += '\n[Output truncated: Maximum limit of 100KB reached]';
            }
          }
        });
      }

      // Collect stderr with character limit
      if (child.stderr) {
        child.stderr.on('data', (chunk) => {
          if (stderr.length < MAX_OUTPUT_LIMIT) {
            stderr += chunk.toString('utf-8');
            if (stderr.length >= MAX_OUTPUT_LIMIT) {
              stderr += '\n[Output truncated: Maximum limit of 100KB reached]';
            }
          }
        });
      }

      child.on('error', (err) => {
        if (isSettled) return;
        isSettled = true;
        clearTimeout(timer);
        resolve({
          stdout,
          stderr: stderr || err.message,
          exitCode: 1,
          timedOut: false,
          error: err
        });
      });

      child.on('close', (code) => {
        if (isSettled) return;
        isSettled = true;
        clearTimeout(timer);
        resolve({
          stdout,
          stderr,
          exitCode: code,
          timedOut
        });
      });
    });
  }
}
