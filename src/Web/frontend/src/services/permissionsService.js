import { apiService } from './apiService';
let cachedPermissions = null;
let pendingPromise = null;

export const getCachedPermissions = async () => {
  if (cachedPermissions) return cachedPermissions;
  if (pendingPromise) return pendingPromise;

  pendingPromise = apiService.getMyPermissions()
    .then(res => {
      cachedPermissions = res;
      pendingPromise = null;
      return res;
    })
    .catch(err => {
      pendingPromise = null;
      throw err;
    });

  return pendingPromise;
};

export const clearCachedPermissions = () => {
  cachedPermissions = null;
};