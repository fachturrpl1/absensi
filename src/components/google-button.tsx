"use client";

import { useState } from "react";
import { siGoogle } from "simple-icons";
import { SimpleIcon } from "@/components/simple-icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { signInWithGoogle } from "@/action/users";

export function GoogleButton({ className, ...props }: React.ComponentProps<typeof Button>) {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      
      if (result.error) {
        console.error("Google OAuth error:", result.error);
        alert(`Error: ${result.error}`);
        setLoading(false);
        return;
      }
      
      if (result.url) {
        console.log("Redirecting to:", result.url);
        window.location.href = result.url;
      } else {
        console.error("No OAuth URL returned");
        alert("Failed to initialize Google login. Please try again.");
        setLoading(false);
      }
    } catch (error) {
      console.error("Google sign in error:", error);
      alert("An unexpected error occurred. Check console for details.");
      setLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      className={cn(className)} 
      onClick={handleGoogleSignIn}
      disabled={loading}
      type="button"
      {...props}
    >
      <SimpleIcon icon={siGoogle} className="size-4" />
      {loading ? "Connecting..." : "Continue with Google"}
    </Button>
  );
}
