import { Injectable } from '@nestjs/common';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

const execFileAsync = promisify(execFile);

type SimpleGitLike = {
  env: (env: Record<string, string>) => SimpleGitLike;
  clone: (
    repoUrl: string,
    targetDir: string,
    options?: string[],
  ) => Promise<unknown>;
};

type SimpleGitFactory = (options: {
  timeout: { block: number };
}) => SimpleGitLike;

const TIMEOUT_MINUTES = 2;

type CloneOptions = {
  /**
   * If provided, cloned repo is placed into this directory.
   * Otherwise, a dedicated temp directory is created.
   */
  targetDir?: string;

  /**
   * If true, performs a shallow clone (`--depth 1`).
   * Defaults to true.
   */
  shallow?: boolean;

  /**
   * Git clone timeout in milliseconds.
   * Defaults to 2 minute.
   */
  timeoutMs?: number;
};

@Injectable()
export class RemoteRepoHelper {
  async clone(repoUrl: string, options: CloneOptions = {}): Promise<string> {
    const repoName = `${this.validateUrl(repoUrl)}_${Date.now()}`;
    const targetDir =
      options.targetDir ??
      path.resolve(__dirname, `../../../../scanner-tmp/${repoName}`);

    const shallow = options.shallow ?? true;
    const timeoutMs = options.timeoutMs ?? TIMEOUT_MINUTES * 60 * 1000;

    try {
      // Prefer using a npm library (simple-git) if it is installed.
      // simple-git uses child processes under the hood.
      const usedLibrary = await this.tryCloneWithSimpleGit({
        repoUrl,
        targetDir,
        shallow,
        timeoutMs,
      });

      if (!usedLibrary) {
        await this.cloneWithGitBinary({
          repoUrl,
          targetDir,
          shallow,
          timeoutMs,
        });
      }

      return targetDir;
    } catch (error: unknown) {
      console.error('Error on cloning repo');
      // await fs.rm(targetDir, { recursive: true, force: true }).catch(() => {
      //
      // });
      throw error;
    }
  }

  async cleanup(localPath: string): Promise<void> {
    if (!localPath?.trim()) return;
    await fs.rm(localPath, { recursive: true, force: true });
  }

  private async tryCloneWithSimpleGit(params: {
    repoUrl: string;
    targetDir: string;
    shallow: boolean;
    timeoutMs: number;
  }): Promise<boolean> {
    try {
      // Keep `simple-git` optional: using require avoids TS module-resolution errors
      // when the dependency is not installed.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require('simple-git') as unknown;

      if (!mod || typeof mod !== 'object') {
        return false;
      }

      const maybe = mod as { simpleGit?: unknown };
      if (typeof maybe.simpleGit !== 'function') {
        return false;
      }

      const simpleGit = maybe.simpleGit as SimpleGitFactory;

      const baseEnv = Object.fromEntries(
        Object.entries(process.env).filter(
          (entry): entry is [string, string] => typeof entry[1] === 'string',
        ),
      );
      const gitEnv: Record<string, string> = {
        ...baseEnv,
        GIT_TERMINAL_PROMPT: '0',
      };

      const git = simpleGit({
        timeout: {
          block: params.timeoutMs,
        },
      }).env(gitEnv);

      await git.clone(
        params.repoUrl,
        params.targetDir,
        params.shallow ? ['--depth', '1'] : [],
      );

      return true;
    } catch {
      // Either simple-git isn't installed or it failed — fall back to git binary.
      return false;
    }
  }

  private async cloneWithGitBinary(params: {
    repoUrl: string;
    targetDir: string;
    shallow: boolean;
    timeoutMs: number;
  }): Promise<void> {
    const args = ['clone'];
    if (params.shallow) {
      args.push('--depth', '1');
    }
    args.push('--', params.repoUrl, params.targetDir);

    await execFileAsync('git', args, {
      timeout: params.timeoutMs,
      windowsHide: true,
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: '0',
      },
    });
  }

  private validateUrl(repoUrl: string) {
    let parsedUrl: URL;
    const invalidRepoUrlErr = new Error(`Invalid repo url=${repoUrl}`);
    try {
      parsedUrl = new URL(repoUrl);
    } catch {
      throw invalidRepoUrlErr;
    }

    if (
      parsedUrl.protocol !== 'https:' ||
      parsedUrl.hostname !== 'github.com'
    ) {
      throw invalidRepoUrlErr;
    }

    const pathSegments = parsedUrl.pathname
      .replace(/^\/+|\/+$/g, '')
      .split('/');
    if (pathSegments.length < 2 || !pathSegments[0] || !pathSegments[1]) {
      throw invalidRepoUrlErr;
    }

    return parsedUrl.pathname;
  }
}
