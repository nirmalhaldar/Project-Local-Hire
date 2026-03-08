import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, IndianRupee, Clock, Users, Trash2, XCircle, Eye } from "lucide-react";

interface Job {
  id: string;
  title: string;
  description: string | null;
  category: string;
  job_type: string | null;
  location_address: string | null;
  pay_min: number | null;
  pay_max: number | null;
  pay_type: string | null;
  status: string | null;
  skills_required: string[];
  roles_required: string[];
  created_at: string;
}

interface Application {
  id: string;
  worker_id: string;
  status: string;
  created_at: string;
  worker_name?: string;
  worker_email?: string;
  worker_phone?: string;
  worker_skills?: string[];
  worker_roles?: string[];
}

export default function ManageListings() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applicants, setApplicants] = useState<Application[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  useEffect(() => {
    if (user) fetchJobs();
  }, [user]);

  const fetchJobs = async () => {
    const { data } = await supabase
      .from("jobs")
      .select("*")
      .eq("employer_id", user!.id)
      .order("created_at", { ascending: false });
    if (data) setJobs(data);
    setLoading(false);
  };

  const handleCloseJob = async (jobId: string) => {
    const { error } = await supabase.from("jobs").update({ status: "closed" }).eq("id", jobId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      setJobs(jobs.map((j) => j.id === jobId ? { ...j, status: "closed" } : j));
      toast({ title: "Job closed", description: "This listing is no longer visible to workers." });
    }
  };

  const handleReopenJob = async (jobId: string) => {
    const { error } = await supabase.from("jobs").update({ status: "open" }).eq("id", jobId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      setJobs(jobs.map((j) => j.id === jobId ? { ...j, status: "open" } : j));
      toast({ title: "Job reopened" });
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    const { error } = await supabase.from("jobs").delete().eq("id", jobId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      setJobs(jobs.filter((j) => j.id !== jobId));
      toast({ title: "Job deleted" });
    }
  };

  const viewApplicants = async (job: Job) => {
    setSelectedJob(job);
    setLoadingApplicants(true);
    
    const { data: apps } = await supabase
      .from("job_applications")
      .select("*")
      .eq("job_id", job.id)
      .order("created_at", { ascending: false });

    if (apps && apps.length > 0) {
      const workerIds = apps.map((a) => a.worker_id);
      const [profilesRes, skillsRes] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, phone, roles").in("id", workerIds),
        supabase.from("worker_skills").select("user_id, skill").in("user_id", workerIds),
      ]);

      const profileMap = new Map((profilesRes.data || []).map((p) => [p.id, p]));
      const skillsMap = new Map<string, string[]>();
      (skillsRes.data || []).forEach((s) => {
        if (!skillsMap.has(s.user_id)) skillsMap.set(s.user_id, []);
        skillsMap.get(s.user_id)!.push(s.skill);
      });

      setApplicants(apps.map((a) => {
        const profile = profileMap.get(a.worker_id);
        return {
          ...a,
          worker_name: profile?.full_name || "Unknown",
          worker_email: profile?.email || "",
          worker_phone: profile?.phone || "",
          worker_skills: skillsMap.get(a.worker_id) || [],
          worker_roles: (profile as any)?.roles || [],
        };
      }));
    } else {
      setApplicants([]);
    }
    setLoadingApplicants(false);
  };

  const handleUpdateApplication = async (appId: string, status: "accepted" | "rejected") => {
    const { error } = await supabase.from("job_applications").update({ status, updated_at: new Date().toISOString() }).eq("id", appId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      setApplicants(applicants.map((a) => a.id === appId ? { ...a, status } : a));
      toast({ title: `Application ${status}` });
    }
  };

  const formatPay = (job: Job) => {
    if (!job.pay_min && !job.pay_max) return "Negotiable";
    const min = job.pay_min ? `₹${job.pay_min}` : "";
    const max = job.pay_max ? `₹${job.pay_max}` : "";
    const type = job.pay_type === "hourly" ? "/hr" : job.pay_type === "daily" ? "/day" : "";
    return min && max ? `${min} - ${max}${type}` : `${min || max}${type}`;
  };

  const jobTypeLabel = (t: string | null) => {
    const map: Record<string, string> = { gig: "Gig", part_time: "Part-Time", full_time: "Full-Time", contract: "Contract" };
    return map[t || ""] || "Gig";
  };

  const statusColor = (s: string | null) => {
    if (s === "open") return "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400";
    if (s === "closed") return "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400";
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400";
  };

  const appStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      pending: { label: "Pending", className: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" },
      accepted: { label: "Accepted", className: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400" },
      rejected: { label: "Rejected", className: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400" },
    };
    const s = map[status] || map.pending;
    return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.className}`}>{s.label}</span>;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        {[1, 2, 3].map((i) => <Card key={i} className="p-5 animate-pulse"><div className="h-20 bg-muted rounded" /></Card>)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-foreground">My Listings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your job postings and view applicants</p>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-16">
          <Users className="mx-auto text-muted-foreground mb-3" size={48} />
          <h3 className="font-display font-semibold text-lg text-foreground mb-1">No jobs posted yet</h3>
          <p className="text-muted-foreground text-sm">Post your first job to start finding workers.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground text-base">{job.title}</h3>
                  <div className="flex gap-1.5 mt-1">
                    <Badge variant="secondary" className="text-xs">{job.category}</Badge>
                    <Badge variant="outline" className="text-xs">{jobTypeLabel(job.job_type)}</Badge>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(job.status)}`}>
                      {job.status === "open" ? "Open" : job.status === "closed" ? "Closed" : "Filled"}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock size={12} />{new Date(job.created_at).toLocaleDateString()}
                </span>
              </div>

              {job.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{job.description}</p>}

              <div className="flex flex-wrap gap-3 text-sm mb-4">
                {job.location_address && <span className="flex items-center gap-1 text-muted-foreground"><MapPin size={14} />{job.location_address}</span>}
                <span className="flex items-center gap-1 text-primary font-medium"><IndianRupee size={14} />{formatPay(job)}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => viewApplicants(job)}>
                  <Eye size={14} className="mr-1.5" /> View Applicants
                </Button>
                {job.status === "open" ? (
                  <Button size="sm" variant="outline" onClick={() => handleCloseJob(job.id)}>
                    <XCircle size={14} className="mr-1.5" /> Close
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => handleReopenJob(job.id)}>
                    Reopen
                  </Button>
                )}
                <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => handleDeleteJob(job.id)}>
                  <Trash2 size={14} className="mr-1.5" /> Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Applicants Dialog */}
      <Dialog open={!!selectedJob} onOpenChange={(open) => !open && setSelectedJob(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Applicants for: {selectedJob?.title}</DialogTitle>
          </DialogHeader>

          {loadingApplicants ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <div key={i} className="h-20 bg-muted rounded animate-pulse" />)}
            </div>
          ) : applicants.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto text-muted-foreground mb-2" size={32} />
              <p className="text-muted-foreground text-sm">No applicants yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applicants.map((app) => (
                <Card key={app.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-foreground">{app.worker_name}</p>
                      <p className="text-xs text-muted-foreground">{app.worker_email} {app.worker_phone && `· ${app.worker_phone}`}</p>
                    </div>
                    {appStatusBadge(app.status)}
                  </div>

                  {app.worker_roles && app.worker_roles.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {app.worker_roles.map((r) => <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>)}
                    </div>
                  )}

                  {app.worker_skills && app.worker_skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {app.worker_skills.map((s) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground mb-3">Applied {new Date(app.created_at).toLocaleDateString()}</p>

                  {app.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleUpdateApplication(app.id, "accepted")}>Accept</Button>
                      <Button size="sm" variant="outline" onClick={() => handleUpdateApplication(app.id, "rejected")}>Reject</Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
