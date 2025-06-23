import React from "react";
import { JOB_STATUS_COLORS, USER_STATUS_COLORS } from "../../utils/constants";

const StatusBadge = ({ status, type = "job", className = "" }) => {
  const getColorClass = () => {
    if (type === "job") {
      return JOB_STATUS_COLORS[status];
    } else if (type === "user") {
      return USER_STATUS_COLORS[status] || "bg-gray-100 text-gray-800";
    }
    return "bg-gray-100 text-gray-800";
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getColorClass()} ${className}`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
