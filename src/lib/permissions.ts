// Base de Mando - Central de Permisos

/**
 * Función para verificar si el usuario actual es Administrador global.
 * Por ahora, si el bypass está activo, es administrador.
 * En el futuro, esto se conectará al módulo de Accesos (ligas por usuario).
 */
export const isAdmin = (): boolean => {
  // Prototipo: Si tiene el bypass o si su sesión (guardada en futuro) dicta admin
  if (localStorage.getItem('apolo11_bypass') === 'true') {
    return true;
  }
  
  // Aquí podemos leer el rol real de una variable global o de Supabase en el futuro
  const role = localStorage.getItem('apolo11_role');
  return role === 'admin';
};

/**
 * Función para verificar si un usuario tiene acceso a un módulo específico ("liga").
 * (En preparación para el futuro requerimiento de ligas).
 */
export const hasModuleAccess = (moduleName: string): boolean => {
  if (isAdmin()) return true;
  
  // TODO: Leer permisos de módulos desde la DB
  // const permissions = JSON.parse(localStorage.getItem('apolo11_permissions') || '[]');
  // return permissions.includes(moduleName);
  
  return true; // Por ahora todos pueden ver, pero no editar/borrar si no son admin
};
