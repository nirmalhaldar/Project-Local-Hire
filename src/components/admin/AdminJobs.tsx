import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Search, Trash2, XCircle, Eye, Briefcase, MapPin, IndianRupee } from "lucide-react";

interface JobRow {
  id: string;
  title: string;
  category: string;
  status: string | null;
  job_type: string | null;
  location_address: string | null;
  pay_min: number | null;
  pay_max: number | null;
  pay_type: string | null;
  created_at: string;
  employer_id: string;
  employer_name: string;
  application_count: number;
}

export default function AdminJobs() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    const [jobsRes, appsRes, profilesRes] = await Promise.all([
      supabase.from("jobs").select("*").order("created_at", { ascending: false }),
      supabase.from("job_applications").select("job_id"),
      supabase.from("profiles").select("id, full_name"),
    ]);

    const appCounts = new Map<string, number>();
    (appsRes.data || []).forEach((a) => appCounts.set(a.job_id, (appCounts.get(a.job_id) || 0) + 1));
    const nameMap = new Map((profilesRes.data || []).map((p) => [p.id, p.full_name || "Unknown"]));

    setJobs((jobsRes.data || []).map((j) => ({
      ...j,
      employer_name: nameMap.get(j.employer_id) || "Unknown",
      application_count: appCounts.get(j.id) || 0,
    })));
    setLoading(false);
  };

  const closeJob = async (id: string) => {
    const { error } = await supabase.from("jobs").update({ status: "closed" }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setJobs(jobs.map((j) => j.id === id ? { ...j, status: "closed" } : j));
    toast({ title: "Job closed" });
  };

  const deleteJob = async (id: string) => {
    const { error } = await supabase.from("jobs").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setJobs(jobs.filter((j) => j.id !== id));
    toast({ title: "Job deleted" });
  };

  const filtered = jobs.filter((j) => {
    if (search) {
      const q = search.toLowerCase();
      if (!(j.title.toLowerCase().includes(q) || j.employer_name.toLowerCase().includes(q) || j.category.toLowerCase().includes(q))) return false;
    }
    if (statusFilter !== "all" && j.status !== statusFilter) return false;
    return true;
  });

  const formatPay = (j: JobRow) => {
    if (!j.pay_min && !j.pay_max) return "Negotiable";
    const min = j.pay_min ? `${j.pay_min}` : "";
    const max = j.pay_max ? `${j.pay_max}` : "";
    const type = j.pay_type === "hourly" ? "/hr" : j.pay_type === "daily" ? "/day" : "";
    return min && max ? `${min}-${max}${type}` : `${min || max}${type}`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        {[1, 2, 3].map((i) => <Card key={i} className="p-5 animate-pulse"><div className="h-16 bg-muted rounded" /></Card>)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-foreground">Job Moderation</h1>
        <p className="text-muted-foreground text-sm mt-1">Review and moderate job listings ({jobs.length} total)</p>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search jobs, employers, categories..." className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Briefcase className="mx-auto text-muted-foreground mb-3" size={48} />
          <p className="text-muted-foreground">No jobs found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((j) => (
            <Card key={j.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-foreground text-sm">{j.title}</p>
                  <p className="text-xs text-muted-foreground">by {j.employer_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">{j.category}</Badge>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    j.status === "open" ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400" :
                    "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                  }`}>
                    {j.status === "open" ? "Open" : "Closed"}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                {j.location_address && <span className="flex items-center gap-1"><MapPin size={12} />{j.location_address}</span>}
                <span className="flex items-center gap-1"><IndianRupee size={12} />{formatPay(j)}</span>
                <span>{j.application_count} application{j.application_count !== 1 ? "s" : ""}</span>
                <span>{new Date(j.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex gap-2">
                {j.status === "open" && (
                  <Button size="sm" variant="outline" onClick={() => closeJob(j.id)} className="gap-1">
                    <XCircle size={14} /> Close
                  </Button>
                )}
                <Button size="sm" variant="outline" className="text-destructive hover:text-destructive gap-1" onClick={() => deleteJob(j.id)}>
                  <Trash2 size={14} /> Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
