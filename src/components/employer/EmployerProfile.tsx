import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { User, Mail, Phone, Save, Building2, MapPin, Globe, Briefcase, Users } from "lucide-react";
import PlacesAutocomplete from "@/components/shared/PlacesAutocomplete";

const INDUSTRIES = [
  "Construction & Infrastructure",
  "Transportation & Driving",
  "Manufacturing & Factory",
  "Maintenance & Repair",
  "Home & Personal Services",
  "Hospitality & Retail",
  "Agriculture & Farming",
  "Logistics & Warehouse",
  "Gig & On-Demand",
  "Healthcare Support",
  "Education",
  "Other",
];

const COMPANY_SIZES = [
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "201-500", label: "201-500 employees" },
  { value: "500+", label: "500+ employees" },
];

interface EmployerProfile {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  company_name: string | null;
  company_description: string | null;
  company_industry: string | null;
  company_size: string | null;
  company_website: string | null;
  location_address: string | null;
  location_lat: number | null;
  location_lng: number | null;
}

export default function EmployerProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<EmployerProfile>({
    full_name: "", email: "", phone: "", avatar_url: null,
    company_name: null, company_description: null, company_industry: null,
    company_size: null, company_website: null, location_address: null,
    location_lat: null, location_lng: null,
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    // First try to get email from authenticated user
    const userEmail = user?.email || "";
    
    const { data } = await supabase
      .from("profiles")
      .select("full_name, email, phone, avatar_url, company_name, company_description, company_industry, company_size, company_website, location_address, location_lat, location_lng")
      .eq("id", user!.id)
      .single();
    
    if (data) {
      // Use user email if profile doesn't have email
      setProfile({
        ...data as unknown as EmployerProfile,
        email: data.email || userEmail
      });
    } else {
      // Create profile if it doesn't exist with user's email
      await supabase.from("profiles").insert({
        id: user!.id,
        email: userEmail,
        full_name: "",
      });
      setProfile({
        full_name: "",
        email: userEmail,
        phone: "",
        avatar_url: null,
        company_name: null,
        company_description: null,
        company_industry: null,
        company_size: null,
        company_website: null,
        location_address: null,
        location_lat: null,
        location_lng: null,
      });
    }
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name,
      phone: profile.phone,
      company_name: profile.company_name,
      company_description: profile.company_description,
      company_industry: profile.company_industry,
      company_size: profile.company_size,
      company_website: profile.company_website,
      location_address: profile.location_address,
      location_lat: profile.location_lat,
      location_lng: profile.location_lng,
    } as any).eq("id", user!.id);

    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Profile updated", description: "Your company profile has been saved." });
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        <Card className="p-6 animate-pulse"><div className="h-32 bg-muted rounded" /></Card>
      </div>
    );
  }

  const initials = profile.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase() || profile.company_name?.charAt(0).toUpperCase() || "?";

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display font-bold text-2xl text-foreground">Company Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your company information and preferences</p>
      </div>

      {/* Company Info */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="h-16 w-16 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-foreground text-lg">{profile.company_name || "Company Name"}</h2>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5"><Building2 size={14} /> Company Name</label>
            <Input value={profile.company_name || ""} onChange={(e) => setProfile({ ...profile, company_name: e.target.value })} placeholder="Your company name" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5"><User size={14} /> Contact Person Name</label>
            <Input value={profile.full_name || ""} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} placeholder="Your full name" />
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
            <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5"><Globe size={14} /> Company Website</label>
            <Input value={profile.company_website || ""} onChange={(e) => setProfile({ ...profile, company_website: e.target.value })} placeholder="https://yourcompany.com" />
          </div>
        </div>
      </Card>

      {/* Company Details */}
      <Card className="p-6">
        <h2 className="font-semibold text-foreground text-lg mb-4">Company Details</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Industry</label>
            <Select value={profile.company_industry || ""} onValueChange={(v) => setProfile({ ...profile, company_industry: v })}>
              <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((ind) => <SelectItem key={ind} value={ind}>{ind}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5"><Users size={14} /> Company Size</label>
            <Select value={profile.company_size || ""} onValueChange={(v) => setProfile({ ...profile, company_size: v })}>
              <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
              <SelectContent>
                {COMPANY_SIZES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Company Description</label>
            <Textarea value={profile.company_description || ""} onChange={(e) => setProfile({ ...profile, company_description: e.target.value })} placeholder="Tell workers about your company..." rows={4} />
          </div>
        </div>
      </Card>

      {/* Location */}
      <Card className="p-6">
        <h2 className="font-semibold text-foreground text-lg mb-4 flex items-center gap-2"><MapPin size={18} /> Company Location</h2>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Address</label>
          <PlacesAutocomplete
            value={profile.location_address || ""}
            onChange={(address, lat, lng) => setProfile({ ...profile, location_address: address, location_lat: lat, location_lng: lng })}
            placeholder="Search your company address"
          />
          {profile.location_lat && profile.location_lng && (
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
              <MapPin size={10} /> {profile.location_lat.toFixed(4)}, {profile.location_lng.toFixed(4)}
            </p>
          )}
        </div>
      </Card>

      <Button onClick={handleSaveProfile} disabled={saving} size="lg" className="w-full">
        <Save size={16} className="mr-2" />
        {saving ? "Saving..." : "Save All Changes"}
      </Button>
    </div>
  );
}
