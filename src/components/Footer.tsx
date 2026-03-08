const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-display font-bold">L</span>
              </div>
              <span className="font-display font-bold text-lg">
                Local<span className="text-primary">Hire</span>
              </span>
            </div>
            <p className="text-sm text-background/60 max-w-xs">
              Hyperlocal AI-powered job matching for blue-collar workers and employers.
            </p>
          </div>

          <div>
            <h4 className="font-display font-semibold text-sm mb-4">For Workers</h4>
            <ul className="space-y-2 text-sm text-background/60">
              <li><a href="#" className="hover:text-primary transition-colors">Browse Jobs</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Create Profile</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Job Alerts</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Skill Verification</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-sm mb-4">For Employers</h4>
            <ul className="space-y-2 text-sm text-background/60">
              <li><a href="#" className="hover:text-primary transition-colors">Post a Job</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Find Workers</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Bulk Hiring</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Analytics</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-sm mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-background/60">
              <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/10 pt-6 text-center text-xs text-background/40">
          © {new Date().getFullYear()} LocalHire. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
