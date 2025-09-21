import React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import SiteAnalytics from "../components/dashboards/SiteAnalytics";
import {
  SiteInChargeDashboardProvider,
  useSiteInChargeDashboard,
} from "../context/SiteInChargeDashboardContext";
import LoadingSpinner from "../components/common/LoadingSpinner";

const SiteAnalyticsContent = () => {
  const { site, devices, users, loading, error, deviceTypes } =
    useSiteInChargeDashboard();
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
    navigate(`/sites/${siteId}?${params.toString()}`);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {site?.name ? `${site.name} - Analytics` : "Site Analytics"}
        </h1>
        <button
          className="btn-secondary"
          onClick={() => navigate(`/sites/${siteId}`)}
        >
          Back to Site Details
        </button>
      </div>
      <SiteAnalytics
        siteData={{ ...site, devices, users }}
        goToDevicesWithFilters={goToDevicesWithFilters}
        deviceTypes={deviceTypes}
      />
    </div>
  );
};

const SiteAnalyticsPage = () => {
  const { siteId } = useParams();
  return (
    <SiteInChargeDashboardProvider siteId={siteId}>
      <SiteAnalyticsContent />
    </SiteInChargeDashboardProvider>
  );
};

export default SiteAnalyticsPage;
