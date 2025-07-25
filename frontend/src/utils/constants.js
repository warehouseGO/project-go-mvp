export const ROLES = {
  OWNER: "OWNER",
  SITE_INCHARGE: "SITE_INCHARGE",
  SITE_SUPERVISOR: "SITE_SUPERVISOR",
  CLUSTER_SUPERVISOR: "CLUSTER_SUPERVISOR",
};

export const USER_STATUS = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
};

export const JOB_STATUS = {
  COMPLETED: "COMPLETED",
  IN_PROGRESS: "IN_PROGRESS",
  CONSTRAINT: "CONSTRAINT",
};

export const JOB_STATUS_COLORS = {
  [JOB_STATUS.COMPLETED]: "bg-success-100 text-success-800",
  [JOB_STATUS.IN_PROGRESS]: "bg-primary-100 text-primary-800",
  [JOB_STATUS.CONSTRAINT]: "bg-warning-100 text-warning-800",
};

export const USER_STATUS_COLORS = {
  [USER_STATUS.PENDING]: "bg-yellow-100 text-yellow-800",
  [USER_STATUS.ACTIVE]: "bg-success-100 text-success-800",
  [USER_STATUS.INACTIVE]: "bg-gray-100 text-gray-800",
};

export const DEVICE_TYPES = ["Heat Exchanger", "Vessel", "Column"];

export const DEVICE_SUBTYPES = ["Floating", "Fixed", "Portable", "Stationary"];
