import React from "react";
import {
  DEVICE_PRIORITY,
  DEVICE_PRIORITY_COLORS,
  DEVICE_PRIORITY_ICONS,
} from "../../utils/constants";

const PriorityBadge = ({ priority, showIcon = true, size = "sm" }) => {
  if (!priority || !DEVICE_PRIORITY_COLORS[priority]) {
    return null;
  }

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${DEVICE_PRIORITY_COLORS[priority]} ${sizeClasses[size]}`}
    >
      {showIcon && <span>{DEVICE_PRIORITY_ICONS[priority]}</span>}
      <span>{priority}</span>
    </span>
  );
};

export default PriorityBadge;
