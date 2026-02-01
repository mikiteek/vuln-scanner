import { Injectable } from '@nestjs/common';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

@Injectable()
export class CleanupHelper {
  async cleanupDir(targetDir: string): Promise<void> {
    const exists = await this.isExists(targetDir);
    if (!exists) {
      return;
    }

    const resolvedTargetDir = this.validateProjectDir(targetDir);

    await fs.rm(resolvedTargetDir, { recursive: true, force: true });
  }

  async cleanupFile(filePath: string): Promise<void> {
    const exists = await this.isExists(filePath);
    if (!exists) {
      return;
    }

    this.validateProjectDir(filePath);
    const resolvedTargetPath = await this.validateFilePath(filePath);

    await fs.rm(resolvedTargetPath, { force: true });
  }

  private validateProjectDir(targetDir: string): string {
    const resolvedTargetDir = path.resolve(targetDir);
    const resolvedCwd = path.resolve(process.cwd());

    if (
      resolvedTargetDir === path.parse(resolvedTargetDir).root ||
      resolvedTargetDir === resolvedCwd ||
      !resolvedTargetDir.startsWith(`${resolvedCwd}${path.sep}`)
    ) {
      throw new Error(
        `Refusing to cleanup unsafe directory or outside the project: ${resolvedTargetDir}`,
      );
    }

    return resolvedTargetDir;
  }

  private async validateFilePath(filePath: string): Promise<string> {
    const resolvedTargetFile = path.resolve(filePath);
    const stat = await fs.lstat(resolvedTargetFile);
    if (stat.isDirectory()) {
      throw new Error(
        `Refusing to cleanup file path because it is a directory: ${resolvedTargetFile}`,
      );
    }

    return resolvedTargetFile;
  }

  private async isExists(targetDir: string): Promise<boolean> {
    try {
      await fs.access(targetDir);
      return true;
    } catch {
      return false;
    }
  }
}
