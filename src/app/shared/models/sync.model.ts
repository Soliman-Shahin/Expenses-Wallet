export interface SyncEntity {
  _id: string;
  _syncStatus: SyncStatus;
  _lastModified: Date;
  _version: number;
  _isDeleted?: boolean;
  _conflictData?: any;
}

export enum SyncStatus {
  SYNCED = 'synced',
  PENDING = 'pending',
  CONFLICT = 'conflict',
  ERROR = 'error',
  OFFLINE = 'offline'
}

export interface SyncMetadata {
  lastSyncTime: Date;
  totalEntities: number;
  pendingCount: number;
  conflictCount: number;
  errorCount: number;
  isOnline: boolean;
  isSyncing: boolean;
}

export interface SyncOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: 'expense' | 'category' | 'user';
  entityId: string;
  data: any;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
  status: SyncStatus;
  error?: string;
}

export interface ConflictResolution {
  entityId: string;
  entityType: string;
  localData: any;
  serverData: any;
  resolution: 'local' | 'server' | 'merge';
  mergedData?: any;
  timestamp: Date;
}

export interface SyncConfig {
  autoSync: boolean;
  syncInterval: number; // in milliseconds
  maxRetries: number;
  conflictResolution: 'local' | 'server' | 'prompt';
  batchSize: number;
  enableOfflineMode: boolean;
}

export interface SyncQueue {
  operations: SyncOperation[];
  isProcessing: boolean;
  lastProcessed: Date;
  totalProcessed: number;
  totalErrors: number;
}

export interface OfflineData {
  expenses: any[];
  categories: any[];
  user: any;
  lastBackup: Date;
  version: string;
}

export interface SyncProgress {
  current: number;
  total: number;
  percentage: number;
  currentOperation: string;
  isComplete: boolean;
  errors: string[];
}
