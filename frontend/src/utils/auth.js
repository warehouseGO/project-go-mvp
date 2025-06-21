// Token management
export const setToken = (token) => {
  localStorage.setItem("token", token);
};

export const getToken = () => {
  return localStorage.getItem("token");
};

export const removeToken = () => {
  localStorage.removeItem("token");
};

// User data management
export const setUser = (user) => {
  localStorage.setItem("user", JSON.stringify(user));
};

export const getUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const removeUser = () => {
  localStorage.removeItem("user");
};

// Auth state management
export const isAuthenticated = () => {
  return !!getToken();
};

export const logout = () => {
  removeToken();
  removeUser();
  window.location.href = "/login";
};

// Role checking
export const hasRole = (user, role) => {
  if (!user || !user.roles) return false;
  return user.roles.some((r) => r.roleName === role);
};

export const getUserRole = (user) => {
  if (!user || !user.roles || user.roles.length === 0) return null;
  return user.roles[0].roleName;
};
