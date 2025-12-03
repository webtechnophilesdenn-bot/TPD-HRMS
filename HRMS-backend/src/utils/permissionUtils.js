// utils/permissionUtils.js
export const hasPermission = (user, permission) => {
  if (!user || !user.permissions) return false;
  
  // Super admin has all permissions
  if (user.role === "super_admin") return true;
  
  // Check if user has the specific permission
  return user.permissions.includes(permission);
};

export const getRolePermissions = (role) => {
  const rolePermissions = {
    super_admin: [
      "assets.view_all",
      "assets.create",
      "assets.edit",
      "assets.delete",
      "assets.allocate",
      "assets.return",
      "assets.maintenance",
      "assets.audit",
      "assets.dispose",
      "assets.reports",
      "assets.import",
      "assets.export",
      "assets.view_department",
      "assets.approve_allocation",
      "assets.view_audit_trail",
    ],
    admin: [
      "assets.view_all",
      "assets.create",
      "assets.edit",
      "assets.allocate",
      "assets.return",
      "assets.maintenance",
      "assets.audit",
      "assets.dispose",
      "assets.reports",
      "assets.export",
      "assets.view_department",
      "assets.approve_allocation",
    ],
    hr_manager: [
      "assets.view_all",
      "assets.create",
      "assets.edit",
      "assets.allocate",
      "assets.return",
      "assets.maintenance",
      "assets.audit",
      "assets.reports",
      "assets.export",
      "assets.view_department",
      "assets.approve_allocation",
    ],
    department_head: [
      "assets.view_department",
      "assets.approve_allocation",
      "assets.view_audit_trail",
    ],
    supervisor: [
      "assets.view_department",
      "assets.allocate",
      "assets.return",
    ],
    employee: [
      "assets.view_my",
      "assets.request_allocation",
      "assets.scan",
    ],
  };
  
  return rolePermissions[role] || [];
};