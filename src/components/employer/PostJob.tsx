import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { PlusCircle, X, MapPin, DollarSign, Briefcase, Sparkles, Loader2 } from "lucide-react";
import { z } from "zod";
import PlacesAutocomplete from "@/components/shared/PlacesAutocomplete";

const CATEGORIES = ["Construction", "Cleaning", "Delivery", "Gardening", "Painting", "Plumbing", "Electrical", "Moving", "Carpentry", "Other"];
const JOB_TYPES = [
  { value: "gig", label: "Gig (Temporary)" },
  { value: "part_time", label: "Part-Time" },
  { value: "full_time", label: "Full-Time" },
  { value: "contract", label: "Contract" },
];
const PAY_TYPES = [
  { value: "hourly", label: "Per Hour" },
  { value: "daily", label: "Per Day" },
  { value: "fixed", label: "Fixed" },
];
const ALL_ROLES = ["Driver", "Electrician", "Plumber", "Carpenter", "Painter", "Cleaner", "Gardener", "Mason", "Welder", "Mechanic", "Delivery", "Cook", "Security Guard", "Other"];

const jobSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(100, "Title too long"),
  description: z.string().trim().max(2000, "Description too long").optional(),
  category: z.string().min(1, "Select a category"),
  job_type: z.string().min(1, "Select a job type"),
  location_address: z.string().trim().max(200).optional(),
  pay_min: z.number().min(0).optional(),
  pay_max: z.number().min(0).optional(),
  pay_type: z.string().optional(),
  vacancies: z.number().min(1, "At least 1 vacancy").max(500),
});

export default function PostJob() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [jobType, setJobType] = useState("gig");
  const [locationAddress, setLocationAddress] = useState("");
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [payMin, setPayMin] = useState("");
  const [payMax, setPayMax] = useState("");
  const [payType, setPayType] = useState("daily");
  const [vacancies, setVacancies] = useState("1");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const toggleRole = (role: string) => {
    setSelectedRoles(selectedRoles.includes(role) ? selectedRoles.filter((r) => r !== role) : [...selectedRoles, role]);
  };

  const generateAIDescription = async () => {
    if (!title && !category && selectedRoles.length === 0) {
      toast({ title: "Fill in some details first", description: "Add a title, category, or roles so AI can generate a description.", variant: "destructive" });
      return;
    }
    setGeneratingAI(true);
    try {
      const prompt = `Generate a professional, concise job description (max 150 words) for a blue-collar/skilled labor job with these details:
Title: ${title || "Not specified"}
Category: ${category || "Not specified"}
Job Type: ${JOB_TYPES.find(t => t.value === jobType)?.label || jobType}
Roles: ${selectedRoles.join(", ") || "Not specified"}
Skills: ${skills.join(", ") || "Not specified"}
Location: ${locationAddress || "Not specified"}
Pay: ${payMin || "?"} - ${payMax || "?"} ${payType}
Vacancies: ${vacancies}

Write in a direct, professional tone. Include key responsibilities and basic requirements. Do not include the title or headers.`;

      const { data, error } = await supabase.functions.invoke("ai-job-description", {
        body: { prompt },
      });

      if (error) throw error;
      if (data?.description) {
        setDescription(data.description);
        toast({ title: "Description generated!", description: "Review and edit as needed." });
      }
    } catch {
      // Fallback: generate a template locally
      const roleText = selectedRoles.length > 0 ? selectedRoles.join(", ") : category || "worker";
      const skillText = skills.length > 0 ? `Required skills: ${skills.join(", ")}. ` : "";
      const locText = locationAddress ? `Location: ${locationAddress}. ` : "";
      const payText = payMin || payMax ? `Compensation: ₹${payMin || "?"} - ₹${payMax || "?"} ${payType}. ` : "";
      
      setDescription(
        `We are looking for experienced ${roleText} to join our team${vacancies !== "1" ? ` (${vacancies} positions available)` : ""}. ${skillText}${locText}${payText}The ideal candidate should be reliable, punctual, and committed to quality work. Experience in ${category || "the relevant field"} is preferred. Apply now to get started!`
      );
      toast({ title: "Template generated", description: "AI unavailable — used a smart template instead." });
    }
    setGeneratingAI(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = jobSchema.safeParse({
      title, description: description || undefined, category, job_type: jobType,
      location_address: locationAddress || undefined,
      pay_min: payMin ? Number(payMin) : undefined,
      pay_max: payMax ? Number(payMax) : undefined,
      pay_type: payType,
      vacancies: Number(vacancies) || 1,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((i) => { fieldErrors[i.path[0] as string] = i.message; });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("jobs").insert({
      employer_id: user!.id,
      title: title.trim(),
      description: description.trim() || null,
      category,
      job_type: jobType,
      location_address: locationAddress.trim() || null,
      location_lat: locationLat,
      location_lng: locationLng,
      pay_min: payMin ? Number(payMin) : null,
      pay_max: payMax ? Number(payMax) : null,
      pay_type: payType,
      skills_required: skills,
      roles_required: selectedRoles,
      vacancies: Number(vacancies) || 1,
    } as any);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Job Posted!", description: "Your job listing is now live." });
      setTitle(""); setDescription(""); setCategory(""); setJobType("gig");
      setLocationAddress(""); setLocationLat(null); setLocationLng(null);
      setPayMin(""); setPayMax(""); setPayType("daily");
      setSkills([]); setSelectedRoles([]); setVacancies("1");
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display font-bold text-2xl text-foreground">Post a New Job</h1>
        <p className="text-muted-foreground text-sm mt-1">Fill in the details to find the right worker — post in under 2 minutes</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-foreground text-lg flex items-center gap-2"><Briefcase size={18} /> Job Details</h2>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Job Title *</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Plumber needed for bathroom fitting" />
            {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-foreground">Description</label>
              <Button type="button" variant="outline" size="sm" onClick={generateAIDescription} disabled={generatingAI} className="gap-1.5">
                {generatingAI ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {generatingAI ? "Generating..." : "AI Generate"}
              </Button>
            </div>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the job, requirements, and what the worker will do..." rows={4} />
            {errors.description && <p className="text-xs text-destructive mt-1">{errors.description}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Category *</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              {errors.category && <p className="text-xs text-destructive mt-1">{errors.category}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Job Type *</label>
              <Select value={jobType} onValueChange={setJobType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{JOB_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Number of Vacancies</label>
            <Input type="number" value={vacancies} onChange={(e) => setVacancies(e.target.value)} min={1} max={500} placeholder="1" className="max-w-32" />
            {errors.vacancies && <p className="text-xs text-destructive mt-1">{errors.vacancies}</p>}
          </div>
        </Card>

        {/* Location */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-foreground text-lg flex items-center gap-2"><MapPin size={18} /> Location</h2>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Address</label>
            <PlacesAutocomplete
              value={locationAddress}
              onChange={(address, lat, lng) => {
                setLocationAddress(address);
                setLocationLat(lat);
                setLocationLng(lng);
              }}
              placeholder="e.g., Sector 62, Noida, UP"
            />
            {locationLat && locationLng && (
              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                <MapPin size={10} /> Coordinates: {locationLat.toFixed(4)}, {locationLng.toFixed(4)}
              </p>
            )}
          </div>
        </Card>

        {/* Pay */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-foreground text-lg flex items-center gap-2"><DollarSign size={18} /> Payment</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Min Pay (₹)</label>
              <Input type="number" value={payMin} onChange={(e) => setPayMin(e.target.value)} placeholder="300" min={0} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Max Pay (₹)</label>
              <Input type="number" value={payMax} onChange={(e) => setPayMax(e.target.value)} placeholder="500" min={0} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Pay Type</label>
              <Select value={payType} onValueChange={setPayType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PAY_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Roles Required */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-foreground text-lg">Roles Required</h2>
          <div className="flex flex-wrap gap-2">
            {ALL_ROLES.map((role) => (
              <Badge
                key={role}
                variant={selectedRoles.includes(role) ? "default" : "outline"}
                className="cursor-pointer py-1.5 px-3 transition-all"
                onClick={() => toggleRole(role)}
              >
                {role}
              </Badge>
            ))}
          </div>
        </Card>

        {/* Skills */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-foreground text-lg">Skills Required</h2>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <Badge key={s} variant="secondary" className="gap-1 py-1.5 pl-3 pr-2">
                  {s}
                  <button onClick={() => setSkills(skills.filter((sk) => sk !== s))} className="hover:text-destructive"><X size={12} /></button>
                </Badge>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())} placeholder="Add a required skill" className="flex-1" />
            <Button type="button" variant="outline" onClick={addSkill}><PlusCircle size={16} /></Button>
          </div>
        </Card>

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          <PlusCircle size={16} className="mr-2" />
          {submitting ? "Posting..." : "Post Job"}
        </Button>
      </form>
    </div>
  );
}
