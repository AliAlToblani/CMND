
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center p-4 text-center">
      <div className="mb-4 text-6xl font-bold">404</div>
      <h1 className="mb-2 text-2xl font-bold">Page Not Found</h1>
      <p className="mb-8 max-w-md text-muted-foreground">
        The page you're looking for doesn't exist or has been moved. Please check
        the URL or navigate back to the dashboard.
      </p>
      <Button asChild>
        <Link to="/" className="flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>
    </div>
  );
};

export default NotFound;
