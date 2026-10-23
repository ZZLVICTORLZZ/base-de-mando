import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Función asíncrona para verificar si el usuario móvil actual es Administrador.
 * Por ahora usará un valor mockeado o guardado en el storage local.
 */
export const isAdmin = async (): Promise<boolean> => {
  try {
    const role = await AsyncStorage.getItem('apolo11_role');
    const levelStr = await AsyncStorage.getItem('apolo11_user_level');
    const level = levelStr ? parseInt(levelStr) : 0;

    if (role === 'admin' || level >= 10) return true;
    
    return false;
  } catch (e) {
    return false;
  }
};

/**
 * Verifica si el usuario actual es el autor de un rol.
 */
export const isOwner = async (creatorName: string): Promise<boolean> => {
  try {
    const currentUser = await AsyncStorage.getItem('apolo11_user_name') || 'Tablerista';
    return currentUser === creatorName;
  } catch (e) {
    return false;
  }
};
