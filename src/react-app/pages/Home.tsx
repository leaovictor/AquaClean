import { Link } from "react-router-dom";
import { Car, Sparkles, Shield, Clock, ChevronRight } from "lucide-react";
import { useAuth } from "@/react-app/AuthContext";

export default function Home() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 flex items-center justify-center">
        <div className="animate-pulse text-blue-600">
          <Car className="w-12 h-12" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-2 rounded-xl">
                <Car className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                AquaClean Pro
              </h1>
            </div>
            <Link
              to="/signin"
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-2 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Premium Car Wash
            <span className="block bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              On Your Schedule
            </span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Experience the convenience of professional car washing with flexible scheduling,
            subscription plans, and premium service quality.
          </p>
          <Link
            to="/signup"
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-200 shadow-xl hover:shadow-2xl group"
          >
            Get Started Today
            <ChevronRight className="w-5 h-5 inline ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose AquaClean Pro?
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-blue-100">
              <div className="bg-gradient-to-r from-blue-100 to-cyan-100 p-3 rounded-xl w-fit mb-4">
                <Sparkles className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">
                Premium Quality
              </h4>
              <p className="text-gray-600">
                Professional-grade equipment and eco-friendly products ensure your car gets the best care possible.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-blue-100">
              <div className="bg-gradient-to-r from-blue-100 to-cyan-100 p-3 rounded-xl w-fit mb-4">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">
                Flexible Scheduling
              </h4>
              <p className="text-gray-600">
                Book appointments that fit your schedule. Easy online booking with instant confirmation.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-blue-100">
              <div className="bg-gradient-to-r from-blue-100 to-cyan-100 p-3 rounded-xl w-fit mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">
                Subscription Plans
              </h4>
              <p className="text-gray-600">
                Save money with our flexible subscription plans. More washes, better value, priority booking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-cyan-600">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h3>
          <p className="text-blue-100 mb-8 text-lg">
            Join thousands of satisfied customers who trust AquaClean Pro for their car care needs.
          </p>
          <Link
            to="/signup"
            className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-200 shadow-xl hover:shadow-2xl"
          >
            Sign Up Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-2 rounded-xl">
              <Car className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-xl font-bold">AquaClean Pro</h4>
          </div>
          <p className="text-gray-400">
            Premium car wash scheduling and subscription service
          </p>
        </div>
      </footer>
    </div>
  );
}
