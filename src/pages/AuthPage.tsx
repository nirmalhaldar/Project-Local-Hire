import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Eye, EyeOff, HardHat, Building2, MailCheck } from "lucide-react";

const AuthPage = () => {
  const { signUp, signIn, user, loading, userRole } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const mode = searchParams.get("mode") || "login";
  const roleParam = searchParams.get("role") as "worker" | "employer" | null;

  const [isSignUp, setIsSignUp] = useState(mode === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (!loading && user && userRole) {
      if (userRole === "worker") navigate("/dashboard/worker");
      else if (userRole === "employer") navigate("/dashboard/employer");
    }
  }, [user, loading, userRole, navigate]);

  // If signup mode but no role, redirect to role selection
  useEffect(() => {
    if (isSignUp && !roleParam) {
      navigate("/role-selection");
    }
  }, [isSignUp, roleParam, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (isSignUp) {
      if (!roleParam) {
        setError("Please select a role first.");
        setSubmitting(false);
        return;
      }
      if (!fullName.trim()) {
        setError("Please enter your full name.");
        setSubmitting(false);
        return;
      }
      const { error } = await signUp(email, password, roleParam, fullName.trim());
      if (error) {
        setError(error);
      } else {
        setEmailSent(true);
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    }

    setSubmitting(false);
  };

  const roleInfo = roleParam === "worker"
    ? { icon: HardHat, label: "Worker", color: "text-primary" }
    : roleParam === "employer"
    ? { icon: Building2, label: "Employer", color: "text-primary" }
    : null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="bg-card rounded-2xl border border-border shadow-xl p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-xl">L</span>
            </div>
            <span className="font-display font-bold text-2xl text-foreground">
              Local<span className="text-primary">Hire</span>
            </span>
          </div>

          {/* Email confirmation sent screen */}
          {emailSent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MailCheck className="text-primary" size={32} />
              </div>
              <h2 className="font-display font-bold text-xl text-foreground mb-2">
                Check your email
              </h2>
              <p className="text-muted-foreground text-sm mb-4">
                We've sent a confirmation link to<br />
                <span className="font-medium text-foreground">{email}</span>
              </p>
              <p className="text-muted-foreground text-xs mb-6">
                Click the link in the email to verify your account. Check your spam folder if you don't see it.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setEmailSent(false);
                  setIsSignUp(false);
                  setError(null);
                  navigate("/auth?mode=login", { replace: true });
                }}
              >
                Back to Sign In
              </Button>
            </div>
          ) : (
            <>

          {/* Role badge for signup */}
          {isSignUp && roleInfo && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-medium">
                <roleInfo.icon size={14} />
                Signing up as {roleInfo.label}
              </div>
            </div>
          )}

          <h1 className="font-display font-bold text-2xl text-foreground mb-1 text-center">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="text-muted-foreground text-sm mb-6 text-center">
            {isSignUp
              ? "Fill in your details to get started."
              : "Sign in to your account."}
          </p>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name</label>
                <Input
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {isSignUp ? (
              <>
                Already have an account?{" "}
                <button
                  className="text-primary font-medium hover:underline"
                  onClick={() => {
                    setIsSignUp(false);
                    setError(null);
                    navigate("/auth?mode=login", { replace: true });
                  }}
                >
                  Sign In
                </button>
              </>
            ) : (
              <>
                Don't have an account?{" "}
                <button
                  className="text-primary font-medium hover:underline"
                  onClick={() => {
                    navigate("/role-selection");
                  }}
                >
                  Sign Up
                </button>
              </>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground">
            <Shield size={14} />
            Secure & encrypted
          </div>
          </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
