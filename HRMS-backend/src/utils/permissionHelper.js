// utils/permissionHelper.js
const checkPermission = (user, requiredPermission) => {
  if (!user || !user.role) return false;
  
  // Super admin has all permissions
  if (user.role === 'super_admin') return true;
  
  // Admin has most permissions
  if (user.role === 'admin') {
    const adminPermissions = [
      'assets.view_all',
      'assets.create',
      'assets.edit',
      'assets.allocate',
      'assets.return',
      'assets.maintenance',
      'assets.audit',
      'assets.dispose',
      'assets.reports',
      'assets.export',
      'assets.view_department',
      'assets.approve_allocation',
    ];
    return adminPermissions.includes(requiredPermission);
  }
  
  // HR Manager permissions
  if (user.role === 'hr_manager') {
    const hrPermissions = [
      'assets.view_all',
      'assets.create',
      'assets.edit',
      'assets.allocate',
      'assets.return',
      'assets.maintenance',
      'assets.audit',
      'assets.reports',
      'assets.export',
      'assets.view_department',
      'assets.approve_allocation',
    ];
    return hrPermissions.includes(requiredPermission);
  }
  
  // Department Head permissions
  if (user.role === 'department_head') {
    const deptHeadPermissions = [
      'assets.view_department',
      'assets.approve_allocation',
      'assets.view_audit_trail',
    ];
    return deptHeadPermissions.includes(requiredPermission);
  }
  
  // Employee permissions
  if (user.role === 'employee') {
    const employeePermissions = [
      'assets.view_my',
      'assets.request_allocation',
      'assets.scan',
    ];
    return employeePermissions.includes(requiredPermission);
  }
  
  return false;
};

module.exports = { checkPermission };