import React from "react";
import { JOB_STATUS_COLORS, USER_STATUS_COLORS } from "../../utils/constants";

const resourceStatusColors = {
  WORKING: "bg-green-100 text-green-800",
  BREAKDOWN: "bg-red-100 text-red-800",
  FREE: "bg-gray-100 text-gray-800",
};

const StatusBadge = ({ status, type = "job" }) => {
  const getColorClass = () => {
    if (type === "resource") {
      return resourceStatusColors[status] || "bg-gray-100 text-gray-800";
    } else if (type === "job") {
      return JOB_STATUS_COLORS[status];
    } else if (type === "user") {
      return USER_STATUS_COLORS[status] || "bg-gray-100 text-gray-800";
    }
    return "bg-gray-100 text-gray-800";
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getColorClass()}`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
