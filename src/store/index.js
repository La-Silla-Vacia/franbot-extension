export { default as useAuthStore } from './authStore';
export { default as useAppStore } from './appStore';

// Hook combinado para acceso fácil a ambos stores
export const useStores = () => {
  const auth = useAuthStore();
  const app = useAppStore();
  
  return { auth, app };
};