import { UserRole, Permission } from '@/types';

// Define all possible actions
export const ACTIONS = {
  // Inspection actions
  CREATE_INSPECTION: 'create:inspection',
  READ_INSPECTION: 'read:inspection',
  UPDATE_INSPECTION: 'update:inspection',
  DELETE_INSPECTION: 'delete:inspection',
  ASSIGN_INSPECTION: 'assign:inspection',
  SUBMIT_INSPECTION: 'submit:inspection',
  APPROVE_INSPECTION_OFFICER: 'approve:inspection:officer',
  APPROVE_INSPECTION_MANAGER: 'approve:inspection:manager',
  RETURN_INSPECTION: 'return:inspection',
  
  // Checklist actions
  CREATE_CHECKLIST: 'create:checklist',
  READ_CHECKLIST: 'read:checklist',
  UPDATE_CHECKLIST: 'update:checklist',
  DELETE_CHECKLIST: 'delete:checklist',
  APPROVE_CHECKLIST: 'approve:checklist',
  PUBLISH_CHECKLIST: 'publish:checklist',
  RETIRE_CHECKLIST: 'retire:checklist',
  
  // Notice actions
  CREATE_NOTICE: 'create:notice',
  READ_NOTICE: 'read:notice',
  UPDATE_NOTICE: 'update:notice',
  DELETE_NOTICE: 'delete:notice',
  SIGN_NOTICE: 'sign:notice',
  ISSUE_NOTICE: 'issue:notice',
  RETRACT_NOTICE: 'retract:notice',
  
  // Finding actions
  CREATE_FINDING: 'create:finding',
  READ_FINDING: 'read:finding',
  UPDATE_FINDING: 'update:finding',
  DELETE_FINDING: 'delete:finding',
  APPROVE_FINDING_OFFICER: 'approve:finding:officer',
  APPROVE_FINDING_MANAGER: 'approve:finding:manager',
  
  // Operator actions
  CREATE_OPERATOR: 'create:operator',
  READ_OPERATOR: 'read:operator',
  UPDATE_OPERATOR: 'update:operator',
  DELETE_OPERATOR: 'delete:operator',
  
  // User management actions
  CREATE_USER: 'create:user',
  READ_USER: 'read:user',
  UPDATE_USER: 'update:user',
  DELETE_USER: 'delete:user',
  ASSIGN_ROLE: 'assign:role',
  
  // System actions
  READ_AUDIT_LOG: 'read:audit_log',
  MANAGE_INTEGRATIONS: 'manage:integrations',
  MANAGE_TEMPLATES: 'manage:templates',
  MANAGE_HOLIDAYS: 'manage:holidays',
  MANAGE_RETENTION: 'manage:retention',
  PURGE_DATA: 'purge:data',
  
  // Feedback actions
  READ_FEEDBACK: 'read:feedback',
  ANALYZE_FEEDBACK: 'analyze:feedback',
  
  // AI actions
  RUN_AI_AGENTS: 'run:ai_agents',
  READ_AI_RESULTS: 'read:ai_results',
  
  // Media actions
  UPLOAD_MEDIA: 'upload:media',
  READ_MEDIA: 'read:media',
  DELETE_MEDIA: 'delete:media',
  ACCESS_PII: 'access:pii',
} as const;

// Define all possible resources
export const RESOURCES = {
  INSPECTION: 'inspection',
  CHECKLIST: 'checklist',
  NOTICE: 'notice',
  FINDING: 'finding',
  OPERATOR: 'operator',
  USER: 'user',
  AUDIT_LOG: 'audit_log',
  INTEGRATION: 'integration',
  TEMPLATE: 'template',
  HOLIDAY: 'holiday',
  FEEDBACK: 'feedback',
  AI_RESULT: 'ai_result',
  MEDIA: 'media',
  SYSTEM: 'system',
} as const;

// Define permissions for each role
const getInspectorPermissions = (): Permission[] => [
  // Own inspections
  { action: ACTIONS.CREATE_INSPECTION, resource: RESOURCES.INSPECTION },
  { action: ACTIONS.READ_INSPECTION, resource: RESOURCES.INSPECTION, context: { scope: 'own' } },
  { action: ACTIONS.UPDATE_INSPECTION, resource: RESOURCES.INSPECTION, context: { scope: 'own' } },
  { action: ACTIONS.SUBMIT_INSPECTION, resource: RESOURCES.INSPECTION, context: { scope: 'own' } },
  
  // Checklists (read-only)
  { action: ACTIONS.READ_CHECKLIST, resource: RESOURCES.CHECKLIST, context: { status: 'published' } },
  
  // Findings (own inspections)
  { action: ACTIONS.CREATE_FINDING, resource: RESOURCES.FINDING, context: { scope: 'own' } },
  { action: ACTIONS.READ_FINDING, resource: RESOURCES.FINDING, context: { scope: 'own' } },
  { action: ACTIONS.UPDATE_FINDING, resource: RESOURCES.FINDING, context: { scope: 'own' } },
  
  // Media (own inspections)
  { action: ACTIONS.UPLOAD_MEDIA, resource: RESOURCES.MEDIA, context: { scope: 'own' } },
  { action: ACTIONS.READ_MEDIA, resource: RESOURCES.MEDIA, context: { scope: 'own' } },
  
  // AI (advisory only)
  { action: ACTIONS.RUN_AI_AGENTS, resource: RESOURCES.AI_RESULT, context: { scope: 'own' } },
  { action: ACTIONS.READ_AI_RESULTS, resource: RESOURCES.AI_RESULT, context: { scope: 'own' } },
];

const getOfficerPermissions = (): Permission[] => [
  // Inherit all inspector permissions
  ...getInspectorPermissions(),
  
  // Team inspections
  { action: ACTIONS.READ_INSPECTION, resource: RESOURCES.INSPECTION, context: { scope: 'team' } },
  { action: ACTIONS.UPDATE_INSPECTION, resource: RESOURCES.INSPECTION, context: { scope: 'team' } },
  { action: ACTIONS.ASSIGN_INSPECTION, resource: RESOURCES.INSPECTION },
  { action: ACTIONS.APPROVE_INSPECTION_OFFICER, resource: RESOURCES.INSPECTION },
  { action: ACTIONS.RETURN_INSPECTION, resource: RESOURCES.INSPECTION },
  
  // Checklists (create and manage)
  { action: ACTIONS.CREATE_CHECKLIST, resource: RESOURCES.CHECKLIST },
  { action: ACTIONS.READ_CHECKLIST, resource: RESOURCES.CHECKLIST },
  { action: ACTIONS.UPDATE_CHECKLIST, resource: RESOURCES.CHECKLIST, context: { scope: 'own' } },
  { action: ACTIONS.DELETE_CHECKLIST, resource: RESOURCES.CHECKLIST, context: { scope: 'own' } },
  
  // Findings (team scope)
  { action: ACTIONS.READ_FINDING, resource: RESOURCES.FINDING, context: { scope: 'team' } },
  { action: ACTIONS.UPDATE_FINDING, resource: RESOURCES.FINDING, context: { scope: 'team' } },
  { action: ACTIONS.APPROVE_FINDING_OFFICER, resource: RESOURCES.FINDING },
  
  // Notices
  { action: ACTIONS.CREATE_NOTICE, resource: RESOURCES.NOTICE },
  { action: ACTIONS.READ_NOTICE, resource: RESOURCES.NOTICE },
  { action: ACTIONS.UPDATE_NOTICE, resource: RESOURCES.NOTICE },
  { action: ACTIONS.ISSUE_NOTICE, resource: RESOURCES.NOTICE },
  
  // Operators
  { action: ACTIONS.CREATE_OPERATOR, resource: RESOURCES.OPERATOR },
  { action: ACTIONS.READ_OPERATOR, resource: RESOURCES.OPERATOR },
  { action: ACTIONS.UPDATE_OPERATOR, resource: RESOURCES.OPERATOR },
  
  // Media (team scope)
  { action: ACTIONS.READ_MEDIA, resource: RESOURCES.MEDIA, context: { scope: 'team' } },
  { action: ACTIONS.ACCESS_PII, resource: RESOURCES.MEDIA, context: { scope: 'team' } },
  
  // AI (team scope)
  { action: ACTIONS.RUN_AI_AGENTS, resource: RESOURCES.AI_RESULT, context: { scope: 'team' } },
  { action: ACTIONS.READ_AI_RESULTS, resource: RESOURCES.AI_RESULT, context: { scope: 'team' } },
  
  // Feedback
  { action: ACTIONS.READ_FEEDBACK, resource: RESOURCES.FEEDBACK },
];

const getManagerPermissions = (): Permission[] => [
  // Inherit all officer permissions
  ...getOfficerPermissions(),
  
  // Organization inspections
  { action: ACTIONS.READ_INSPECTION, resource: RESOURCES.INSPECTION, context: { scope: 'org' } },
  { action: ACTIONS.UPDATE_INSPECTION, resource: RESOURCES.INSPECTION, context: { scope: 'org' } },
  { action: ACTIONS.APPROVE_INSPECTION_MANAGER, resource: RESOURCES.INSPECTION },
  
  // Checklist approval
  { action: ACTIONS.APPROVE_CHECKLIST, resource: RESOURCES.CHECKLIST },
  { action: ACTIONS.RETIRE_CHECKLIST, resource: RESOURCES.CHECKLIST },
  
  // Findings approval
  { action: ACTIONS.APPROVE_FINDING_MANAGER, resource: RESOURCES.FINDING },
  
  // Notice signing
  { action: ACTIONS.SIGN_NOTICE, resource: RESOURCES.NOTICE },
  
  // Users (read-only)
  { action: ACTIONS.READ_USER, resource: RESOURCES.USER },
  
  // Audit logs (read-only)
  { action: ACTIONS.READ_AUDIT_LOG, resource: RESOURCES.AUDIT_LOG },
  
  // Retention (approval required)
  { action: ACTIONS.MANAGE_RETENTION, resource: RESOURCES.SYSTEM },
  { action: ACTIONS.PURGE_DATA, resource: RESOURCES.SYSTEM, context: { requiresApproval: true } },
];

const getAdminPermissions = (): Permission[] => [
  // Full system access - define all permissions explicitly
  { action: ACTIONS.CREATE_INSPECTION, resource: RESOURCES.INSPECTION },
  { action: ACTIONS.READ_INSPECTION, resource: RESOURCES.INSPECTION },
  { action: ACTIONS.UPDATE_INSPECTION, resource: RESOURCES.INSPECTION },
  { action: ACTIONS.DELETE_INSPECTION, resource: RESOURCES.INSPECTION },
  { action: ACTIONS.ASSIGN_INSPECTION, resource: RESOURCES.INSPECTION },
  { action: ACTIONS.SUBMIT_INSPECTION, resource: RESOURCES.INSPECTION },
  { action: ACTIONS.APPROVE_INSPECTION_OFFICER, resource: RESOURCES.INSPECTION },
  { action: ACTIONS.APPROVE_INSPECTION_MANAGER, resource: RESOURCES.INSPECTION },
  { action: ACTIONS.RETURN_INSPECTION, resource: RESOURCES.INSPECTION },
  
  { action: ACTIONS.CREATE_CHECKLIST, resource: RESOURCES.CHECKLIST },
  { action: ACTIONS.READ_CHECKLIST, resource: RESOURCES.CHECKLIST },
  { action: ACTIONS.UPDATE_CHECKLIST, resource: RESOURCES.CHECKLIST },
  { action: ACTIONS.DELETE_CHECKLIST, resource: RESOURCES.CHECKLIST },
  { action: ACTIONS.APPROVE_CHECKLIST, resource: RESOURCES.CHECKLIST },
  { action: ACTIONS.PUBLISH_CHECKLIST, resource: RESOURCES.CHECKLIST },
  { action: ACTIONS.RETIRE_CHECKLIST, resource: RESOURCES.CHECKLIST },
  
  { action: ACTIONS.CREATE_NOTICE, resource: RESOURCES.NOTICE },
  { action: ACTIONS.READ_NOTICE, resource: RESOURCES.NOTICE },
  { action: ACTIONS.UPDATE_NOTICE, resource: RESOURCES.NOTICE },
  { action: ACTIONS.DELETE_NOTICE, resource: RESOURCES.NOTICE },
  { action: ACTIONS.SIGN_NOTICE, resource: RESOURCES.NOTICE },
  { action: ACTIONS.ISSUE_NOTICE, resource: RESOURCES.NOTICE },
  { action: ACTIONS.RETRACT_NOTICE, resource: RESOURCES.NOTICE },
  
  { action: ACTIONS.CREATE_FINDING, resource: RESOURCES.FINDING },
  { action: ACTIONS.READ_FINDING, resource: RESOURCES.FINDING },
  { action: ACTIONS.UPDATE_FINDING, resource: RESOURCES.FINDING },
  { action: ACTIONS.DELETE_FINDING, resource: RESOURCES.FINDING },
  { action: ACTIONS.APPROVE_FINDING_OFFICER, resource: RESOURCES.FINDING },
  { action: ACTIONS.APPROVE_FINDING_MANAGER, resource: RESOURCES.FINDING },
  
  { action: ACTIONS.CREATE_OPERATOR, resource: RESOURCES.OPERATOR },
  { action: ACTIONS.READ_OPERATOR, resource: RESOURCES.OPERATOR },
  { action: ACTIONS.UPDATE_OPERATOR, resource: RESOURCES.OPERATOR },
  { action: ACTIONS.DELETE_OPERATOR, resource: RESOURCES.OPERATOR },
  
  { action: ACTIONS.CREATE_USER, resource: RESOURCES.USER },
  { action: ACTIONS.READ_USER, resource: RESOURCES.USER },
  { action: ACTIONS.UPDATE_USER, resource: RESOURCES.USER },
  { action: ACTIONS.DELETE_USER, resource: RESOURCES.USER },
  { action: ACTIONS.ASSIGN_ROLE, resource: RESOURCES.USER },
  
  { action: ACTIONS.READ_AUDIT_LOG, resource: RESOURCES.AUDIT_LOG },
  { action: ACTIONS.MANAGE_INTEGRATIONS, resource: RESOURCES.INTEGRATION },
  { action: ACTIONS.MANAGE_TEMPLATES, resource: RESOURCES.TEMPLATE },
  { action: ACTIONS.MANAGE_HOLIDAYS, resource: RESOURCES.HOLIDAY },
  { action: ACTIONS.MANAGE_RETENTION, resource: RESOURCES.SYSTEM },
  { action: ACTIONS.PURGE_DATA, resource: RESOURCES.SYSTEM },
  
  { action: ACTIONS.READ_FEEDBACK, resource: RESOURCES.FEEDBACK },
  { action: ACTIONS.ANALYZE_FEEDBACK, resource: RESOURCES.FEEDBACK },
  
  { action: ACTIONS.RUN_AI_AGENTS, resource: RESOURCES.AI_RESULT },
  { action: ACTIONS.READ_AI_RESULTS, resource: RESOURCES.AI_RESULT },
  
  { action: ACTIONS.UPLOAD_MEDIA, resource: RESOURCES.MEDIA },
  { action: ACTIONS.READ_MEDIA, resource: RESOURCES.MEDIA },
  { action: ACTIONS.DELETE_MEDIA, resource: RESOURCES.MEDIA },
  { action: ACTIONS.ACCESS_PII, resource: RESOURCES.MEDIA },
];

// Role-based permissions matrix
const getRolePermissions = (role: UserRole): Permission[] => {
  switch (role) {
    case 'inspector':
      return getInspectorPermissions();
    case 'officer':
      return getOfficerPermissions();
    case 'manager':
      return getManagerPermissions();
    case 'admin':
      return getAdminPermissions();
    default:
      return [];
  }
};

// RBAC utility class
export class RBAC {
  private userRole: UserRole;
  private userId: string;

  constructor(userRole: UserRole, userId: string) {
    this.userRole = userRole;
    this.userId = userId;
  }

  /**
   * Check if user can perform action on resource
   */
  can(action: string, resource: string, context?: Record<string, unknown>): boolean {
    const permissions = getRolePermissions(this.userRole);
    
    return permissions.some(permission => {
      // Check action and resource match
      if (permission.action !== action || permission.resource !== resource) {
        return false;
      }
      
      // Check context if provided
      if (permission.context && context) {
        return this.matchesContext(permission.context, context);
      }
      
      return !permission.context; // Permission without context matches any context
    });
  }

  /**
   * Check if user can perform action on resource (fluent interface)
   */
  do(action: string, resource: string, context?: Record<string, unknown>): boolean {
    return this.can(action, resource, context);
  }

  /**
   * Get all permissions for user role
   */
  getPermissions(): Permission[] {
    return getRolePermissions(this.userRole);
  }

  /**
   * Get user role hierarchy level
   */
  getRoleLevel(): number {
    const levels = {
      inspector: 1,
      officer: 2,
      manager: 3,
      admin: 4,
    };
    return levels[this.userRole] || 0;
  }

  /**
   * Check if user role has higher or equal level than required role
   */
  hasRoleLevel(requiredRole: UserRole): boolean {
    return this.getRoleLevel() >= this.getRoleLevelForRole(requiredRole);
  }

  private getRoleLevelForRole(role: UserRole): number {
    const levels = {
      inspector: 1,
      officer: 2,
      manager: 3,
      admin: 4,
    };
    return levels[role] || 0;
  }

  private matchesContext(permissionContext: Record<string, unknown>, userContext: Record<string, unknown>): boolean {
    for (const [key, value] of Object.entries(permissionContext)) {
      if (userContext[key] !== value) {
        return false;
      }
    }
    return true;
  }
}

// Helper function to create RBAC instance
export function createRBAC(userRole: UserRole, userId: string): RBAC {
  return new RBAC(userRole, userId);
}

// Helper function for server-side permission checks
export function checkPermission(
  userRole: UserRole,
  userId: string,
  action: string,
  resource: string,
  context?: Record<string, unknown>
): boolean {
  const rbac = createRBAC(userRole, userId);
  return rbac.can(action, resource, context);
}

// Helper function to get user's scope based on role
export function getUserScope(userRole: UserRole, userId: string): string {
  switch (userRole) {
    case 'inspector':
      return 'own';
    case 'officer':
      return 'team';
    case 'manager':
      return 'org';
    case 'admin':
      return 'system';
    default:
      return 'none';
  }
}

// Helper function to check if user can access PII
export function canAccessPII(userRole: UserRole): boolean {
  return ['officer', 'manager', 'admin'].includes(userRole);
}

// Helper function to check if user can approve findings
export function canApproveFindings(userRole: UserRole, level: 'officer' | 'manager' = 'officer'): boolean {
  if (level === 'officer') {
    return ['officer', 'manager', 'admin'].includes(userRole);
  }
  return ['manager', 'admin'].includes(userRole);
}

// Helper function to check if user can sign notices
export function canSignNotices(userRole: UserRole): boolean {
  return ['manager', 'admin'].includes(userRole);
}