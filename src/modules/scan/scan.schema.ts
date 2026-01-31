import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import { ScanStatus } from './types/scan';
import type { TrivyVulnerability } from './types/trivy';

export type ScanDocument = HydratedDocument<ScanSchemaDef>;

export const SCAN_MODEL_NAME = 'Scan';

@Schema({
  collection: 'scans',
  timestamps: true,
  versionKey: false,
})
export class ScanSchemaDef {
  @Prop({ required: true, type: String })
  repoUrl: string;

  @Prop({ required: true, enum: Object.values(ScanStatus) })
  status: ScanStatus;

  @Prop({ type: [Object], default: [] })
  criticalVulnerabilities: TrivyVulnerability[];
}

export const ScanSchema = SchemaFactory.createForClass(ScanSchemaDef);
