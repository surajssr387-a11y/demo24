export const getActiveAdminPin = (): string => {
  try {
    return localStorage.getItem('ramys_studio_admin_active_pin_v2') || 'Ramy@2026';
  } catch {
    return 'Ramy@2026';
  }
};
