import React, { useState, useEffect } from "react";
import { dashboardAPI, usersAPI } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../common/LoadingSpinner";
import StatusBadge from "../common/StatusBadge";
import SiteAnalytics from "./SiteAnalytics";

const SiteInChargeDashboard = () => {
  const [siteData, setSiteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    if (user?.siteId) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardAPI.siteInChargeDashboard(user.siteId);
      setSiteData(response.data);
    } catch (err) {
      setError("Failed to fetch dashboard data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!siteData) return <div className="text-gray-500">No site assigned</div>;

  return (
    <div className="space-y-6">
      <SiteAnalytics siteData={siteData} />
    </div>
  );
};

export default SiteInChargeDashboard;
