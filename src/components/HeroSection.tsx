import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { user, userRole } = useAuth();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/browse-jobs?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/browse-jobs");
    }
  };

  const handleFindJobs = () => {
    navigate("/browse-jobs");
  };

  const handlePostJob = () => {
    if (user && userRole === "employer") {
      navigate("/dashboard/employer/post-job");
    } else if (user) {
      toast({ title: "Employer Account Required", description: "Only employers can post jobs. Please log in with an employer account.", variant: "destructive" });
    } else {
      navigate("/auth?mode=login");
    }
  };

  return (
    <section className="relative overflow-hidden bg-background py-20 md:py-32">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 bg-amber-light text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            Hyperlocal Job Matching
          </div>

          <h1 className="font-display font-extrabold text-4xl md:text-6xl lg:text-7xl text-foreground leading-tight mb-6">
            Find Jobs Near You.{" "}
            <span className="text-primary">Hire Within Minutes.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            LocalHire connects blue-collar workers with nearby employers using AI-powered matching. No resumes needed — just your skills.
          </p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-card rounded-2xl shadow-xl border border-border p-3 max-w-2xl mx-auto mb-8"
          >
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex items-center gap-3 flex-1 bg-muted rounded-xl px-4 py-3">
                <Search size={18} className="text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Search role, skill, or job title..."
                  className="bg-transparent w-full text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
              </div>
              <Button variant="hero" size="lg" className="shrink-0" onClick={handleSearch}>
                <Search size={18} />
                Search
              </Button>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="xl" onClick={handleFindJobs}>Find Jobs</Button>
            <Button variant="heroOutline" size="xl" onClick={handlePostJob}>Post a Job</Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
