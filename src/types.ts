export interface User {
  uid: string;
  email: string;
  role: 'worker' | 'company' | 'admin';
  name: string;
  availabilities?: string[];
  location?: string;
  hourlyRate?: number;
  cvData?: string;
  cvName?: string;
  cvType?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Banner {
  id: string;
  title: string;
  imageUrl?: string;
  linkUrl?: string;
  isActive: boolean;
  createdAt: number;
}

export interface Job {
  id: string;
  companyId: string;
  title: string;
  description: string;
  location: string;
  status: 'open' | 'closed';
  requiredAvailabilities?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Application {
  id: string;
  jobId: string;
  workerId: string;
  companyId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
  updatedAt: number;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  createdAt: number;
}

export interface Review {
  id: string;
  applicationId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: number;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}
