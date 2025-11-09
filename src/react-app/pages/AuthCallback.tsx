import { useEffect } from "react";
import { useNavigate } from "react-router";
import { getRedirectResult, GoogleAuthProvider } from "firebase/auth"; // Import Firebase Auth functions
import { useAuth } from "@/react-app/AuthContext"; // Import our new useAuth hook
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { auth } = useAuth(); // Get auth instance from our context

  useEffect(() => {
    const handleRedirectResult = async () => {
      if (!auth) {
        console.log("Firebase Auth object not available yet.");
        return;
      }
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          // User successfully signed in with a redirect
          // You can access user info via result.user
          console.log("Firebase sign-in successful:", result.user);
          navigate("/dashboard");
        } else {
          // No redirect result, possibly direct navigation to this page or an error
          console.log("No Firebase redirect result found.");
          // If the user somehow lands here without a redirect result,
          // it might indicate an error or direct access.
          // You might want to redirect them to home or login.
          navigate("/?error=no_redirect_result");
        }
      } catch (error: any) {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        // The email of the user's account used.
        const email = error.customData?.email;
        // The AuthCredential type that was used.
        const credential = GoogleAuthProvider.credentialFromError(error);
        console.error("Firebase authentication failed:", errorMessage, errorCode, email, credential);
        navigate("/?error=auth_failed");
      }
    };

    handleRedirectResult();
  }, [auth, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="animate-spin mx-auto mb-4">
          <Loader2 className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Completing Sign In
        </h2>
        <p className="text-gray-600">
          Please wait while we set up your account...
        </p>
      </div>
    </div>
  );
}
