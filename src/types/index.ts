// User and Authentication Types
export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  mfaEnabled: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'inspector' | 'officer' | 'manager' | 'admin';

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

// Economic Operator Types
export interface EconomicOperator {
  id: string;
  name: string;
  vatNumber?: string;
  email?: string;
  address?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Inspection Types
export interface Inspection {
  id: string;
  status: InspectionStatus;
  createdBy: string;
  assignedTo: string;
  economicOperatorId?: string;
  vatNumber?: string;
  vatStatus: 'provided' | 'not_available' | 'not_provided';
  locationLat?: number;
  locationLng?: number;
  addressSuggested?: string;
  addressFinal?: string;
  addressAccuracyM?: number;
  startedAt?: Date;
  completedAt?: Date;
  investigationId?: string;
  aiSummaryJson?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export type InspectionStatus = 
  | 'draft'
  | 'in_progress'
  | 'submitted'
  | 'approved_officer'
  | 'approved_manager'
  | 'completed'
  | 'returned';

// Media Types
export interface InspectionMedia {
  id: string;
  inspectionId: string;
  type: MediaType;
  category: MediaCategory;
  storageUri: string;
  hash: string;
  exifJson?: Record<string, any>;
  redactionMaskJson?: Record<string, any>;
  piiFlag: boolean;
  encKeyId?: string;
  createdAt: Date;
}

export type MediaType = 'image' | 'document' | 'video';
export type MediaCategory = 
  | 'id_front'
  | 'id_back'
  | 'facade'
  | 'product'
  | 'ce_mark'
  | 'nb_number'
  | 'warning'
  | 'name_address'
  | 'plug'
  | 'other';

// Checklist Types
export interface Checklist {
  id: string;
  name: string;
  description?: string;
  jsonSchema: ChecklistSchema;
  version: string;
  status: ChecklistStatus;
  createdBy: string;
  approvedBy?: string;
  publishedBy?: string;
  supersededBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ChecklistStatus = 'draft' | 'pending_approval' | 'approved' | 'published' | 'retired';

export interface ChecklistSchema {
  questions: ChecklistQuestion[];
  metadata: {
    version: string;
    title: string;
    description?: string;
    legalBasis?: string;
  };
}

export interface ChecklistQuestion {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  validation?: QuestionValidation;
  conditional?: ConditionalLogic;
  legalRefs?: LegalReference[];
  options?: QuestionOption[];
}

export type QuestionType = 
  | 'text'
  | 'number'
  | 'boolean'
  | 'single_choice'
  | 'multi_choice'
  | 'photo'
  | 'barcode'
  | 'ocr';

export interface QuestionValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  regex?: string;
  minPhotos?: number;
  maxPhotos?: number;
}

export interface ConditionalLogic {
  conditions: ConditionalCondition[];
  operator: 'AND' | 'OR';
}

export interface ConditionalCondition {
  questionId: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

export interface QuestionOption {
  id: string;
  label: string;
  value: string;
}

export interface LegalReference {
  act: string;
  article?: string;
  annex?: string;
  description?: string;
}

// Inspection Run Types
export interface InspectionRun {
  id: string;
  inspectionId: string;
  checklistId: string;
  checklistVersion: string;
  answersJson: Record<string, any>;
  scoreJson: Record<string, any>;
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
}

// Findings Types
export interface Finding {
  id: string;
  inspectionId: string;
  title: string;
  description: string;
  severity: FindingSeverity;
  draftedBy: string;
  approvedByOfficerId?: string;
  approvedByManagerId?: string;
  legalRefsJson: LegalReference[];
  status: FindingStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type FindingSeverity = 'low' | 'medium' | 'high' | 'critical';
export type FindingStatus = 'draft' | 'approved_officer' | 'approved_manager' | 'rejected';

// Notice Types
export interface Notice {
  id: string;
  inspectionId: string;
  type: NoticeType;
  title: string;
  content: string;
  draftedByOfficerId: string;
  signedByManagerId?: string;
  status: NoticeStatus;
  pdfUri?: string;
  signatureHash?: string;
  issuedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type NoticeType = 'improvement' | 'warning' | 'stop_sale' | 'recall';
export type NoticeStatus = 'draft' | 'pending_signature' | 'signed' | 'issued' | 'retracted';

// AI Results Types
export interface AIResult {
  id: string;
  inspectionId: string;
  agent: AIAgent;
  inputRefsJson: Record<string, any>;
  outputJson: Record<string, any>;
  confidenceOverall: number;
  createdAt: Date;
}

export type AIAgent = 
  | 'label_compliance'
  | 'chemicals_ingredients'
  | 'safety_gate_recall';

// Integration Types
export interface Integration {
  id: string;
  name: string;
  enabled: boolean;
  configJson: Record<string, any>;
  statusMsg?: string;
  lastCheckedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Report Template Types
export interface ReportTemplate {
  id: string;
  name: string;
  format: 'html';
  mappingJson: Record<string, any>;
  version: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Mail Log Types
export interface MailLog {
  id: string;
  toEmail: string;
  subject: string;
  status: MailStatus;
  providerMsgId?: string;
  errorMsg?: string;
  sentAt: Date;
}

export type MailStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';

// Feedback Types
export interface FeedbackToken {
  id: string;
  type: FeedbackType;
  tokenHash: string;
  issuedAt: Date;
  expiresAt: Date;
  usedAt?: Date;
  inspectionId: string;
}

export type FeedbackType = 'inspection' | 'outcome';

export interface Feedback {
  id: string;
  tokenId: string;
  type: FeedbackType;
  rating?: number;
  agreeDisagree?: boolean;
  commentsText?: string;
  attachmentsJson?: string[];
  consentToContact: boolean;
  submittedIp?: string;
  submittedAt: Date;
}

export interface FeedbackSentiment {
  id: string;
  feedbackId: string;
  label: SentimentLabel;
  score: number;
  keyPhrasesJson: string[];
  modelVersion: string;
  createdAt: Date;
}

export type SentimentLabel = 'positive' | 'neutral' | 'negative';

// Holiday Types
export interface HolidayMt {
  id: string;
  holidayDate: Date;
  description: string;
  isRecurring: boolean;
  createdAt: Date;
}

// RBAC Types
export interface Permission {
  action: string;
  resource: string;
  context?: Record<string, any>;
}

export interface RolePermissions {
  [role: string]: Permission[];
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form Types
export interface InspectionInitiationForm {
  location: {
    lat: number;
    lng: number;
    address: string;
    accuracy?: number;
  };
  vatNumber?: string;
  noVatProvided: boolean;
  operatorDetails?: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  photos: {
    idFront?: File;
    idBack?: File;
    facade: File;
  };
}

// Dashboard Types
export interface DashboardStats {
  totalInspections: number;
  pendingInspections: number;
  completedInspections: number;
  overdueInspections: number;
  teamStats?: {
    inspector: number;
    officer: number;
    manager: number;
    admin: number;
  };
}

// Audit Types
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}
