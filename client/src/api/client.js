const API_BASE = '/api';

async function handleResponse(res) {
  if (!res.ok) {
    let errorMsg = 'An error occurred';
    try {
      const data = await res.json();
      errorMsg = data.error || data.message || errorMsg;
    } catch {
      errorMsg = await res.text();
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // Users
  getUsers: () => fetch(`${API_BASE}/users`).then(handleResponse),
  getUser: (id) => fetch(`${API_BASE}/users/${id}`).then(handleResponse),
  createUser: (data) => fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),

  // Subjects
  getSubjects: () => fetch(`${API_BASE}/subjects`).then(handleResponse),

  // Tutors
  getTutors: (params = {}) => {
    const query = new URLSearchParams();
    if (params.subjectId) query.set('subjectId', params.subjectId);
    if (params.search) query.set('search', params.search);
    return fetch(`${API_BASE}/tutors?${query.toString()}`).then(handleResponse);
  },
  getTutor: (id) => fetch(`${API_BASE}/tutors/${id}`).then(handleResponse),
  saveTutorProfile: (profileData) => fetch(`${API_BASE}/tutors/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profileData)
  }).then(handleResponse),

  // Sessions
  getSessions: (params = {}) => {
    const query = new URLSearchParams();
    if (params.userId) query.set('userId', params.userId);
    if (params.asRole) query.set('asRole', params.asRole);
    if (params.status) query.set('status', params.status);
    return fetch(`${API_BASE}/sessions?${query.toString()}`).then(handleResponse);
  },
  createSession: (data) => fetch(`${API_BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  updateSessionStatus: (id, status, actorId) => fetch(`${API_BASE}/sessions/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, actorId })
  }).then(handleResponse)
};
