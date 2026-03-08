import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { User, Mail, Phone, Plus, X, Save, Shield, BadgeCheck, DollarSign, Briefcase } from "lucide-react";

const ALL_ROLES = ["Driver", "Electrician", "Plumber", "Carpenter", "Painter", "Cleaner", "Gardener", "Mason", "Welder", "Mechanic", "Delivery", "Cook", "Security Guard", "Other"];

const ROLE_CATEGORIES: Record<string, string[]> = {
  Driver: ["Personal Driver", "Delivery Driver", "Truck Driver", "Auto/Taxi"],
  Electrician: ["Home Wiring", "Industrial", "Appliance Repair", "Solar Installation"],
  Plumber: ["Pipe Fitting", "Drainage", "Bathroom Fitting", "Water Tank"],
  Carpenter: ["Furniture", "Door/Window", "Modular Kitchen", "Woodwork Repair"],
  Painter: ["House Painting", "Wall Texture", "Waterproofing", "Polish"],
  Cleaner: ["Home Cleaning", "Office Cleaning", "Deep Cleaning", "Pest Control"],
  Gardener: ["Garden Maintenance", "Landscaping", "Tree Trimming", "Plant Care"],
  Mason: ["Brick Work", "Plastering", "Tiling", "Foundation"],
  Welder: ["Arc Welding", "Gas Welding", "Fabrication", "Repair"],
  Mechanic: ["Car Mechanic", "Bike Mechanic", "AC Repair", "Fridge Repair"],
  Delivery: ["Food Delivery", "Package Delivery", "Courier", "Heavy Goods"],
  Cook: ["Home Cook", "Party/Event", "Catering", "Restaurant"],
  "Security Guard": ["Day Shift", "Night Shift", "Event Security", "Residential"],
  Other: ["General Labour", "Helper", "Warehouse", "Loading/Unloading"],
};

interface Profile {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  roles: string[];
  categories: string[];
  availability_status: string;
  gig_wage_daily: number | null;
  visiting_fee: number | null;
  is_verified: boolean;
}

interface Skill {
  id: string;
  skill: string;
  experience_years: number;
}

export default function WorkerProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile>({
    full_name: "", email: "", phone: "", avatar_url: null, bio: null,
    roles: [], categories: [], availability_status: "open_for_work",
    gig_wage_daily: null, visiting_fee: null, is_verified: false,
  });
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [newSkillYears, setNewSkillYears] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) { fetchProfile(); fetchSkills(); }
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, email, phone, avatar_url, bio, roles, categories, availability_status, gig_wage_daily, visiting_fee, is_verified")
      .eq("id", user!.id)
      .single();
    if (data) setProfile(data as Profile);
    setLoading(false);
  };

  const fetchSkills = async () => {
    const { data } = await supabase.from("worker_skills").select("*").eq("user_id", user!.id).order("created_at");
    if (data) setSkills(data);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name,
      phone: profile.phone,
      bio: profile.bio,
      roles: profile.roles,
      categories: profile.categories,
      availability_status: profile.availability_status,
      gig_wage_daily: profile.gig_wage_daily,
      visiting_fee: profile.visiting_fee,
    }).eq("id", user!.id);

    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Profile updated", description: "Your profile has been saved." });
    setSaving(false);
  };

  const handleAddSkill = async () => {
    if (!newSkill.trim()) return;
    const { data, error } = await supabase.from("worker_skills")
      .insert({ user_id: user!.id, skill: newSkill.trim(), experience_years: newSkillYears })
      .select().single();
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else if (data) { setSkills([...skills, data]); setNewSkill(""); setNewSkillYears(0); }
  };

  const handleRemoveSkill = async (id: string) => {
    await supabase.from("worker_skills").delete().eq("id", id);
    setSkills(skills.filter((s) => s.id !== id));
  };

  const toggleRole = (role: string) => {
    const newRoles = profile.roles.includes(role)
      ? profile.roles.filter((r) => r !== role)
      : [...profile.roles, role];
    // Remove categories that belong to removed roles
    const validCategories = profile.categories.filter((c) =>
      newRoles.some((r) => ROLE_CATEGORIES[r]?.includes(c))
    );
    setProfile({ ...profile, roles: newRoles, categories: validCategories });
  };

  const toggleCategory = (cat: string) => {
    setProfile({
      ...profile,
      categories: profile.categories.includes(cat)
        ? profile.categories.filter((c) => c !== cat)
        : [...profile.categories, cat],
    });
  };

  const availableCategories = profile.roles.flatMap((r) => ROLE_CATEGORIES[r] || []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        <Card className="p-6 animate-pulse"><div className="h-32 bg-muted rounded" /></Card>
      </div>
    );
  }

  const initials = profile.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "?";

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display font-bold text-2xl text-foreground">My Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your information, skills, and preferences</p>
      </div>

      {/* Verification status */}
      {profile.is_verified ? (
        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3">
          <BadgeCheck className="text-green-600" size={20} />
          <span className="text-sm font-medium text-green-700 dark:text-green-400">Verified Worker</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3">
          <Shield className="text-amber-600" size={20} />
          <div>
            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Not Verified</span>
            <p className="text-xs text-amber-600 dark:text-amber-500">Visit your nearest branch and appear for a skill test to get verified.</p>
          </div>
        </div>
      )}

      {/* Basic Info */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="h-16 w-16 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-foreground text-lg">{profile.full_name || "Your Name"}</h2>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5"><User size={14} /> Full Name</label>
            <Input value={profile.full_name || ""} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5"><Mail size={14} /> Email</label>
            <Input value={profile.email || ""} disabled className="bg-muted" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5"><Phone size={14} /> Phone</label>
            <Input value={profile.phone || ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+91 98765 43210" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Bio</label>
            <Textarea value={profile.bio || ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="Tell employers about yourself..." rows={3} />
          </div>
        </div>
      </Card>

      {/* Availability & Wages */}
      <Card className="p-6">
        <h2 className="font-semibold text-foreground text-lg mb-4">Availability & Pricing</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Work Status</label>
            <Select value={profile.availability_status} onValueChange={(v) => setProfile({ ...profile, availability_status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="open_for_work">🟢 Open for Work</SelectItem>
                <SelectItem value="open_for_visit">🔵 Open for Visit (Currently Employed)</SelectItem>
                <SelectItem value="unavailable">🔴 Unavailable</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5"><DollarSign size={14} /> Gig Wage (Daily ₹)</label>
              <Input type="number" value={profile.gig_wage_daily || ""} onChange={(e) => setProfile({ ...profile, gig_wage_daily: Number(e.target.value) || null })} placeholder="500" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5"><DollarSign size={14} /> Visiting Fee (₹)</label>
              <Input type="number" value={profile.visiting_fee || ""} onChange={(e) => setProfile({ ...profile, visiting_fee: Number(e.target.value) || null })} placeholder="200" />
            </div>
          </div>
        </div>
      </Card>

      {/* Roles */}
      <Card className="p-6">
        <h2 className="font-semibold text-foreground text-lg mb-2">Roles</h2>
        <p className="text-sm text-muted-foreground mb-4">Select the types of work you do</p>
        <div className="flex flex-wrap gap-2">
          {ALL_ROLES.map((role) => (
            <Badge
              key={role}
              variant={profile.roles.includes(role) ? "default" : "outline"}
              className="cursor-pointer py-1.5 px-3 transition-all"
              onClick={() => toggleRole(role)}
            >
              <Briefcase size={12} className="mr-1" /> {role}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Categories (based on roles) */}
      {availableCategories.length > 0 && (
        <Card className="p-6">
          <h2 className="font-semibold text-foreground text-lg mb-2">Categories</h2>
          <p className="text-sm text-muted-foreground mb-4">Select specific services you offer</p>
          <div className="flex flex-wrap gap-2">
            {availableCategories.map((cat) => (
              <Badge
                key={cat}
                variant={profile.categories.includes(cat) ? "default" : "outline"}
                className="cursor-pointer py-1.5 px-3 transition-all"
                onClick={() => toggleCategory(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Skills */}
      <Card className="p-6">
        <h2 className="font-semibold text-foreground text-lg mb-4">Skills & Experience</h2>
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {skills.map((s) => (
              <Badge key={s.id} variant="secondary" className="gap-1.5 py-1.5 pl-3 pr-2">
                {s.skill}
                {s.experience_years > 0 && <span className="text-muted-foreground">· {s.experience_years}yr</span>}
                <button onClick={() => handleRemoveSkill(s.id)} className="ml-1 hover:text-destructive"><X size={12} /></button>
              </Badge>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input placeholder="Add a skill" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddSkill()} className="flex-1" />
          <Input type="number" placeholder="Years" value={newSkillYears || ""} onChange={(e) => setNewSkillYears(parseInt(e.target.value) || 0)} className="w-20" min={0} />
          <Button variant="outline" onClick={handleAddSkill}><Plus size={16} /></Button>
        </div>
      </Card>

      <Button onClick={handleSaveProfile} disabled={saving} size="lg" className="w-full">
        <Save size={16} className="mr-2" />
        {saving ? "Saving..." : "Save All Changes"}
      </Button>
    </div>
  );
}
