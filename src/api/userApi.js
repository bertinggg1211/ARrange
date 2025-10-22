import { authApi, BASE_URL as ROOT_BASE } from './api';

const BASE_URL = `${ROOT_BASE}/api/user`;

export const getUserProfile = async () => {
  const token = await authApi.getStoredToken();
  const res = await fetch(`${BASE_URL}/profile`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Failed to load profile');
  return data; // { success, user }
};

export const updateUserProfile = async (payload = {}) => {
  const token = await authApi.getStoredToken();
  
  // Check if we have an avatar file to upload
  const hasAvatarFile = payload.avatar && payload.avatar.uri && !payload.avatar.uri.startsWith('http');
  
  let body;
  let headers = {
    Authorization: `Bearer ${token}`,
  };
  
  if (hasAvatarFile) {
    // Use FormData for file upload
    const form = new FormData();
    
    // Append text fields
    if (payload.fullName) form.append('fullName', payload.fullName);
    if (payload.phone) form.append('phone', payload.phone);
    if (payload.address) form.append('address', payload.address);
    
    // Append avatar file
    form.append('avatar', {
      uri: payload.avatar.uri,
      type: payload.avatar.type || 'image/jpeg',
      name: payload.avatar.name || 'avatar.jpg',
    });
    
    body = form;
  } else {
    // Use JSON for regular updates
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(payload);
  }
  
  const res = await fetch(`${BASE_URL}/profile`, {
    method: 'PUT',
    headers,
    body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Failed to update profile');
  return data; // { success, user }
};

export const deleteUserAccount = async () => {
  const token = await authApi.getStoredToken();
  const res = await fetch(`${BASE_URL}/delete-account`, {
    method: 'DELETE',
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Failed to delete account');
  return data; // { success, message }
};

export const getUserStats = async () => {
  const token = await authApi.getStoredToken();
  const res = await fetch(`${BASE_URL}/stats`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Failed to load user stats');
  return data; // { success, stats: { orders, favorites, reviews } }
};

export default { getUserProfile, updateUserProfile, deleteUserAccount, getUserStats };


