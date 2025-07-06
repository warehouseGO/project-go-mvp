import React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import SiteAnalytics from "./SiteAnalytics";
import {
  SiteInChargeDashboardProvider,
  useSiteInChargeDashboard,
} from "../../context/SiteInChargeDashboardContext";
import LoadingSpinner from "../common/LoadingSpinner";
import { useAuth } from "../../context/AuthContext";

const SiteAnalyticsContent = () => {
  const { site, devices, users, loading, error } = useSiteInChargeDashboard();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { siteId } = useParams();

  if (loading) return <LoadingSpinner size="lg" />;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!site) {
    navigate(`/sites/${siteId}`);
    return null;
  }

  // Helper to merge filters and navigate
  const goToDevicesWithFilters = (newFilters) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    navigate(`/devices?${params.toString()}`);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {site?.name ? `${site.name} - Analytics` : "Site Analytics"}
        </h1>
      </div>
      <SiteAnalytics
        siteData={{ ...site, devices, users }}
        goToDevicesWithFilters={goToDevicesWithFilters}
      />
    </div>
  );
};

const SiteInChargeDashboard = () => {
  const { user } = useAuth();
  if (!user?.siteId)
    return <div className="text-gray-500">No site assigned</div>;
  return (
    <SiteInChargeDashboardProvider siteId={user.siteId}>
      <SiteAnalyticsContent />
    </SiteInChargeDashboardProvider>
  );
};

export default SiteInChargeDashboard;
