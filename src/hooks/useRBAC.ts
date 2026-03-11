import { useState, useEffect } from 'react';
import { rbacService, UserRole, Permission } from '../services/rbacService';

export const useRBAC = () => {
  const [role, setRole] = useState<UserRole>(rbacService.getCurrentRole());

  useEffect(() => {
    const handleRoleChange = () => {
      setRole(rbacService.getCurrentRole());
    };

    window.addEventListener('rbac_role_change', handleRoleChange);
    return () => window.removeEventListener('rbac_role_change', handleRoleChange);
  }, []);

  const hasPermission = (permission: Permission) => {
    return rbacService.hasPermission(permission);
  };

  const setRoleAction = (newRole: UserRole) => {
    rbacService.setRole(newRole);
  };

  return { role, hasPermission, setRole: setRoleAction };
};
