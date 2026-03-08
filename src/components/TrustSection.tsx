import { motion } from "framer-motion";
import { ShieldCheck, Brain, AlertTriangle } from "lucide-react";

const badges = [
  { icon: ShieldCheck, title: "Verified Profiles", desc: "Skill-tested and badge-verified workers you can trust." },
  { icon: Brain, title: "AI-Powered Matching", desc: "Smart recommendations based on skills, location & behavior." },
  { icon: AlertTriangle, title: "Fraud Detection", desc: "AI monitors listings for scams, fake posts & suspicious activity." },
];

const TrustSection = () => {
  return (
    <section className="py-20 bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="font-display font-bold text-3xl md:text-4xl mb-4">
            Built on Trust & Safety
          </h2>
          <p className="text-secondary-foreground/70 text-lg max-w-xl mx-auto">
            Every interaction on LocalHire is backed by verification, AI intelligence, and transparency.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {badges.map((badge, i) => (
            <motion.div
              key={badge.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-5">
                <badge.icon size={28} className="text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{badge.title}</h3>
              <p className="text-sm text-secondary-foreground/70">{badge.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
