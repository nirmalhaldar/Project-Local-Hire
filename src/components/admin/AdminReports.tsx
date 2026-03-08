import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Flag, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface Report {
  id: string;
  job_id: string;
  reporter_id: string;
  reason: string;
  description: string | null;
  status: string | null;
  created_at: string;
  job_title: string;
  reporter_name: string;
}

export default function AdminReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "reviewed" | "dismissed">("all");

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    const { data: reps } = await supabase.from("job_reports").select("*").order("created_at", { ascending: false });
    if (!reps || reps.length === 0) { setLoading(false); return; }

    const jobIds = [...new Set(reps.map((r) => r.job_id))];
    const reporterIds = [...new Set(reps.map((r) => r.reporter_id))];

    const [jobsRes, profilesRes] = await Promise.all([
      supabase.from("jobs").select("id, title").in("id", jobIds),
      supabase.from("profiles").select("id, full_name").in("id", reporterIds),
    ]);

    const jobMap = new Map((jobsRes.data || []).map((j) => [j.id, j.title]));
    const nameMap = new Map((profilesRes.data || []).map((p) => [p.id, p.full_name || "Unknown"]));

    setReports(reps.map((r) => ({
      ...r,
      job_title: jobMap.get(r.job_id) || "Deleted Job",
      reporter_name: nameMap.get(r.reporter_id) || "Unknown",
    })));
    setLoading(false);
  };

  const updateStatus = async (id: string, status: "reviewed" | "dismissed") => {
    const { error } = await supabase.from("job_reports").update({ status }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setReports(reports.map((r) => r.id === id ? { ...r, status } : r));
    toast({ title: `Report ${status}` });
  };

  const removeJob = async (jobId: string, reportId: string) => {
    const { error } = await supabase.from("jobs").delete().eq("id", jobId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    await updateStatus(reportId, "reviewed");
    toast({ title: "Job removed", description: "The reported job has been deleted." });
  };

  const filtered = filter === "all" ? reports : reports.filter((r) => r.status === filter);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        {[1, 2].map((i) => <Card key={i} className="p-5 animate-pulse"><div className="h-20 bg-muted rounded" /></Card>)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-foreground">Job Reports</h1>
        <p className="text-muted-foreground text-sm mt-1">Review fraud reports and take action</p>
      </div>

      <div className="flex gap-2">
        {(["all", "pending", "reviewed", "dismissed"] as const).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} className="capitalize">
            {f} ({f === "all" ? reports.length : reports.filter((r) => r.status === f).length})
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Flag className="mx-auto text-muted-foreground mb-3" size={48} />
          <p className="text-muted-foreground">{reports.length === 0 ? "No reports yet" : "No reports match this filter"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="text-amber-500" size={16} />
                    <p className="font-medium text-foreground text-sm">{r.reason}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Job: <span className="font-medium text-foreground">{r.job_title}</span> · Reported by: {r.reporter_name}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  r.status === "pending" ? "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" :
                  r.status === "reviewed" ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {r.status}
                </span>
              </div>

              {r.description && <p className="text-sm text-muted-foreground mb-3">{r.description}</p>}
              <p className="text-xs text-muted-foreground mb-3">{new Date(r.created_at).toLocaleString()}</p>

              {r.status === "pending" && (
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" onClick={() => removeJob(r.job_id, r.id)} className="gap-1">
                    Remove Job
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "reviewed")} className="gap-1">
                    <CheckCircle size={14} /> Mark Reviewed
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "dismissed")} className="gap-1">
                    <XCircle size={14} /> Dismiss
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
