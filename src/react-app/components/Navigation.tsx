import { useNavigate, useLocation, Link } from "react-router-dom";
import { Car, Calendar, User, CreditCard, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/react-app/AuthContext";
import NotificationBell from "./NotificationBell";
import { supabase } from "@/lib/supabaseClient"; // Import supabase client

export default function Navigation() {
  const { currentUser } = useAuth(); // Remove 'auth' from destructuring
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut(); // Use Supabase signOut
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const navItems = [
    { path: "/dashboard", icon: Calendar, label: "Painel" },
    { path: "/booking", icon: Car, label: "Agendar Lavagem" },
    { path: "/subscription", icon: CreditCard, label: "Assinatura" },
    { path: "/profile", icon: User, label: "Perfil" },
  ];

  const isSubscriber = currentUser?.profile?.subscription_status === 'active';

  const theme = {
    nav: isSubscriber ? "bg-slate-900/95 border-yellow-500/20" : "bg-white/80 border-blue-100",
    text: isSubscriber ? "text-white" : "text-gray-700",
    logoBg: isSubscriber ? "bg-gradient-to-r from-yellow-500 to-amber-600" : "bg-gradient-to-r from-blue-600 to-cyan-600",
    logoText: isSubscriber ? "bg-gradient-to-r from-yellow-500 to-amber-600" : "bg-gradient-to-r from-blue-600 to-cyan-600",
    buttonActive: isSubscriber ? "bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-900 shadow-lg shadow-yellow-500/20" : "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg",
    buttonInactive: isSubscriber ? "text-gray-300 hover:bg-slate-800 hover:text-yellow-400" : "text-gray-600 hover:bg-blue-50 hover:text-blue-600",
    menuBg: isSubscriber ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100",
    menuItem: isSubscriber ? "text-gray-300 hover:bg-slate-700 hover:text-yellow-400" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600",
    iconColor: isSubscriber ? "text-yellow-400" : "text-blue-600"
  };

  return (
    <nav className={`${theme.nav} backdrop-blur-sm border-b sticky top-0 z-50 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/dashboard"
            className="flex items-center space-x-2 cursor-pointer group"
          >
            <div className={`${theme.logoBg} p-2 rounded-xl transition-all duration-300 group-hover:scale-105`}>
              <Car className={`w-6 h-6 ${isSubscriber ? 'text-slate-900' : 'text-white'}`} />
            </div>
            <h1 className={`text-xl font-bold ${theme.logoText} bg-clip-text text-transparent`}>
              AquaClean Pro
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map(({ path, icon: Icon, label }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${location.pathname === path
                  ? theme.buttonActive
                  : theme.buttonInactive
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <NotificationBell />

            <div className="relative">
              <button
                onClick={() => {
                  setIsUserMenuOpen(!isUserMenuOpen);
                  setIsMobileMenuOpen(false); // Close mobile menu if open
                }}
                className={`flex items-center space-x-2 p-2 rounded-xl transition-all duration-200 ${theme.buttonInactive}`}
              >
                {currentUser?.user_metadata?.avatar_url ? (
                  <img
                    src={currentUser.user_metadata.avatar_url}
                    alt="Profile"
                    className="w-8 h-8 rounded-full border-2 border-transparent hover:border-current transition-colors"
                  />
                ) : (
                  <div className={`w-8 h-8 ${theme.logoBg} rounded-full flex items-center justify-center`}>
                    <User className={`w-4 h-4 ${isSubscriber ? 'text-slate-900' : 'text-white'}`} />
                  </div>
                )}
                <span className={`hidden sm:block font-medium ${theme.text}`}>
                  {currentUser?.user_metadata?.full_name || currentUser?.email}
                </span>
              </button>

              {isUserMenuOpen && (
                <div className={`absolute right-0 mt-2 w-48 ${theme.menuBg} rounded-xl shadow-xl border py-2 z-50`}>
                  <button
                    onClick={() => {
                      navigate("/profile");
                      setIsUserMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-2 px-4 py-2 transition-colors ${theme.menuItem}`}
                  >
                    <User className="w-4 h-4" />
                    <span>Perfil</span>
                  </button>
                  {currentUser?.profile?.role === 'admin' && (
                    <>
                      <div className={`border-t my-1 ${isSubscriber ? 'border-slate-700' : 'border-gray-100'}`}></div>
                      <button
                        onClick={() => {
                          navigate("/admin");
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-purple-600 hover:bg-purple-50 transition-colors"
                      >
                        <Car className="w-4 h-4" />
                        <span>Painel Administrativo</span>
                      </button>
                    </>
                  )}
                  <div className={`border-t my-1 ${isSubscriber ? 'border-slate-700' : 'border-gray-100'}`}></div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => {
              setIsMobileMenuOpen(!isMobileMenuOpen);
              setIsUserMenuOpen(false); // Close user menu if open
            }}
            className={`lg:hidden p-2 rounded-xl transition-all duration-200 ${theme.buttonInactive}`}
          >
            <div className="w-6 h-6 flex flex-col justify-center space-y-1">
              <div className={`w-full h-0.5 rounded ${isSubscriber ? 'bg-gray-300' : 'bg-gray-600'}`}></div>
              <div className={`w-full h-0.5 rounded ${isSubscriber ? 'bg-gray-300' : 'bg-gray-600'}`}></div>
              <div className={`w-full h-0.5 rounded ${isSubscriber ? 'bg-gray-300' : 'bg-gray-600'}`}></div>
            </div>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className={`lg:hidden border-t py-4 ${isSubscriber ? 'border-slate-700' : 'border-blue-100'}`}>
            <div className="space-y-2">
              {navItems.map(({ path, icon: Icon, label }) => (
                <button
                  key={path}
                  onClick={() => {
                    navigate(path);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${location.pathname === path
                    ? theme.buttonActive
                    : theme.buttonInactive
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </button>
              ))}

              <div className={`border-t my-2 ${isSubscriber ? 'border-slate-700' : 'border-gray-100'}`}></div>

              <button
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-5 h-5" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
