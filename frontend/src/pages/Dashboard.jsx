import React from "react";
import { useAuth } from "../context/AuthContext";
import { ROLES } from "../utils/constants";
import OwnerDashboard from "../components/dashboards/OwnerDashboard";
import SiteInChargeDashboard from "../components/dashboards/SiteInChargeDashboard";
import SiteSupervisorDashboard from "../components/dashboards/SiteSupervisorDashboard";
import ClusterSupervisorDashboard from "../components/dashboards/ClusterSupervisorDashboard";
import SiteSupervisorDevices from "./SiteSupervisorDevices";

const Dashboard = () => {
  const { getUserRole } = useAuth();
  const userRole = getUserRole();

  const renderDashboard = () => {
    switch (userRole) {
      case ROLES.OWNER:
        return <OwnerDashboard />;
      case ROLES.SITE_INCHARGE:
        return <SiteInChargeDashboard />;
      case ROLES.SITE_SUPERVISOR:
        return <SiteSupervisorDashboard />;
      case ROLES.CLUSTER_SUPERVISOR:
        return <ClusterSupervisorDashboard />;
      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome to Warehouse Management System
            </h2>
            <p className="text-gray-600">
              Your role is being configured. Please contact your administrator.
            </p>
          </div>
        );
    }
  };

  return <div className="p-6">{renderDashboard()}</div>;
};

export default Dashboard;
