import axios from "axios";

const API_BASE_URL = "http://localhost:3000/api";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: (userData) => api.post("/auth/register", userData),
  login: (credentials) => api.post("/auth/login", credentials),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
};

// Users API calls
export const usersAPI = {
  getUsers: (params) => api.get("/users", { params }),
  getPendingUsers: () => api.get("/users/pending"),
  approveUser: (id) => api.put(`/users/${id}/approve`),
  assignRole: (id, role) => api.put(`/users/${id}/role`, { role }),
  getHierarchy: () => api.get("/users/hierarchy"),
  assignSubordinate: (data) => api.post("/users/assign-subordinate", data),
};

// Sites API calls
export const sitesAPI = {
  getSites: (params) => api.get("/sites", { params }),
  createSite: (siteData) => api.post("/sites", siteData),
  getSiteDetails: (id) => api.get(`/sites/${id}`),
  updateSite: (id, siteData) => api.put(`/sites/${id}`, siteData),
};

// Devices API calls
export const devicesAPI = {
  getDevices: () => api.get("/devices"),
  createDevice: (deviceData) => api.post("/devices", deviceData),
  getDeviceDetails: (id) => api.get(`/devices/${id}`),
  updateDevice: (id, deviceData) => api.put(`/devices/${id}`, deviceData),
  deleteDevice: (id) => api.delete(`/devices/${id}`),
  assignDevice: (id, assignedTo) =>
    api.post(`/devices/${id}/assign`, { assignedTo }),
  assignDevicesToClusterSupervisor: ({ deviceIds, clusterSupervisorId }) =>
    api.post("/devices/assign-cluster-supervisor", {
      deviceIds,
      clusterSupervisorId,
    }),
  assignDevicesToSiteSupervisor: ({ deviceIds, siteSupervisorId }) =>
    api.post("/devices/assign-site-supervisor", {
      deviceIds,
      siteSupervisorId,
    }),
};

// Jobs API calls
export const jobsAPI = {
  getJobs: (params) => api.get("/jobs", { params }),
  createJobs: (jobsData) => api.post("/jobs", jobsData),
  updateJobStatus: (id, statusData) =>
    api.put(`/jobs/${id}/status`, statusData),
};

// Dashboard API calls
export const dashboardAPI = {
  ownerDashboard: () => api.get("/dashboard/owner"),
  siteInChargeDashboard: (siteId) =>
    api.get(`/dashboard/site-incharge/${siteId}`),
  siteSupervisorDashboard: () => api.get("/dashboard/site-supervisor"),
  clusterSupervisorDashboard: () => api.get("/dashboard/cluster-supervisor"),
  fullAssignSite: (data) => api.post("/sites/full-assign", data),
};

export default api;
