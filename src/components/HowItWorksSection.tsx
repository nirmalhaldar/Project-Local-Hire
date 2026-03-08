import { motion } from "framer-motion";
import { UserPlus, Search, CheckCircle, FileText, Users, Handshake } from "lucide-react";

const workerSteps = [
  { icon: UserPlus, title: "Create Profile", desc: "Add your skills, experience & availability — no resume needed." },
  { icon: Search, title: "Discover Jobs", desc: "AI finds the best nearby jobs matching your skills instantly." },
  { icon: CheckCircle, title: "Apply & Work", desc: "One-click apply and start earning. It's that simple." },
];

const employerSteps = [
  { icon: FileText, title: "Post a Job", desc: "Describe the role, set pay & location in under 2 minutes." },
  { icon: Users, title: "Get Matched", desc: "AI delivers the top 10 matched, verified workers near you." },
  { icon: Handshake, title: "Hire & Manage", desc: "Connect directly, hire fast, and track performance." },
];

const StepCard = ({ icon: Icon, title, desc, index }: { icon: any; title: string; desc: string; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.1 }}
    className="flex flex-col items-center text-center"
  >
    <div className="relative mb-5">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Icon size={28} className="text-primary" />
      </div>
      <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
        {index + 1}
      </span>
    </div>
    <h3 className="font-display font-semibold text-lg text-foreground mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground max-w-xs">{desc}</p>
  </motion.div>
);

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground text-lg">Simple steps for workers and employers alike.</p>
        </motion.div>

        {/* Workers */}
        <div className="mb-16">
          <h3 className="text-center font-display font-semibold text-xl text-foreground mb-10">
            👷 For Workers
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-4xl mx-auto">
            {workerSteps.map((step, i) => (
              <StepCard key={step.title} {...step} index={i} />
            ))}
          </div>
        </div>

        {/* Employers */}
        <div id="employers">
          <h3 className="text-center font-display font-semibold text-xl text-foreground mb-10">
            🏢 For Employers
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-4xl mx-auto">
            {employerSteps.map((step, i) => (
              <StepCard key={step.title} {...step} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
