import { Injectable } from '@nestjs/common';
import * as path from 'node:path';

@Injectable()
export class LocalPathHelper {
  static getDefaultBaseDir(): string {
    return path.resolve(process.cwd(), 'tmp');
  }

  static getTargetPath(baseDir: string, fileName: string) {
    return path.join(baseDir, fileName);
  }
}
