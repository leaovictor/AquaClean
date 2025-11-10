import { useNavigate, useLocation } from "react-router";
import { Car, BarChart3, Calendar, Users, CreditCard, FileText, LogOut, Settings, Bell, Clock } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/react-app/AuthContext"; // New Firebase AuthContext
import { signOut } from "firebase/auth"; // Import signOut from firebase/auth

export default function AdminNavigation() {
  const { currentUser, auth } = useAuth(); // Use currentUser and auth from new context
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth); // Use Firebase signOut
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const navItems = [
    { path: "/admin/dashboard", icon: BarChart3, label: "Dashboard" },
    { path: "/admin/appointments", icon: Calendar, label: "Appointments" },
    { path: "/admin/availability", icon: Clock, label: "Availability" },
    { path: "/admin/customers", icon: Users, label: "Customers" },
    { path: "/admin/plans", icon: CreditCard, label: "Plans" },
    { path: "/admin/reports", icon: FileText, label: "Reports" },
  ];

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => navigate("/admin/dashboard")}
          >
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-2 rounded-xl">
              <Car className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                AquaClean Pro
              </h1>
              <span className="text-xs text-gray-400">Admin Panel</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map(({ path, icon: Icon, label }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                  location.pathname === path
                    ? "bg-gray-800 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <button className="relative p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl transition-all duration-200">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                3
              </span>
            </button>
            
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-2 p-2 rounded-xl hover:bg-gray-800 transition-all duration-200"
              >
                {currentUser?.photoURL ? ( // Use currentUser.photoURL
                  <img
                    src={currentUser.photoURL}
                    alt="Profile"
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center">
                    <Settings className="w-4 h-4 text-white" />
                  </div>
                )}
                <span className="hidden sm:block font-medium text-gray-300">
                  {currentUser?.displayName || 'Admin'} {/* Use currentUser.displayName */}
                </span>
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-xl shadow-xl border border-gray-700 py-2 z-50">
                  <button
                    onClick={() => {
                      navigate("/");
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                  >
                    <Car className="w-4 h-4" />
                    <span>Customer View</span>
                  </button>
                  <div className="border-t border-gray-700 my-1"></div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-red-400 hover:bg-gray-700 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-xl hover:bg-gray-800 transition-all duration-200"
          >
            <div className="w-6 h-6 flex flex-col justify-center space-y-1">
              <div className="w-full h-0.5 bg-gray-300 rounded"></div>
              <div className="w-full h-0.5 bg-gray-300 rounded"></div>
              <div className="w-full h-0.5 bg-gray-300 rounded"></div>
            </div>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-800 py-4">
            <div className="space-y-2">
              {navItems.map(({ path, icon: Icon, label }) => (
                <button
                  key={path}
                  onClick={() => {
                    navigate(path);
                    setIsMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    location.pathname === path
                      ? "bg-gray-800 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
