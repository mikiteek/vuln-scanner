import * as path from 'node:path';

export class LocalPathHelper {
  static getDefaultBaseDir(): string {
    return path.resolve(process.cwd(), 'tmp');
  }

  static getTargetPath(baseDir: string, fileName: string) {
    return path.join(baseDir, fileName);
  }
}
