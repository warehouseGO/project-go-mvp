import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Header from "./components/common/Header";
import Sidebar from "./components/common/Sidebar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ClusterSupervisorDetails from "./pages/ClusterSupervisorDetails";
import Devices from "./pages/Devices";
import SiteSupervisorDevices from "./pages/SiteSupervisorDevices";
import Users from "./pages/Users";
import SiteDetails from "./pages/SiteDetails";
import { ROLES } from "./utils/constants";

const Layout = ({ children }) => {
  const { getUserRole } = useAuth();
  const userRole = getUserRole();
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        {userRole && <Sidebar />}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/devices"
            element={
              <ProtectedRoute>
                <Layout>
                  <Devices />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/cluster-supervisor/:subordinateId"
            element={
              <ProtectedRoute>
                <Layout>
                  <ClusterSupervisorDetails />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/site-supervisor/devices"
            element={
              <ProtectedRoute>
                <Layout>
                  <SiteSupervisorDevices />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <Layout>
                  <Users />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/sites/:siteId"
            element={
              <ProtectedRoute>
                <Layout>
                  <SiteDetails />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
