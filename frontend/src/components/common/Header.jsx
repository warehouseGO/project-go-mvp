import React from "react";
import { useAuth } from "../../context/AuthContext";
import { ROLES } from "../../utils/constants";
import logo from "../../assets/image.png";

const Header = () => {
  const { user, logout, getUserRole } = useAuth();

  const getRoleDisplayName = (role) => {
    const roleNames = {
      [ROLES.OWNER]: "Owner",
      [ROLES.SITE_INCHARGE]: "Site In-Charge",
      [ROLES.SITE_SUPERVISOR]: "Site Supervisor",
      [ROLES.CLUSTER_SUPERVISOR]: "Cluster Supervisor",
    };
    return roleNames[role] || role;
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <img
              src={logo}
              alt="Warehouse Management Logo"
              className="h-10 w-auto mr-2"
            />
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                <span className="font-medium">{user.name}</span>
                <span className="mx-2">•</span>
                <span className="text-gray-500">
                  {getRoleDisplayName(getUserRole())}
                </span>
              </div>
              <button onClick={logout} className="btn-secondary text-sm">
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
