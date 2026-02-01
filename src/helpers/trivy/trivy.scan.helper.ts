import { Injectable } from '@nestjs/common';
import { spawn } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { LocalPathHelper } from '../local-path/local-path.helper';

type TrivyScanDirectoryResult = {
  reportPath: string;
};

const DEFAULT_REPORTS_DIRNAME = 'scanner-reports';
const MAX_CAPTURED_BYTES = 64 * 1024;

@Injectable()
export class TrivyScanHelper {
  async scanDirectory(
    scanId: string,
    localRepoPath: string,
  ): Promise<TrivyScanDirectoryResult> {
    const reportsDir = path.resolve(
      LocalPathHelper.getDefaultBaseDir(),
      DEFAULT_REPORTS_DIRNAME,
    );
    await fs.mkdir(reportsDir, { recursive: true });

    const reportFileName = `report_${scanId}.json`;
    const reportPath = path.resolve(reportsDir, reportFileName);

    // Use docker-compose Trivy service and mount local paths into the container.
    // This keeps the heavy work out of the Node.js process memory.
    const args = [
      'compose',
      'run',
      '--rm',
      '-T',
      '-v',
      `${path.resolve(localRepoPath)}:/work:ro`,
      '-v',
      `${reportsDir}:/reports`,
      'trivy',
      'fs',
      '--quiet',
      '--format',
      'json',
      '--output',
      `/reports/${reportFileName}`,
      '/work',
    ];

    await this.spawnAndWait('docker', args, {
      cwd: process.cwd(),
      env: process.env,
    });

    return { reportPath };
  }

  private spawnAndWait(
    command: string,
    args: string[],
    options: { cwd?: string; env?: NodeJS.ProcessEnv },
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        cwd: options.cwd,
        env: options.env,
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stderr = Buffer.alloc(0);
      let stdout = Buffer.alloc(0);

      child.stdout?.on('data', (chunk: Buffer) => {
        stdout = Buffer.concat([stdout, chunk]);
        if (stdout.length > MAX_CAPTURED_BYTES) {
          stdout = stdout.subarray(stdout.length - MAX_CAPTURED_BYTES);
        }
      });

      child.stderr?.on('data', (chunk: Buffer) => {
        stderr = Buffer.concat([stderr, chunk]);
        if (stderr.length > MAX_CAPTURED_BYTES) {
          stderr = stderr.subarray(stderr.length - MAX_CAPTURED_BYTES);
        }
      });

      child.on('error', (error) => {
        reject(error);
      });

      child.on('close', (code, signal) => {
        if (code === 0) {
          resolve();
          return;
        }

        const details = [
          `command: ${command} ${args.join(' ')}`,
          `exitCode: ${code ?? 'null'}`,
          `signal: ${signal ?? 'null'}`,
          stdout.length ? `stdout (tail):\n${stdout.toString('utf8')}` : null,
          stderr.length ? `stderr (tail):\n${stderr.toString('utf8')}` : null,
        ]
          .filter(Boolean)
          .join('\n');

        reject(new Error(`Trivy scan failed\n${details}`));
      });
    });
  }
}
