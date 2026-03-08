import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Filter, Star, CheckCircle, MessageSquare, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface WorkerProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  roles: string[];
  categories: string[];
  availability_status: string | null;
  is_verified: boolean;
  gig_wage_daily: number | null;
  bio: string | null;
  skills: { skill: string; experience_years: number | null }[];
  avg_rating: number | null;
  total_ratings: number;
}

const AVAILABILITY_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "open_for_work", label: "Open for Work" },
  { value: "open_for_visit", label: "Open for Visit" },
  { value: "busy", label: "Busy" },
];

const ALL_ROLES = ["Driver", "Electrician", "Plumber", "Carpenter", "Painter", "Cleaner", "Gardener", "Mason", "Welder", "Mechanic", "Delivery", "Cook", "Security Guard"];

export default function CandidateSearch() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [minExperience, setMinExperience] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (user) fetchWorkers();
  }, [user]);

  const fetchWorkers = async () => {
    // Get all worker user IDs
    const { data: workerRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "worker");

    if (!workerRoles || workerRoles.length === 0) { setLoading(false); return; }

    const workerIds = workerRoles.map((r) => r.user_id);

    // Fetch profiles, skills, and ratings in parallel
    const [profilesRes, skillsRes, ratingsRes] = await Promise.all([
      supabase.from("profiles").select("*").in("id", workerIds),
      supabase.from("worker_skills").select("user_id, skill, experience_years").in("user_id", workerIds),
      supabase.from("worker_ratings").select("worker_id, rating"),
    ]);

    const skillsMap = new Map<string, { skill: string; experience_years: number | null }[]>();
    (skillsRes.data || []).forEach((s) => {
      if (!skillsMap.has(s.user_id)) skillsMap.set(s.user_id, []);
      skillsMap.get(s.user_id)!.push({ skill: s.skill, experience_years: s.experience_years });
    });

    const ratingsMap = new Map<string, number[]>();
    (ratingsRes.data || []).forEach((r) => {
      if (!ratingsMap.has(r.worker_id)) ratingsMap.set(r.worker_id, []);
      ratingsMap.get(r.worker_id)!.push(r.rating);
    });

    const workerList: WorkerProfile[] = (profilesRes.data || []).map((p) => {
      const ratings = ratingsMap.get(p.id) || [];
      return {
        id: p.id,
        full_name: p.full_name || "Unknown",
        email: p.email || "",
        phone: p.phone,
        roles: (p.roles as string[]) || [],
        categories: (p.categories as string[]) || [],
        availability_status: p.availability_status,
        is_verified: p.is_verified || false,
        gig_wage_daily: p.gig_wage_daily,
        bio: p.bio,
        skills: skillsMap.get(p.id) || [],
        avg_rating: ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
        total_ratings: ratings.length,
      };
    });

    setWorkers(workerList);
    setLoading(false);
  };

  const filtered = workers.filter((w) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = w.full_name.toLowerCase().includes(q)
        || w.skills.some((s) => s.skill.toLowerCase().includes(q))
        || w.roles.some((r) => r.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (roleFilter !== "all" && !w.roles.includes(roleFilter)) return false;
    if (availabilityFilter !== "all" && w.availability_status !== availabilityFilter) return false;
    if (verifiedOnly && !w.is_verified) return false;
    if (minExperience) {
      const maxExp = Math.max(...w.skills.map((s) => s.experience_years || 0), 0);
      if (maxExp < Number(minExperience)) return false;
    }
    return true;
  }).sort((a, b) => {
    // Sort by rating desc, then verified first
    if (b.is_verified !== a.is_verified) return b.is_verified ? 1 : -1;
    return (b.avg_rating || 0) - (a.avg_rating || 0);
  });

  const handleMessage = (workerId: string) => {
    navigate("/dashboard/employer/messages", { state: { startChatWith: workerId } });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        {[1, 2, 3].map((i) => <Card key={i} className="p-5 animate-pulse"><div className="h-24 bg-muted rounded" /></Card>)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-foreground">Find Workers</h1>
        <p className="text-muted-foreground text-sm mt-1">Search and filter candidates matching your requirements</p>
      </div>

      {/* Search + Filter Toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, skill, or role..."
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="gap-1.5">
          <Filter size={16} /> Filters
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="p-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Role</label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {ALL_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Availability</label>
              <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AVAILABILITY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Min Experience (years)</label>
              <Input type="number" value={minExperience} onChange={(e) => setMinExperience(e.target.value)} placeholder="0" min={0} />
            </div>
            <div className="flex items-end">
              <Button
                variant={verifiedOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setVerifiedOnly(!verifiedOnly)}
                className="gap-1.5"
              >
                <CheckCircle size={14} /> Verified Only
              </Button>
            </div>
          </div>
        </Card>
      )}

      <p className="text-sm text-muted-foreground">{filtered.length} worker{filtered.length !== 1 ? "s" : ""} found</p>

      {/* Worker Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <User className="mx-auto text-muted-foreground mb-3" size={48} />
          <h3 className="font-display font-semibold text-lg text-foreground mb-1">No workers found</h3>
          <p className="text-muted-foreground text-sm">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((w) => (
            <Card key={w.id} className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {w.full_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground truncate">{w.full_name}</p>
                    {w.is_verified && <CheckCircle className="text-primary shrink-0" size={14} />}
                  </div>
                  <p className="text-xs text-muted-foreground">{w.email}</p>
                  {w.availability_status && (
                    <Badge variant="outline" className="text-xs mt-1">
                      {w.availability_status === "open_for_work" ? "🟢 Open for Work" :
                       w.availability_status === "open_for_visit" ? "🔵 Open for Visit" : "🔴 Busy"}
                    </Badge>
                  )}
                </div>
                {w.avg_rating !== null && (
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1">
                      <Star className="text-amber-500 fill-amber-500" size={14} />
                      <span className="text-sm font-semibold text-foreground">{w.avg_rating.toFixed(1)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{w.total_ratings} review{w.total_ratings !== 1 ? "s" : ""}</p>
                  </div>
                )}
              </div>

              {w.roles.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {w.roles.map((r) => <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>)}
                </div>
              )}

              {w.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {w.skills.slice(0, 5).map((s) => (
                    <Badge key={s.skill} variant="outline" className="text-xs">
                      {s.skill}{s.experience_years ? ` · ${s.experience_years}yr` : ""}
                    </Badge>
                  ))}
                  {w.skills.length > 5 && <Badge variant="outline" className="text-xs">+{w.skills.length - 5} more</Badge>}
                </div>
              )}

              {w.gig_wage_daily && (
                <p className="text-xs text-muted-foreground mb-3">Daily wage: <span className="font-medium text-foreground">₹{w.gig_wage_daily}</span></p>
              )}

              {w.bio && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{w.bio}</p>}

              <Button size="sm" variant="outline" onClick={() => handleMessage(w.id)} className="gap-1.5">
                <MessageSquare size={14} /> Message
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
