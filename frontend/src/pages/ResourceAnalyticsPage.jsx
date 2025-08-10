import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ResourceAnalytics from "../components/dashboards/ResourceAnalytics";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import { resourcesAPI, sitesAPI } from "../utils/api";

const ResourceAnalyticsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [resources, setResources] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch resources and sites data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch all resources
      const resourcesResponse = await resourcesAPI.getResources();
      setResources(resourcesResponse.data || []);

      // Fetch all sites
      const sitesResponse = await sitesAPI.getSites();

      setSites(sitesResponse.data.createdSites || []);
    } catch (err) {
      setError("Failed to fetch data");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    console.log(sites);
  }, [sites]);

  // Helper to merge filters and navigate
  const goToResourcesWithFilters = (newFilters) => {
    const params = new URLSearchParams(searchParams);

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    navigate(`/resources?${params.toString()}`);
  };

  if (loading) return <LoadingSpinner size="lg" />;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Resource Analytics</h1>
        <button
          className="btn-secondary"
          onClick={() => navigate("/resources")}
        >
          Back to Resources
        </button>
      </div>
      <ResourceAnalytics
        resources={resources}
        sites={sites}
        goToResourcesWithFilters={goToResourcesWithFilters}
      />
    </div>
  );
};

export default ResourceAnalyticsPage;
