import { Injectable } from '@nestjs/common';
import * as path from 'node:path';

@Injectable()
export class LocalPathHelper {
  static getDefaultTmpDir(): string {
    return path.resolve(__dirname, '../../../../scanner-tmp/');
  }
}
