import { Injectable } from '@nestjs/common';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

@Injectable()
export class CleanupHelper {
  async cleanupDir(targetDir: string): Promise<void> {
    const resolvedTargetDir = path.resolve(targetDir);
    this.validateDir(resolvedTargetDir);

    await fs.mkdir(resolvedTargetDir, { recursive: true });

    const entries = await fs.readdir(resolvedTargetDir, {
      withFileTypes: true,
    });

    await Promise.all(
      entries.map(async (entry) => {
        const entryPath = path.join(resolvedTargetDir, entry.name);
        await fs.rm(entryPath, { recursive: true, force: true });
      }),
    );
  }

  private validateDir(resolvedTargetDir: string): void {
    const resolvedCwd = path.resolve(process.cwd());

    if (
      resolvedTargetDir === path.parse(resolvedTargetDir).root ||
      resolvedTargetDir === resolvedCwd
    ) {
      throw new Error(
        `Refusing to cleanup unsafe directory: ${resolvedTargetDir}`,
      );
    }

    // Only allow cleaning directories within the project directory.
    if (
      resolvedTargetDir !== resolvedCwd &&
      !resolvedTargetDir.startsWith(`${resolvedCwd}${path.sep}`)
    ) {
      throw new Error(
        `Refusing to cleanup directory outside project: ${resolvedTargetDir}`,
      );
    }
  }
}
