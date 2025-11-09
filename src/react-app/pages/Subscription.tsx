import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import Navigation from "@/react-app/components/Navigation";
import { CreditCard, Check, Star, Calendar, AlertCircle } from "lucide-react";
import type { SubscriptionPlan, UserSubscription } from "@/shared/types";
import { useAuth } from "@/react-app/AuthContext"; // New Firebase AuthContext

export default function Subscription() {
  const { currentUser, loading } = useAuth(); // Use currentUser and loading from new context
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription] = useState<UserSubscription | null>(null);
  const [dataLoading, setDataLoading] = useState(true); // Renamed to avoid conflict with auth loading
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!currentUser && !loading) { // Use currentUser and loading
      navigate("/");
      return;
    }

    if (currentUser) { // Use currentUser
      fetchData();
    }
  }, [currentUser, loading, navigate]); // Update dependencies

  const fetchData = async () => {
    try {
      const plansResponse = await fetch("/api/subscription-plans");
      
      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        setPlans(plansData);
      }

      // TODO: Fetch current subscription when implemented
      // const subscriptionResponse = await fetch("/api/subscription");
      // if (subscriptionResponse.ok) {
      //   const subscriptionData = await subscriptionResponse.json();
      //   setCurrentSubscription(subscriptionData);
      // }
    } catch (error) {
      console.error("Error fetching subscription data:", error);
      setMessage({ type: 'error', text: 'Failed to load subscription data' });
    } finally {
      setDataLoading(false); // Use dataLoading
    }
  };

  const handleSelectPlan = async () => {
    setMessage({ type: 'success', text: 'Subscription feature coming soon! For now, you can book individual appointments.' });
    
    // TODO: Implement Stripe integration
    // try {
    //   const response = await fetch("/api/subscriptions", {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON_STRINGIFY({ plan_id: planId }),
    //   });

    //   if (response.ok) {
    //     const { checkout_url } = await response.json();
    //     window.location.href = checkout_url;
    //   } else {
    //     const errorData = await response.json();
    //     setMessage({ type: 'error', text: errorData.error || 'Failed to create subscription' });
    //   }
    // } catch (error) {
    //   console.error("Error creating subscription:", error);
    //   setMessage({ type: 'error', text: 'Failed to create subscription' });
    // }
  };

  if (loading || dataLoading) { // Use combined loading states
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 flex items-center justify-center">
        <div className="animate-pulse text-blue-600">
          <CreditCard className="w-12 h-12" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Save money with our flexible subscription plans. More washes, better value, and priority booking.
          </p>
        </div>

        {message && (
          <div className={`mb-8 p-4 rounded-xl flex items-center justify-center space-x-2 max-w-2xl mx-auto ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <AlertCircle className={`w-5 h-5 ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`} />
            <span className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </span>
          </div>
        )}

        {/* Current Subscription */}
        {currentSubscription && (
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Subscription</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  {/* Plan name would come from joined data */}
                  Active Plan
                </p>
                <p className="text-gray-600 text-sm">
                  {currentSubscription.remaining_washes} washes remaining
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Next billing</p>
                <p className="font-medium text-gray-900">
                  {currentSubscription.current_period_end 
                    ? new Date(currentSubscription.current_period_end).toLocaleDateString()
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Plans */}
        <div className="grid lg:grid-cols-3 gap-8">
          {plans.map((plan, index) => {
            const isPopular = index === 1; // Middle plan is popular
            
            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-xl border transition-all duration-200 hover:shadow-2xl ${
                  isPopular 
                    ? "border-blue-600 scale-105 z-10" 
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-1">
                      <Star className="w-4 h-4" />
                      <span>Most Popular</span>
                    </div>
                  </div>
                )}

                <div className="p-8">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {plan.description}
                    </p>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900">
                        ${plan.price}
                      </span>
                      <span className="text-gray-600">/month</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2 text-blue-600">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {plan.washes_per_month} washes per month
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center space-x-3">
                        <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-green-600" />
                        </div>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSelectPlan()}
                    className={`w-full py-4 rounded-xl font-semibold transition-all duration-200 ${
                      isPopular
                        ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {currentSubscription?.plan_id === plan.id 
                      ? "Current Plan" 
                      : "Select Plan"
                    }
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pay-Per-Wash Option */}
        <div className="mt-12 bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Prefer Pay-Per-Wash?
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Not ready for a subscription? You can always book individual car washes 
            at our standard rates without any commitment.
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">$15</div>
              <div className="text-gray-600">Basic Wash</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">$25</div>
              <div className="text-gray-600">Premium Wash</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">$45</div>
              <div className="text-gray-600">Deluxe Detail</div>
            </div>
          </div>
          <button
            onClick={() => navigate("/booking")}
            className="mt-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200"
          >
            Book Single Wash
          </button>
        </div>

        {/* Subscription Benefits */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-8 text-white">
          <h3 className="text-2xl font-bold text-center mb-8">
            Why Choose a Subscription?
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Save Money</h4>
              <p className="text-blue-100">
                Get up to 40% off compared to individual wash pricing
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Priority Booking</h4>
              <p className="text-blue-100">
                Skip the wait with priority access to time slots
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-semibold mb-2">No Commitment</h4>
              <p className="text-blue-100">
                Cancel anytime with no hidden fees or penalties
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
