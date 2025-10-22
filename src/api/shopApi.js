import { authApi, BASE_URL as ROOT_BASE } from './api';

const BASE_URL = `${ROOT_BASE}/api/seller`;

// Fetch current seller shop/profile info
export const getShopInfo = async () => {
  const token = await authApi.getStoredToken();
  const res = await fetch(`${BASE_URL}/profile`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Failed to load shop info');
  return data; // { success, seller }
};

// Update shop info (supports text fields and optional files)
// payload: {
//   shopName?, fullName?, sellerProfile?: { businessName?, businessDescription? },
//   avatar?, cover?, shopLogo?, shopBanner?  // RN file objects
// }
export const updateShopInfo = async (payload = {}) => {
  const token = await authApi.getStoredToken();
  const form = new FormData();

  // Primitive top-level fields
  ['shopName', 'fullName', 'address', 'phone'].forEach((k) => {
    if (payload[k] !== undefined && payload[k] !== null) {
      form.append(k, String(payload[k]));
    }
  });

  // Nested sellerProfile
  if (payload.sellerProfile && typeof payload.sellerProfile === 'object') {
    Object.entries(payload.sellerProfile).forEach(([key, value]) => {
      if (value !== undefined && value !== null && typeof value !== 'object') {
        form.append(`sellerProfile[${key}]`, String(value));
      }
    });
  }

  // Optional files
  if (payload.avatar) form.append('avatar', payload.avatar);
  if (payload.cover) form.append('cover', payload.cover);
  if (payload.shopLogo) form.append('shopLogo', payload.shopLogo);
  if (payload.shopBanner) form.append('shopBanner', payload.shopBanner);

  const res = await fetch(`${BASE_URL}/profile`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Failed to update shop info');
  return data; // { success, seller }
};

export default {
  getShopInfo,
  updateShopInfo,
};


