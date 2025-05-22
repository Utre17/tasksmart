import React from 'react';
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { ExternalLink } from 'lucide-react';

export function DirectLoginLink() {
  const { loginWithGoogleRedirect } = useAuth();
  
  const handleDirectRedirect = (e: React.MouseEvent) => {
    e.preventDefault();
    loginWithGoogleRedirect();
  };
  
  return (
    <div className="mt-4 text-center">
      <p className="text-sm text-gray-500 mb-2">
        Having trouble with Google login? Try the direct method:
      </p>
      <Button 
        variant="outline" 
        className="text-xs flex items-center text-blue-600 hover:text-blue-800 border-blue-200"
        onClick={handleDirectRedirect}
      >
        <ExternalLink size={14} className="mr-1" />
        Use Google Redirect Method
      </Button>
    </div>
  );
} 