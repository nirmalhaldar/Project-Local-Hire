import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";

const AuthPage = () => {
  const { signInWithGoogle, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/role-selection");
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="bg-card rounded-2xl border border-border shadow-xl p-8 text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-xl">L</span>
            </div>
            <span className="font-display font-bold text-2xl text-foreground">
              Local<span className="text-primary">Hire</span>
            </span>
          </div>

          <h1 className="font-display font-bold text-2xl text-foreground mb-2">
            Welcome to LocalHire
          </h1>
          <p className="text-muted-foreground text-sm mb-8">
            Sign in to find jobs or hire workers near you.
          </p>

          {/* Google Sign In Button */}
          <Button
            variant="outline"
            size="xl"
            className="w-full gap-3 border-border hover:border-primary/40"
            onClick={signInWithGoogle}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </Button>

          <div className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground">
            <Shield size={14} />
            Secure & encrypted login
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
