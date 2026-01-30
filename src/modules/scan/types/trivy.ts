export type TrivyReport = {
  SchemaVersion: number;
  CreatedAt: string; // ISO timestamp
  ArtifactName: string;
  ArtifactType: string;
  Metadata?: TrivyMetadata;
  Results: TrivyResult[];
};

export type TrivyMetadata = {
  OS?: {
    Family?: string;
    Name?: string;
  };
  ImageID?: string;
  DiffIDs?: string[];
  RepoTags?: string[];
  RepoDigests?: string[];
  ImageConfig?: TrivyImageConfig;
};

export type TrivyImageConfig = {
  architecture?: string;
  created?: string;
  os?: string;
  history?: TrivyImageHistoryEntry[];
  rootfs?: {
    type?: string;
    diff_ids?: string[];
  };
  config?: {
    Cmd?: string[];
    Env?: string[];
    WorkingDir?: string;
    ArgsEscaped?: boolean;
  };
};

export type TrivyImageHistoryEntry = {
  created?: string;
  created_by?: string;
  comment?: string;
  empty_layer?: boolean;
};

export type TrivyResult = {
  Target: string;
  Class?: string; // os-pkgs, lang-pkgs, config, secret, license, etc.
  Type?: string; // alpine, npm, pip, terraform, etc.
  Vulnerabilities?: TrivyVulnerability[];
  Misconfigurations?: TrivyMisconfiguration[];
  Secrets?: TrivySecretFinding[];
  Licenses?: TrivyLicenseFinding[];
};

export type TrivyVulnerability = {
  VulnerabilityID: string;
  PkgID?: string;
  PkgName?: string;
  PkgIdentifier?: {
    PURL?: string;
    UID?: string;
  };
  InstalledVersion?: string;
  FixedVersion?: string;
  Status?: string; // fixed | affected | unknown | will_not_fix | etc.
  Layer?: {
    DiffID?: string;
  };
  PrimaryURL?: string;
  DataSource?: {
    ID?: string;
    Name?: string;
    URL?: string;
  };
  Title?: string;
  Description?: string;
  Severity?: TrivySeverity;
  CweIDs?: string[];
  VendorSeverity?: Record<string, number>;
  CVSS?: Record<string, TrivyCvssScore>;
  References?: string[];
  PublishedDate?: string;
  LastModifiedDate?: string;
};

export type TrivySeverity = 'UNKNOWN' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TrivyCvssScore = {
  V3Vector?: string;
  V3Score?: number;
};

export type TrivyMisconfiguration = {
  ID: string;
  Type?: string;
  Title?: string;
  Description?: string;
  Message?: string;
  Resolution?: string;
  Severity?: TrivySeverity;
  PrimaryURL?: string;
  References?: string[];
  Status?: string;
  Layer?: {
    DiffID?: string;
  };
  CauseMetadata?: {
    Resource?: string;
    Provider?: string;
    Service?: string;
    StartLine?: number;
    EndLine?: number;
  };
};

export type TrivySecretFinding = {
  RuleID?: string;
  Category?: string;
  Severity?: TrivySeverity;
  Title?: string;
  Match?: string;
  StartLine?: number;
  EndLine?: number;
  Code?: {
    Lines?: string[];
  };
};

export type TrivyLicenseFinding = {
  PkgName?: string;
  FilePath?: string;
  Name?: string;
  Severity?: TrivySeverity;
  Category?: string;
};
