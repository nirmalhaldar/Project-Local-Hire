import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Building2, Truck, Factory, Wrench, Home, UtensilsCrossed,
  Wheat, Package, Zap, HeartPulse, HardHat
} from "lucide-react";

const categories = [
  { icon: Building2, title: "Construction & Infrastructure", roles: "Mason, Carpenter, Electrician, Plumber" },
  { icon: Truck, title: "Transportation & Driving", roles: "Delivery Driver, Heavy Vehicle, Forklift" },
  { icon: Factory, title: "Manufacturing & Factory", roles: "Machine Operator, Assembly, CNC" },
  { icon: Wrench, title: "Maintenance & Repair", roles: "AC Tech, Mobile Repair, Mechanic" },
  { icon: Home, title: "Home & Personal Services", roles: "Housekeeper, Cook, Security Guard" },
  { icon: UtensilsCrossed, title: "Hospitality & Retail", roles: "Waiter, Cashier, Store Assistant" },
  { icon: Wheat, title: "Agriculture & Farming", roles: "Farm Worker, Dairy, Tractor Operator" },
  { icon: Package, title: "Logistics & Warehouse", roles: "Warehouse Worker, Picker, Inventory" },
  { icon: Zap, title: "Gig & On-Demand", roles: "Electrician, Plumber, Cleaner (On-Call)" },
  { icon: HeartPulse, title: "Healthcare Support", roles: "Nursing Assistant, Ward Attendant" },
  { icon: HardHat, title: "Construction Equipment", roles: "Crane Operator, Scaffolding, Roads" },
];

const CategoriesSection = () => {
  const navigate = useNavigate();

  const handleCategoryClick = (category: string) => {
    navigate(`/browse-jobs?category=${encodeURIComponent(category)}`);
  };

  return (
    <section id="categories" className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
            Browse Job Categories
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Explore opportunities across 11 blue-collar categories with hundreds of roles.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleCategoryClick(cat.title)}
              className="group bg-card rounded-xl border border-border p-5 hover:border-primary/40 hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
              <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <cat.icon size={22} className="text-primary" />
              </div>
              <h3 className="font-display font-semibold text-sm md:text-base text-foreground mb-1">
                {cat.title}
              </h3>
              <p className="text-xs text-muted-foreground mb-3 line-clamp-1">{cat.roles}</p>
              <span className="text-xs font-medium text-primary group-hover:underline">
                Explore Roles →
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
