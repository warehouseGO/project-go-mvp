import React from "react";
import { JOB_STATUS_COLORS, USER_STATUS_COLORS } from "../../utils/constants";

const resourceStatusColors = {
  WORKING: "bg-green-100 text-green-800",
  BREAKDOWN: "bg-red-100 text-red-800",
  FREE: "bg-gray-100 text-gray-800",
};

const StatusBadge = ({ status, resourceType }) => {
  const colorClass = resourceType
    ? resourceStatusColors[status] || "bg-gray-100 text-gray-800"
    : statusColors[status?.toLowerCase()] || "bg-gray-100 text-gray-800";
  return (
    <span
      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${colorClass}`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
