const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('projnan_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && !endpoint.startsWith('/auth/login')) {
      localStorage.removeItem('projnan_token');
      localStorage.removeItem('projnan_user');
    }
    const error = new Error(data.message || 'An error occurred while communicating with the server.');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  auth: {
    login: (credentials) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: (userData) =>
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    me: () => request('/auth/me'),
    logout: () => {
      localStorage.removeItem('projnan_token');
      localStorage.removeItem('projnan_user');
      return request('/auth/logout', { method: 'POST' }).catch(() => ({}));
    },
    forgotPassword: (email) =>
      request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    resetPassword: (data) =>
      request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    verifyEmail: (token) =>
      request('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token }),
      }),
    resendVerification: () =>
      request('/auth/resend-verification', {
        method: 'POST',
      }),
  },

  classes: {
    getAll: () => request('/classes'),
    getById: (id) => request(`/classes/${id}`),
    create: (data) =>
      request('/classes', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    join: (code) =>
      request('/classes/join', {
        method: 'POST',
        body: JSON.stringify({ code }),
      }),
    removeStudent: (classId, studentId) =>
      request(`/classes/${classId}/students/${studentId}`, {
        method: 'DELETE',
      }),
  },

  teams: {
    getAll: () => request('/teams'),
    getById: (id) => request(`/teams/${id}`),
    create: (data) =>
      request('/teams', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    addMember: (teamId, userId, role) =>
      request(`/teams/${teamId}/members`, {
        method: 'POST',
        body: JSON.stringify({ userId, role }),
      }),
    removeMember: (teamId, userId) =>
      request(`/teams/${teamId}/members/${userId}`, {
        method: 'DELETE',
      }),
  },

  projects: {
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/projects${qs ? `?${qs}` : ''}`);
    },
    getMy: () => request('/projects/my'),
    getById: (id) => request(`/projects/${id}`),
    create: (data) =>
      request('/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      request(`/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    addMilestone: (id, data) =>
      request(`/projects/${id}/milestones`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateMilestone: (projectId, milestoneId, data) =>
      request(`/projects/${projectId}/milestones/${milestoneId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  tasks: {
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/tasks${qs ? `?${qs}` : ''}`);
    },
    getMy: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/tasks/my${qs ? `?${qs}` : ''}`);
    },
    getById: (id) => request(`/tasks/${id}`),
    create: (data) =>
      request('/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      request(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    submitEvidence: (id, evidence) =>
      request(`/tasks/${id}/evidence`, {
        method: 'POST',
        body: JSON.stringify({ evidence }),
      }),
    confirmVerification: (id, approved, feedbackNote) =>
      request(`/tasks/${id}/verify`, {
        method: 'POST',
        body: JSON.stringify({ approved, feedbackNote }),
      }),
    delete: (id) =>
      request(`/tasks/${id}`, {
        method: 'DELETE',
      }),
  },

  github: {
    connect: (projectId, data) => {
      const payload = typeof data === 'string' ? { repoUrl: data } : data;
      return request(`/github/${projectId}/connect`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    get: (projectId) => request(`/github/${projectId}`),
    getStatus: (projectId) => request(`/github/${projectId}/status`),
    sync: (projectId) =>
      request(`/github/${projectId}/sync`, {
        method: 'POST',
      }),
    getActivities: (projectId, limit = 25) =>
      request(`/github/${projectId}/activities?limit=${limit}`),
    getCommits: (projectId, limit = 25) =>
      request(`/github/${projectId}/commits?limit=${limit}`),
    getPullRequests: (projectId, limit = 25) =>
      request(`/github/${projectId}/pull-requests?limit=${limit}`),
    getIssues: (projectId, limit = 25) =>
      request(`/github/${projectId}/issues?limit=${limit}`),
  },

  progress: {
    getDashboard: () => request('/progress/dashboard'),
    getContributions: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/progress/contributions${qs ? `?${qs}` : ''}`);
    },
    getProjectContributions: (projectId, params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/progress/contributions/project/${projectId}${qs ? `?${qs}` : ''}`);
    },
    recordContribution: (data) =>
      request('/progress/contributions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  chat: {
    getChannels: (projectId) => request(`/chat/projects/${projectId}/channels`),
    getMessages: (channelId) => request(`/chat/channels/${channelId}/messages`),
    sendMessage: (channelId, message) =>
      request(`/chat/channels/${channelId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      }),
  },

  gamification: {
    getArena: () => request('/gamification/arena'),
    acceptChallenge: (challengeId) =>
      request(`/gamification/arena/${challengeId}/accept`, {
        method: 'POST',
      }),
    completeChallenge: (challengeId, evidence) =>
      request(`/gamification/arena/${challengeId}/complete`, {
        method: 'POST',
        body: JSON.stringify({ evidence }),
      }),
    getLeaderboard: (limit = 10) => request(`/gamification/leaderboard?limit=${limit}`),
    getAchievements: () => request('/gamification/achievements'),
  },

  feedback: {
    getByProject: (projectId) => request(`/feedback/project/${projectId}`),
    create: (data) =>
      request('/feedback', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id) =>
      request(`/feedback/${id}`, {
        method: 'DELETE',
      }),
  },

  notifications: {
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/notifications${qs ? `?${qs}` : ''}`);
    },
    markRead: (id) =>
      request(`/notifications/${id}/read`, {
        method: 'PUT',
      }),
    markAllRead: () =>
      request('/notifications/read-all', {
        method: 'PUT',
      }),
    delete: (id) =>
      request(`/notifications/${id}`, {
        method: 'DELETE',
      }),
  },
};
