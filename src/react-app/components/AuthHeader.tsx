import { Link } from "react-router-dom";
import { Car } from "lucide-react";

interface AuthHeaderProps {
  linkTo: string;
  linkText: string;
}

export default function AuthHeader({ linkTo, linkText }: AuthHeaderProps) {
  return (
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
            to={linkTo}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-2 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {linkText}
          </Link>
        </div>
      </div>
    </header>
  );
}
