import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthContextProvider, useAuth } from "@/react-app/AuthContext"; // Import AuthContextProvider and useAuth
import HomePage from "@/react-app/pages/Home";
import AuthCallbackPage from "@/react-app/pages/AuthCallback";
import DashboardPage from "@/react-app/pages/Dashboard";
import BookingPage from "@/react-app/pages/Booking";
import ProfilePage from "@/react-app/pages/Profile";
import SubscriptionPage from "@/react-app/pages/Subscription";
import AdminDashboardPage from "@/react-app/pages/admin/Dashboard";
import AdminAppointmentsPage from "@/react-app/pages/admin/Appointments";
import AdminCustomersPage from "@/react-app/pages/admin/Customers";
import AdminPlansPage from "@/react-app/pages/admin/Plans";
import AdminReportsPage from "@/react-app/pages/admin/Reports";
import AdminTimeSlotManagerPage from "@/react-app/pages/admin/TimeSlotManager";
import AdminAssetsPage from "@/react-app/pages/admin/Assets"; // Importar o novo componente
import SignIn from "@/react-app/pages/SignIn"; // Import SignIn component
import SignUp from "@/react-app/pages/SignUp"; // Import SignUp component
import AdminProtectedRoute from "@/react-app/components/AdminProtectedRoute";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>; // Or a spinner
  }

  if (!currentUser) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthContextProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/signin" element={<SignIn />} /> {/* Add SignIn route */}
          <Route path="/signup" element={<SignUp />} /> {/* Add SignUp route */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/booking"
            element={
              <ProtectedRoute>
                <BookingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subscription"
            element={
              <ProtectedRoute>
                <SubscriptionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminDashboardPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <AdminProtectedRoute>
                <AdminDashboardPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/appointments"
            element={
              <AdminProtectedRoute>
                <AdminAppointmentsPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/customers"
            element={
              <AdminProtectedRoute>
                <AdminCustomersPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/plans"
            element={
              <AdminProtectedRoute>
                <AdminPlansPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <AdminProtectedRoute>
                <AdminReportsPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/time-slot-manager"
            element={
              <AdminProtectedRoute>
                <AdminTimeSlotManagerPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/assets"
            element={
              <AdminProtectedRoute>
                <AdminAssetsPage />
              </AdminProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthContextProvider>
  );
}