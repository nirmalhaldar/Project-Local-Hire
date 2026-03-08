import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, MailCheck, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="bg-card rounded-2xl border border-border shadow-xl p-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-xl">L</span>
            </div>
            <span className="font-display font-bold text-2xl text-foreground">
              Local<span className="text-primary">Hire</span>
            </span>
          </div>

          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MailCheck className="text-primary" size={32} />
              </div>
              <h2 className="font-display font-bold text-xl text-foreground mb-2">
                Check your email
              </h2>
              <p className="text-muted-foreground text-sm mb-4">
                We've sent a password reset link to<br />
                <span className="font-medium text-foreground">{email}</span>
              </p>
              <p className="text-muted-foreground text-xs mb-6">
                Click the link in the email to reset your password. Check your spam folder if you don't see it.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/auth?mode=login")}
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Sign In
              </Button>
            </div>
          ) : (
            <>
              <h1 className="font-display font-bold text-2xl text-foreground mb-1 text-center">
                Forgot Password
              </h1>
              <p className="text-muted-foreground text-sm mb-6 text-center">
                Enter your email and we'll send you a reset link.
              </p>

              {error && (
                <div className="bg-destructive/10 text-destructive text-sm rounded-lg px-4 py-3 mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
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
                <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                  {submitting ? "Please wait..." : "Send Reset Link"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button
                  className="text-sm text-primary font-medium hover:underline"
                  onClick={() => navigate("/auth?mode=login")}
                >
                  <ArrowLeft size={14} className="inline mr-1" />
                  Back to Sign In
                </button>
              </div>
            </>
          )}

          <div className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground">
            <Shield size={14} />
            Secure & encrypted
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
