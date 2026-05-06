/* Service Sphere — Shared API Layer */
const SS = (() => {
  const BASE_URL = 'http://localhost:5000/api';

  async function api(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    
    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      if (!response.ok) throw new Error(`Server Error (${response.status}): ${text.substring(0, 50)}...`);
      return text;
    }

    if (!response.ok) throw new Error(data.message || 'API Error');
    return data;
  }

  // File upload specific method
  async function apiUpload(endpoint, formData) {
    const token = localStorage.getItem('token');
    const headers = {}; // Let browser set Content-Type for FormData
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'API Error');
    return data;
  }

  /* ── API wrappers ─────────────────────────────────────────── */
  return {
    init() { /* no op */ },

    // ── Authentication ──────────────────────────────────────────
    async register(userData) { return await api('/auth/register', 'POST', userData); },
    async login(credentials) { return await api('/auth/login', 'POST', credentials); },
    async sendOtp(phone) { return await api('/auth/send-otp', 'POST', { phone }); },
    async verifyOtp(data) { return await api('/auth/verify-otp', 'POST', data); },
    
    // ── Current user ──────────────────────────────────────────
    getUser() { return JSON.parse(localStorage.getItem('ss_currentUser') || 'null'); },
    setUser(u, token) { 
      localStorage.setItem('ss_currentUser', JSON.stringify(u)); 
      if (token) localStorage.setItem('token', token);
    },
    logout() { 
      localStorage.removeItem('ss_currentUser'); 
      localStorage.removeItem('token'); 
      localStorage.removeItem('role');
    },
    async fetchProfile() {
      const user = await api('/users/profile');
      this.setUser(user);
      return user;
    },

    // ── Providers & Services ──────────────────────────────────
    async getProviders() { return await api('/users/providers'); },
    async getProvider(id) { return await api(`/users/providers/${id}`); },
    async getAllServices() { return await api('/services'); },
    async getService(id) { return await api(`/services/${id}`); },
    async getCategories() { 
      const services = await this.getAllServices();
      return [...new Set(services.map(s => s.category))]; 
    },
    async createService(formData) { return await apiUpload('/services', formData); },
    async deleteService(id) { return await api(`/services/${id}`, 'DELETE'); },
    async updateProfile(data) { return await api('/users/profile', 'PUT', data); },

    // ── Bookings ───────────────────────────────────────────────
    async getBookings() { return await api('/bookings/my-bookings'); },
    async getBooking(id) { return await api(`/bookings/${id}`); },
    async addBooking(b) { return await api('/bookings', 'POST', b); },
    async updateBookingStatus(id, status) { return await api(`/bookings/${id}/status`, 'PUT', { status }); },

    // ── Messages ───────────────────────────────────────────────
    async getMessages(bookingId) { return await api(`/messages/${bookingId}`); },

    // ── Earnings ───────────────────────────────────────────────
    async getEarnings() { return await api('/users/earnings'); },
    
    // ── Admin ──────────────────────────────────────────────────
    async getUnverifiedProviders() { return await api('/users/unverified-providers'); },
    async verifyProvider(id) { return await api(`/users/verify/${id}`, 'PUT'); },
    
    // ── Constants ───────────────────────────
    MILESTONES: ['pending', 'accepted', 'active', 'completed', 'cancelled'],
    
    async advanceMilestone(bookingId, newStatus) {
      return await this.updateBookingStatus(bookingId, newStatus);
    }
  };
})();

SS.init();
