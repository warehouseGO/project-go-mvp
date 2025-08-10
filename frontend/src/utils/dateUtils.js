// Date utility functions for device management

export const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toLocaleDateString();
};

export const isDelayed = (targetDate, jobStatuses) => {
  if (!targetDate) return false;

  const today = new Date();
  const target = new Date(targetDate);
  const isPastDue = today > target;
  const isCompleted = jobStatuses?.every((status) => status === "COMPLETED");

  return isPastDue && !isCompleted;
};

export const getDaysRemaining = (targetDate) => {
  if (!targetDate) return null;

  const today = new Date();
  const target = new Date(targetDate);
  const diffTime = target - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

export const getDelayStatus = (targetDate, jobStatuses) => {
  if (!targetDate) return null;

  const daysRemaining = getDaysRemaining(targetDate);
  const isDelayed = isDelayed(targetDate, jobStatuses);

  if (isDelayed) {
    return {
      status: "DELAYED",
      days: Math.abs(daysRemaining),
      color: "text-red-600",
      bgColor: "bg-red-100",
    };
  }

  if (daysRemaining <= 7 && daysRemaining > 0) {
    return {
      status: "URGENT",
      days: daysRemaining,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    };
  }

  if (daysRemaining <= 0) {
    return {
      status: "OVERDUE",
      days: Math.abs(daysRemaining),
      color: "text-red-600",
      bgColor: "bg-red-100",
    };
  }

  return {
    status: "ON_TRACK",
    days: daysRemaining,
    color: "text-green-600",
    bgColor: "bg-green-100",
  };
};
