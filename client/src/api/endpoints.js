import api from './axios';

export const auth = {
  register: (data) => api.post('/auth/register', data).then((r) => r.data),
  login: (data) => api.post('/auth/login', data).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
};

export const stadiums = {
  list: (params) => api.get('/stadiums', { params }).then((r) => r.data),
  get: (id) => api.get(`/stadiums/${id}`).then((r) => r.data),
  mine: () => api.get('/stadiums/owner/mine').then((r) => r.data),
  create: (formData) =>
    api.post('/stadiums', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data),
  update: (id, formData) =>
    api.put(`/stadiums/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data),
  removePhoto: (id, filename) =>
    api.delete(`/stadiums/${id}/photos/${encodeURIComponent(filename)}`).then((r) => r.data),
  remove: (id) => api.delete(`/stadiums/${id}`).then((r) => r.data),
};

export const slots = {
  forStadium: (id) => api.get(`/slots/stadium/${id}`).then((r) => r.data),
  create: (data) => api.post('/slots', data).then((r) => r.data),
  remove: (id) => api.delete(`/slots/${id}`).then((r) => r.data),
};

export const reservations = {
  reserve: (slotId) => api.post(`/reservations/${slotId}`).then((r) => r.data),
  cancel: (slotId) => api.delete(`/reservations/${slotId}`).then((r) => r.data),
  mine: () => api.get('/reservations/mine').then((r) => r.data),
};

export const messages = {
  send: (data) => api.post('/messages', data).then((r) => r.data),
  thread: (otherUserId, stadiumId) =>
    api.get(`/messages/thread/${otherUserId}/${stadiumId}`).then((r) => r.data),
  inbox: () => api.get('/messages/inbox').then((r) => r.data),
};

export const stats = {
  owner: () => api.get('/stats/owner').then((r) => r.data),
};
