import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import DeviceTable from "../components/common/DeviceTable";
import DeviceFilters from "../components/common/DeviceFilters";
import LoadingSpinner from "../components/common/LoadingSpinner";
import AttributesModal from "../components/common/AttributesModal";
import { useAuth } from "../context/AuthContext";
import {
  SiteInChargeDashboardProvider,
  useSiteInChargeDashboard,
} from "../context/SiteInChargeDashboardContext";

const OrganogramModal = ({ isOpen, onClose, users, ownerId }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Memoize nodeTypes and edgeTypes
  //   const nodeTypes = useMemo(() => ({}), []);
  //   const edgeTypes = useMemo(() => ({}), []);

  const buildFlowData = useCallback(() => {
    if (!users || !ownerId) return { nodes: [], edges: [] };

    const userMap = {};
    const hierarchy = [];
    const nodes = [];
    const edges = [];
    let nodeId = 0;

    // Create a map of users by ID with only children IDs
    users.forEach((user) => {
      userMap[user.id] = { children: [] };
    });

    // Build the hierarchy and find root nodes
    users.forEach((user) => {
      if (user.superiorId) {
        if (userMap[user.superiorId]) {
          userMap[user.superiorId].children.push(user.id);
        }
        // If this user's superior is the owner, they are a root
        if (user.superiorId === ownerId) {
          hierarchy.push(user.id);
        }
      }
    });

    // Create nodes and edges recursively
    const createNodes = (userId, x, y, level = 0) => {
      const user = users.find((u) => u.id === userId);
      if (!user) return;

      const node = {
        id: String(userId),
        type: "default",
        position: { x, y },
        data: {
          label: (
            <div>
              <div className="font-medium text-gray-900 text-center">
                {user.name}
              </div>
              <div className="text-sm text-gray-600 text-center">
                {user.email}
              </div>
              <div className="text-xs text-gray-500 capitalize text-center">
                {user.role.replace(/_/g, " ").toLowerCase()}
              </div>
            </div>
          ),
        },
        style: {
          background: "white",
          border: "1px solid #e0e0e0",
          width: 220,
          height: 80,
        },
      };
      nodes.push(node);

      const children = userMap[userId]?.children || [];
      if (children.length > 0) {
        const childSpacing = 250;
        const totalWidth = (children.length - 1) * childSpacing;
        const startX = x - totalWidth / 2;

        children.forEach((childId, index) => {
          const childX = startX + index * childSpacing;
          const childY = y + 150;

          // Create edge
          edges.push({
            id: `${String(userId)}-${String(childId)}`,
            source: String(userId),
            target: String(childId),
            type: "smoothstep",
            style: { stroke: "#6B7280", strokeWidth: 2 },
          });

          // Recursively create child nodes
          createNodes(childId, childX, childY, level + 1);
        });
      }
    };

    // Create nodes starting from root nodes
    hierarchy.forEach((rootId, index) => {
      const x = 400 + index * 300;
      const y = 50;
      createNodes(rootId, x, y);
    });

    return { nodes, edges };
  }, [users, ownerId]);

  useEffect(() => {
    if (isOpen) {
      const { nodes: flowNodes, edges: flowEdges } = buildFlowData();
      setNodes(flowNodes);
      setEdges(flowEdges);
    }
  }, [isOpen, buildFlowData, setNodes, setEdges]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );
  useEffect(() => {
    console.log(nodes);
    console.log(edges);
  }, [nodes, edges]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Organizational Structure
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="h-[calc(100vh-100px)]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            attributionPosition="bottom-left"
          >
            <Controls />
            <MiniMap />
            <Background color="#aaa" gap={16} />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
};

const SiteDetailsContent = () => {
  const { devices, users, deviceTypes, deviceSubtypes, loading, error } =
    useSiteInChargeDashboard();
  const [attributesModalOpen, setAttributesModalOpen] = useState(false);
  const [selectedDeviceAttributes, setSelectedDeviceAttributes] =
    useState(null);
  const [expandedDeviceId, setExpandedDeviceId] = useState(null);
  const [organogramModalOpen, setOrganogramModalOpen] = useState(false);
  const { user } = useAuth();
  const { siteId } = useParams();
  const navigate = useNavigate();

  // URL param-based filters
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = {
    status: searchParams.get("status") || "",
    type: searchParams.get("type") || "",
    subtype: searchParams.get("subtype") || "",
    siteSupervisor: searchParams.get("siteSupervisor") || "",
    clusterSupervisor: searchParams.get("clusterSupervisor") || "",
  };
  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    setSearchParams(newParams);
  };

  // Get unique site supervisors and cluster supervisors for dropdowns
  const siteSupervisors =
    users?.filter((u) => u.role === "SITE_SUPERVISOR") || [];
  const clusterSupervisors =
    users?.filter((u) => u.role === "CLUSTER_SUPERVISOR") || [];

  // Filtering logic (can be moved to context if needed)
  let filtered = [...(devices || [])];
  if (filters.clusterSupervisor) {
    filtered = filtered.filter(
      (device) =>
        String(device.assignedTo) === String(filters.clusterSupervisor)
    );
  } else if (filters.siteSupervisor) {
    const clusterIds = clusterSupervisors
      .filter((cs) => String(cs.superiorId) === String(filters.siteSupervisor))
      .map((cs) => cs.id);
    filtered = filtered.filter(
      (device) => device.assignedTo && clusterIds.includes(device.assignedTo)
    );
  }
  if (filters.status) {
    filtered = filtered.filter((device) => {
      if (!device.jobs || device.jobs.length === 0)
        return filters.status === "IN_PROGRESS";
      const statuses = device.jobs.map((j) => j.status);
      if (filters.status === "COMPLETED") {
        return statuses.every((s) => s === "COMPLETED");
      } else if (filters.status === "CONSTRAINT") {
        return statuses.includes("CONSTRAINT");
      } else if (filters.status === "IN_PROGRESS") {
        return (
          statuses.includes("IN_PROGRESS") && !statuses.includes("CONSTRAINT")
        );
      }
      return true;
    });
  }
  if (filters.type) {
    filtered = filtered.filter((device) => device.type === filters.type);
  }
  if (filters.subtype) {
    filtered = filtered.filter((device) => device.subtype === filters.subtype);
  }

  const handleShowAttributes = (device) => {
    setSelectedDeviceAttributes(device || {});
    setAttributesModalOpen(true);
  };
  const handleShowJobs = (deviceId) => {
    setExpandedDeviceId((prev) => (prev === deviceId ? null : deviceId));
  };
  const closeAttributesModal = () => setAttributesModalOpen(false);

  // Add analytics navigation button for owner
  const handleGoToAnalytics = () => {
    navigate(`/sites/${siteId}/analytics`);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Site Details</h1>
        <div className="flex gap-2">
          <button
            className="btn-secondary"
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </button>
          {user?.role === "OWNER" && (
            <>
              <button className="btn-primary" onClick={handleGoToAnalytics}>
                Analytics
              </button>
              <button
                className="btn-secondary"
                onClick={() => setOrganogramModalOpen(true)}
              >
                View Organogram
              </button>
            </>
          )}
        </div>
      </div>
      {loading ? (
        <LoadingSpinner size="lg" />
      ) : devices ? (
        <>
          <DeviceFilters
            filters={filters}
            onFilterChange={updateFilter}
            onClearFilters={() => setSearchParams({})}
            deviceTypes={deviceTypes}
            deviceSubtypes={deviceSubtypes}
            siteSupervisors={siteSupervisors}
            clusterSupervisors={clusterSupervisors}
          />
          <DeviceTable
            devices={filtered}
            showActions={true}
            showAssignedTo={true}
            onShowAttributes={handleShowAttributes}
            onShowJobs={handleShowJobs}
            expandedDeviceId={expandedDeviceId}
          />
          <AttributesModal
            isOpen={attributesModalOpen}
            attributes={selectedDeviceAttributes}
            onClose={closeAttributesModal}
          />
          <ReactFlowProvider>
            <OrganogramModal
              isOpen={organogramModalOpen}
              onClose={() => setOrganogramModalOpen(false)}
              users={users}
              ownerId={user?.id}
            />
          </ReactFlowProvider>
        </>
      ) : (
        <div className="text-gray-500">No site details found.</div>
      )}
    </div>
  );
};

const SiteDetails = () => {
  const { siteId } = useParams();
  useEffect(() => {
    console.log("siteId");
    console.log(siteId);
  }, [siteId]);
  return (
    <SiteInChargeDashboardProvider siteId={siteId}>
      <SiteDetailsContent />
    </SiteInChargeDashboardProvider>
  );
};

export default SiteDetails;
