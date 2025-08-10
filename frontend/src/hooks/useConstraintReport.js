import { useState, useCallback } from "react";
import { constraintsAPI } from "../utils/api";

export const useConstraintReport = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchSiteConstraintReport = useCallback(async (siteId) => {
    setLoading(true);
    setError("");
    try {
      const response = await constraintsAPI.getSiteConstraintReport(siteId);
      setReportData(response.data);
    } catch (err) {
      setError(
        err.response?.data?.error || "Failed to fetch constraint report"
      );
      console.error("Error fetching constraint report:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllSitesConstraintReport = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await constraintsAPI.getAllSitesConstraintReport();
      setReportData(response.data);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Failed to fetch all sites constraint report"
      );
      console.error("Error fetching all sites constraint report:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearReport = useCallback(() => {
    setReportData(null);
    setError("");
  }, []);

  return {
    reportData,
    loading,
    error,
    fetchSiteConstraintReport,
    fetchAllSitesConstraintReport,
    clearReport,
  };
};
