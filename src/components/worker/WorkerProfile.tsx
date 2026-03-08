import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { User, Mail, Phone, Plus, X, Save } from "lucide-react";

interface Profile {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface Skill {
  id: string;
  skill: string;
  experience_years: number;
}

export default function WorkerProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile>({ full_name: "", email: "", phone: "", avatar_url: null });
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [newSkillYears, setNewSkillYears] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchSkills();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, email, phone, avatar_url")
      .eq("id", user!.id)
      .single();
    if (data) setProfile(data);
    setLoading(false);
  };

  const fetchSkills = async () => {
    const { data } = await supabase
      .from("worker_skills")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: true });
    if (data) setSkills(data);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
      })
      .eq("id", user!.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated", description: "Your profile has been saved." });
    }
    setSaving(false);
  };

  const handleAddSkill = async () => {
    if (!newSkill.trim()) return;
    const { data, error } = await supabase
      .from("worker_skills")
      .insert({ user_id: user!.id, skill: newSkill.trim(), experience_years: newSkillYears })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (data) {
      setSkills([...skills, data]);
      setNewSkill("");
      setNewSkillYears(0);
    }
  };

  const handleRemoveSkill = async (id: string) => {
    await supabase.from("worker_skills").delete().eq("id", id);
    setSkills(skills.filter((s) => s.id !== id));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        <Card className="p-6 animate-pulse"><div className="h-32 bg-muted rounded" /></Card>
      </div>
    );
  }

  const initials = profile.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display font-bold text-2xl text-foreground">My Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your personal information and skills
        </p>
      </div>

      {/* Basic Info */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="h-16 w-16 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-foreground text-lg">{profile.full_name || "Your Name"}</h2>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
              <User size={14} /> Full Name
            </label>
            <Input
              value={profile.full_name || ""}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
              <Mail size={14} /> Email
            </label>
            <Input value={profile.email || ""} disabled className="bg-muted" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
              <Phone size={14} /> Phone
            </label>
            <Input
              value={profile.phone || ""}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="+91 98765 43210"
            />
          </div>
          <Button onClick={handleSaveProfile} disabled={saving}>
            <Save size={16} className="mr-2" />
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </Card>

      {/* Skills */}
      <Card className="p-6">
        <h2 className="font-semibold text-foreground text-lg mb-4">Skills & Experience</h2>

        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {skills.map((s) => (
              <Badge key={s.id} variant="secondary" className="gap-1.5 py-1.5 pl-3 pr-2">
                {s.skill}
                {s.experience_years > 0 && (
                  <span className="text-muted-foreground">· {s.experience_years}yr</span>
                )}
                <button
                  onClick={() => handleRemoveSkill(s.id)}
                  className="ml-1 hover:text-destructive"
                >
                  <X size={12} />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            placeholder="Add a skill (e.g., Plumbing)"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddSkill()}
            className="flex-1"
          />
          <Input
            type="number"
            placeholder="Years"
            value={newSkillYears || ""}
            onChange={(e) => setNewSkillYears(parseInt(e.target.value) || 0)}
            className="w-20"
            min={0}
          />
          <Button variant="outline" onClick={handleAddSkill}>
            <Plus size={16} />
          </Button>
        </div>
      </Card>
    </div>
  );
}
