import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();

  const dashboardPath = userRole === "admin" ? "/dashboard/admin" : userRole === "employer" ? "/dashboard/employer" : "/dashboard/worker";

  const handleNavClick = (href: string, label: string) => {
    if (label === "Post Jobs") {
      if (user && userRole === "employer") {
        navigate("/dashboard/employer/post-job");
      } else if (user) {
        toast({ title: "Employer Account Required", description: "Only employers can post jobs.", variant: "destructive" });
      } else {
        navigate("/auth?mode=login");
      }
    } else if (href.startsWith("#")) {
      // Hash link — stay on page
      window.location.hash = href;
    } else {
      navigate(href);
    }
    setMobileOpen(false);
  };

  const navLinks = [
    { label: "Browse Jobs", href: "/browse-jobs" },
    { label: "Post Jobs", href: "#" },
    { label: "Categories", href: "#categories" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <a href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-display font-bold text-lg">L</span>
          </div>
          <span className="font-display font-bold text-xl text-foreground">
            Local<span className="text-primary">Hire</span>
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => handleNavClick(link.href, link.label)}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate(dashboardPath)}>Dashboard</Button>
              <Button variant="outline" size="sm" onClick={signOut}>Sign Out</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/auth?mode=login")}>Log In</Button>
              <Button variant="default" size="sm" onClick={() => navigate("/role-selection")}>Sign Up</Button>
            </>
          )}
        </div>

        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-border bg-background overflow-hidden"
          >
            <div className="px-4 py-4 flex flex-col gap-3">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => handleNavClick(link.href, link.label)}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground py-2 text-left"
                >
                  {link.label}
                </button>
              ))}
              <div className="flex gap-3 pt-2">
                {user ? (
                  <>
                    <Button variant="ghost" size="sm" className="flex-1" onClick={() => { navigate(dashboardPath); setMobileOpen(false); }}>Dashboard</Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => { signOut(); setMobileOpen(false); }}>Sign Out</Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" className="flex-1" onClick={() => { navigate("/auth?mode=login"); setMobileOpen(false); }}>Log In</Button>
                    <Button variant="default" size="sm" className="flex-1" onClick={() => { navigate("/role-selection"); setMobileOpen(false); }}>Sign Up</Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
