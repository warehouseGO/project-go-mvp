import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { resourcesAPI, sitesAPI } from "../utils/api";

const OwnerResourceManagementContext = createContext();

export const useOwnerResourceManagement = () => {
  const ctx = useContext(OwnerResourceManagementContext);
  if (!ctx)
    throw new Error(
      "useOwnerResourceManagement must be used within an OwnerResourceManagementProvider"
    );
  return ctx;
};

export const OwnerResourceManagementProvider = ({ children }) => {
  const [resources, setResources] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Remove filters, setFilters, clearFilters

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await resourcesAPI.getResources({}); // Owner gets all resources
      setResources(res.data);
      const sitesRes = await sitesAPI.getSites();
      setSites(sitesRes.data?.createdSites || sitesRes.data?.sites || []);
    } catch (err) {
      setError("Failed to fetch resources or sites");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Mutations
  const addResource = async (resourceData) => {
    await resourcesAPI.createResource(resourceData);
    await fetchAll();
  };
  const editResource = async (resourceId, resourceData) => {
    await resourcesAPI.updateResource(resourceId, resourceData);
    await fetchAll();
  };
  const deleteResource = async (resourceId) => {
    await resourcesAPI.deleteResource(resourceId);
    await fetchAll();
  };
  const allocateResources = async (data) => {
    await resourcesAPI.allocateResources(data);
    await fetchAll();
  };
  const updateResourceStatus = async (resourceId, statusData) => {
    await resourcesAPI.updateResourceStatus(resourceId, statusData);
    await fetchAll();
  };

  return (
    <OwnerResourceManagementContext.Provider
      value={{
        resources,
        sites,
        loading,
        error,
        addResource,
        editResource,
        deleteResource,
        allocateResources,
        updateResourceStatus,
        refetch: fetchAll,
      }}
    >
      {children}
    </OwnerResourceManagementContext.Provider>
  );
};
