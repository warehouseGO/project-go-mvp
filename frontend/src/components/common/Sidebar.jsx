import React from "react";
import { Link, useLocation, useMatch } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ROLES } from "../../utils/constants";

const Sidebar = () => {
  const { hasRole } = useAuth();
  const location = useLocation();
  const matchSiteDetails = useMatch("/sites/:siteId");
  const matchSiteAnalytics = useMatch("/sites/:siteId/analytics");

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      roles: [
        ROLES.OWNER,
        ROLES.SITE_INCHARGE,
        ROLES.SITE_SUPERVISOR,
        ROLES.CLUSTER_SUPERVISOR,
      ],
    },
    {
      name: "Devices",
      href: "/devices",
      roles: [ROLES.SITE_INCHARGE],
    },

    {
      name: "Users",
      href: "/users",
      roles: [ROLES.OWNER, ROLES.SITE_INCHARGE, ROLES.SITE_SUPERVISOR],
    },
  ];

  const filteredNavigation = navigation.filter((item) =>
    item.roles.some((role) => hasRole(role))
  );

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 min-h-screen">
      <nav className="mt-8">
        <div className="px-4 space-y-1">
          {filteredNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  isActive
                    ? "bg-primary-100 text-primary-700 border-r-2 border-primary-500"
                    : "text-gray-700 hover:bg-gray-100"
                } group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200`}
              >
                {item.name}
              </Link>
            );
          })}
          {/* Resource Management (Owner and Site In-Charge) */}
          {(hasRole(ROLES.OWNER) || hasRole(ROLES.SITE_INCHARGE)) && (
            <Link
              to="/resources"
              className={`${
                location.pathname.startsWith("/resources")
                  ? "bg-primary-100 text-primary-700 border-r-2 border-primary-500"
                  : "text-gray-700 hover:bg-gray-100"
              } group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200`}
            >
              Resources
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
