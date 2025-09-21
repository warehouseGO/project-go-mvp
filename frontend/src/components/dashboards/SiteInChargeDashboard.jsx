import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import SiteAnalytics from "./SiteAnalytics";
import {
  SiteInChargeDashboardProvider,
  useSiteInChargeDashboard,
} from "../../context/SiteInChargeDashboardContext";
import LoadingSpinner from "../common/LoadingSpinner";
import ConstraintReportModal from "../common/ConstraintReportModal";
import { useAuth } from "../../context/AuthContext";
import { useConstraintReport } from "../../hooks/useConstraintReport";

const SiteAnalyticsContent = ({ siteId }) => {
  const { site, devices, users, loading, error, deviceTypes, statusCounts } =
    useSiteInChargeDashboard();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [showConstraintReport, setShowConstraintReport] = useState(false);
  const {
    reportData,
    loading: reportLoading,
    error: reportError,
    fetchSiteConstraintReport,
    clearReport,
  } = useConstraintReport();

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

  const handleOpenConstraintReport = async () => {
    setShowConstraintReport(true);
    await fetchSiteConstraintReport(siteId);
  };

  const handleCloseConstraintReport = () => {
    setShowConstraintReport(false);
    clearReport();
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {site?.name ? `${site.name} - Analytics` : "Site Analytics"}
        </h1>
        <button onClick={handleOpenConstraintReport} className="btn-secondary">
          View Constraint Report
        </button>
      </div>
      <SiteAnalytics
        siteData={{ ...site, devices, users }}
        goToDevicesWithFilters={goToDevicesWithFilters}
        deviceTypes={deviceTypes}
        statusCounts={statusCounts}
      />

      <ConstraintReportModal
        isOpen={showConstraintReport}
        onClose={handleCloseConstraintReport}
        reportData={reportData}
        loading={reportLoading}
        error={reportError}
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
      <SiteAnalyticsContent siteId={user.siteId} />
    </SiteInChargeDashboardProvider>
  );
};

export default SiteInChargeDashboard;
