import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import SiteAnalytics from "../components/dashboards/SiteAnalytics";

const SiteAnalyticsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { siteId } = useParams();
  const siteData = location.state?.siteData;

  if (!siteData) {
    // If no data, redirect back to site details
    navigate(`/sites/${siteId}`);
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {siteData?.name ? `${siteData.name} - Analytics` : "Site Analytics"}
        </h1>
        <button
          className="btn-secondary"
          onClick={() => navigate(`/sites/${siteId}`)}
        >
          Back to Site Details
        </button>
      </div>
      <SiteAnalytics siteData={siteData} />
    </div>
  );
};

export default SiteAnalyticsPage;
