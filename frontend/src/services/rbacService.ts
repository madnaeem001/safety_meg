/**
 * Role-Based Access Control (RBAC) Service
 * Manages user roles and permissions
 */

export type UserRole = 'admin' | 'manager' | 'worker' | 'auditor';

export type Permission = 
  | 'view_dashboard'
  | 'edit_settings'
  | 'manage_users'
  | 'view_reports'
  | 'create_reports'
  | 'approve_requests'
  | 'view_sensitive_data'
  | 'manage_equipment'
  | 'perform_audit';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'view_dashboard', 'edit_settings', 'manage_users', 'view_reports', 
    'create_reports', 'approve_requests', 'view_sensitive_data', 
    'manage_equipment', 'perform_audit'
  ],
  manager: [
    'view_dashboard', 'view_reports', 'create_reports', 'approve_requests', 
    'manage_equipment', 'perform_audit'
  ],
  worker: [
    'view_dashboard', 'create_reports', 'manage_equipment'
  ],
  auditor: [
    'view_dashboard', 'view_reports', 'view_sensitive_data', 'perform_audit'
  ]
};

class RBACService {
  private currentRole: UserRole = 'worker'; // Default role

  constructor() {
    // Load role from storage if available
    const storedRole = localStorage.getItem('safetymeg_user_role');
    if (storedRole && this.isValidRole(storedRole)) {
      this.currentRole = storedRole as UserRole;
    }
  }

  private isValidRole(role: string): boolean {
    return ['admin', 'manager', 'worker', 'auditor'].includes(role);
  }

  getCurrentRole(): UserRole {
    return this.currentRole;
  }

  setRole(role: UserRole): void {
    this.currentRole = role;
    localStorage.setItem('safetymeg_user_role', role);
    // Trigger a custom event for role change
    window.dispatchEvent(new Event('rbac_role_change'));
  }

  hasPermission(permission: Permission): boolean {
    const permissions = ROLE_PERMISSIONS[this.currentRole];
    return permissions.includes(permission);
  }

  getPermissions(): Permission[] {
    return ROLE_PERMISSIONS[this.currentRole];
  }
}

export const rbacService = new RBACService();
