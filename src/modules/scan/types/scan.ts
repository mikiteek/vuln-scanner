import { TrivyVulnerability } from './trivy';

export enum ScanStatus {
  Queued = 'Queued',
  Scanning = 'Scanning',
  Finished = 'Finished',
  Failed = 'Failed',
}

export type ScanResponse = {
  id: string;
  status: ScanStatus;
  repoUrl: string;
  criticalVulnerabilities: TrivyVulnerability[];
};
