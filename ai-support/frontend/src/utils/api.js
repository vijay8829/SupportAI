import axios from 'axios';

// Empty string = use Vite proxy (/api → localhost:5000), works with any tunnel URL
// Set VITE_API_URL only if you need to point directly at a remote backend
const BASE_URL = import.meta.env.VITE_API_URL ?? '';

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 30000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('company');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────
export const authAPI = {
  register:      (data) => api.post('/auth/register', data),
  login:         (data) => api.post('/auth/login', data),
  me:            ()     => api.get('/auth/me'),
  updateCompany: (data) => api.put('/auth/company', data),
};

// ── Documents ─────────────────────────────────────
export const docsAPI = {
  list:       (params)   => api.get('/documents', { params }),
  upload:     (formData) => api.post('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  }),
  uploadText: (data)     => api.post('/documents', data),
  get:        (id)       => api.get(`/documents/${id}`),
  delete:     (id)       => api.delete(`/documents/${id}`),
};

// ── Analytics ─────────────────────────────────────
export const analyticsAPI = {
  dashboard:    () => api.get('/analytics/dashboard'),
  topQuestions: () => api.get('/analytics/top-questions'),
};

// ── Admin Chat ────────────────────────────────────
export const adminChatAPI = {
  listConversations:   (params) => api.get('/chat/admin/conversations', { params }),
  getConversation:     (id)     => api.get(`/chat/admin/conversations/${id}/messages`),
};

// ── Feedback + History (public) ───────────────────
export const submitFeedback  = (slug, messageId, rating, comment) =>
  api.post(`/chat/${slug}/feedback/${messageId}`, { rating, comment });

export const getChatHistory  = (slug, sessionId) =>
  api.get(`/chat/${slug}/history/${sessionId}`);

/**
 * streamChat — SSE streaming chat.
 *
 * Goes directly to the backend (not through Vite proxy) so SSE
 * tokens are flushed token-by-token instead of buffered.
 */
export const streamChat = async ({
  slug, content, sessionId, visitorName,
  onChunk, onDone, onError,
}) => {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Direct backend URL — bypasses Vite proxy buffering
  const url = `${BASE_URL}/api/chat/${slug}/message`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ content, sessionId, visitorName, stream: true }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(err.error || `HTTP ${response.status}`);
    }

    const reader  = response.body.getReader();
    const decoder = new TextDecoder();
    let   buffer  = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE lines are separated by \n; events by \n\n
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';          // keep incomplete line

      for (const raw of lines) {
        const line = raw.trimEnd();        // strip trailing \r on Windows
        if (!line.startsWith('data: ')) continue;

        try {
          const data = JSON.parse(line.slice(6));

          if (data.text !== undefined) {
            // streaming chunk
            onChunk(data.text);
          } else if (data.messageId !== undefined && data.sources !== undefined) {
            // done event (has both messageId and sources)
            onDone(data);
          }
          // 'start' event (only messageId, no sources) is intentionally ignored
        } catch {
          // malformed JSON — skip silently
        }
      }
    }
  } catch (error) {
    onError(error);
  }
};
