// User & Auth Types
export type UserRole = 'operator' | 'engineer' | 'manager' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// Asset Types
export type AssetStatus = 'active' | 'inactive' | 'maintenance' | 'disposed';
export type AssetType = 'machine' | 'equipment' | 'tool' | 'vehicle' | 'auxiliary';

export interface Asset {
  id: string;
  assetCode: string;
  assetName: string;
  assetType: AssetType;
  status: AssetStatus;
  location: string;
  manufacturer: string;
  serialNumber: string;
  installDate: string;
  lastMaintenance?: string;
  qrCode?: string;
}

// Preventive Maintenance Types
export type PMStatus = 'scheduled' | 'in_progress' | 'completed' | 'overdue';
export type PMFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface PreventiveMaintenance {
  id: string;
  assetId: string;
  assetName: string;
  title: string;
  description: string;
  frequency: PMFrequency;
  scheduledDate: string;
  completedDate?: string;
  assignedTo: string;
  status: PMStatus;
  checklist: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  task: string;
  completed: boolean;
}

// Breakdown Types
export type BreakdownStatus = 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed';
export type BreakdownPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Breakdown {
  id: string;
  assetId: string;
  assetName: string;
  entryDate: string;
  entryTime: string;
  businessUnit: string;
  operatorId: string;
  operatorName: string;
  issue: string;
  status: BreakdownStatus;
  priority: BreakdownPriority;
  engineerNotes?: string;
  resolvedDate?: string;
  rootCause?: string;
  actionTaken?: string;
  downtime?: number; // in minutes
}

// Spare Parts Types
export interface SparePart {
  id: string;
  partCode: string;
  partName: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  location: string;
  unitPrice: number;
  lastRestocked?: string;
}

export interface SpareTransaction {
  id: string;
  partId: string;
  partName: string;
  transactionType: 'in' | 'out';
  quantity: number;
  date: string;
  reference: string;
  performedBy: string;
}

// Utility Types
export type UtilityType = 'power' | 'gas' | 'water' | 'compressed_air';

export interface UtilityLog {
  id: string;
  utilityType: UtilityType;
  readingValue: number;
  unit: string;
  samplePoint: string;
  assetId?: string;
  recordedAt: string;
  recordedBy: string;
}

// KPI Types
export interface KPIMetrics {
  mttr: number; // Mean Time To Repair (hours)
  mtbf: number; // Mean Time Between Failures (hours)
  uptime: number; // Percentage
  oee: number; // Overall Equipment Effectiveness
  plannedDowntime: number;
  unplannedDowntime: number;
}

export interface DashboardStats {
  totalAssets: number;
  activeAssets: number;
  pendingPM: number;
  overduePM: number;
  openBreakdowns: number;
  criticalBreakdowns: number;
  lowStockItems: number;
  totalSpares: number;
  activeMeters: number;
  kpiAlerts: number;
}

// Role & Permission Types
export interface Permission {
  id: string;
  key: string;
  name: string;
  description: string;
}

export interface RolePermission {
  role: UserRole;
  permissions: string[];
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
