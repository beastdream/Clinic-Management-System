export interface DatabaseHealthInfo {
  status: string;
  databaseProduct: string;
  databaseVersion: string;
  driverName?: string;
  url: string;
  defaultTransactionIsolation?: number;
}

export interface HealthCheckData {
  status: string;
  service: string;
  version: string;
  activeProfile: string;
  uptimeMs: number;
  uptimeReadable: string;
  timestampUtc: string;
  timestampVietnam: string;
  timezone: string;
  database: DatabaseHealthInfo;
}
