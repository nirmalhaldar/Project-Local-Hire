import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { HardHat, Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const roles = [
  {
    id: "worker" as const,
    icon: HardHat,
    title: "Worker",
    desc: "Find nearby jobs, build your skill profile, and apply with a single click.",
    cta: "Continue as Worker",
  },
  {
    id: "employer" as const,
    icon: Building2,
    title: "Employer",
    desc: "Post jobs, find verified workers nearby, and hire within minutes.",
    cta: "Continue as Employer",
  },
];

const RoleSelectionPage = () => {
  const { user, loading, userRole, setRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (userRole === "worker") navigate("/dashboard/worker");
    if (userRole === "employer") navigate("/dashboard/employer");
  }, [userRole, navigate]);

  const handleSelect = async (role: "worker" | "employer") => {
    await setRole(role);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-lg">L</span>
            </div>
            <span className="font-display font-bold text-xl text-foreground">
              Local<span className="text-primary">Hire</span>
            </span>
          </div>
          <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-3">
            Choose Your Role
          </h1>
          <p className="text-muted-foreground text-lg">
            How would you like to use LocalHire?
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((role, i) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="group bg-card rounded-2xl border-2 border-border hover:border-primary/50 p-8 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-xl"
              onClick={() => handleSelect(role.id)}
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <role.icon size={32} className="text-primary" />
              </div>
              <h2 className="font-display font-bold text-2xl text-foreground mb-3">
                {role.title}
              </h2>
              <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                {role.desc}
              </p>
              <Button variant="hero" className="w-full group-hover:shadow-lg">
                {role.cta}
                <ArrowRight size={16} />
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionPage;
