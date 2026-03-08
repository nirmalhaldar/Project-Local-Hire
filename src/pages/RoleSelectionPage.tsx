import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { HardHat, Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const roles = [
  {
    id: "worker" as const,
    icon: HardHat,
    title: "Worker",
    desc: "Find nearby jobs, build your skill profile, and apply with a single click.",
    cta: "Sign up as Worker",
  },
  {
    id: "employer" as const,
    icon: Building2,
    title: "Employer",
    desc: "Post jobs, find verified workers nearby, and hire within minutes.",
    cta: "Sign up as Employer",
  },
];

const RoleSelectionPage = () => {
  const navigate = useNavigate();

  const handleSelect = (role: "worker" | "employer") => {
    navigate(`/auth?mode=signup&role=${role}`);
  };

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
            Select how you want to use LocalHire, then create your account.
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

        <div className="text-center mt-8 text-sm text-muted-foreground">
          Already have an account?{" "}
          <button
            className="text-primary font-medium hover:underline"
            onClick={() => navigate("/auth?mode=login")}
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionPage;
