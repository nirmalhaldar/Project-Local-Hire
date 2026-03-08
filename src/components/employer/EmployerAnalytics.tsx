import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Users, CheckCircle, XCircle, Clock, BarChart3, Eye } from "lucide-react";

interface JobStat {
  id: string;
  title: string;
  status: string | null;
  category: string;
  created_at: string;
  vacancies: number;
  total_applications: number;
  accepted: number;
  rejected: number;
  pending: number;
}

export default function EmployerAnalytics() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalJobs: 0, openJobs: 0, totalApplicants: 0, accepted: 0, rejected: 0, pending: 0 });
  const [jobStats, setJobStats] = useState<JobStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchStats();
  }, [user]);

  const fetchStats = async () => {
    const { data: jobs } = await supabase.from("jobs").select("id, title, status, category, created_at, vacancies").eq("employer_id", user!.id);
    if (!jobs) { setLoading(false); return; }

    const jobIds = jobs.map((j) => j.id);
    const { data: apps } = jobIds.length > 0
      ? await supabase.from("job_applications").select("id, status, job_id, created_at").in("job_id", jobIds)
      : { data: [] };

    const appList = apps || [];

    setStats({
      totalJobs: jobs.length,
      openJobs: jobs.filter((j) => j.status === "open").length,
      totalApplicants: appList.length,
      accepted: appList.filter((a) => a.status === "accepted").length,
      rejected: appList.filter((a) => a.status === "rejected").length,
      pending: appList.filter((a) => a.status === "pending").length,
    });

    // Per-job stats
    const perJob: JobStat[] = jobs.map((j) => {
      const jobApps = appList.filter((a) => a.job_id === j.id);
      return {
        id: j.id,
        title: j.title,
        status: j.status,
        category: j.category,
        created_at: j.created_at,
        vacancies: (j as any).vacancies || 1,
        total_applications: jobApps.length,
        accepted: jobApps.filter((a) => a.status === "accepted").length,
        rejected: jobApps.filter((a) => a.status === "rejected").length,
        pending: jobApps.filter((a) => a.status === "pending").length,
      };
    });
    setJobStats(perJob);
    setLoading(false);
  };

  const statCards = [
    { label: "Total Jobs", value: stats.totalJobs, icon: Briefcase, color: "text-primary", bg: "bg-primary/10" },
    { label: "Open Jobs", value: stats.openJobs, icon: Briefcase, color: "text-green-600", bg: "bg-green-100 dark:bg-green-950/30" },
    { label: "Total Applicants", value: stats.totalApplicants, icon: Users, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-950/30" },
    { label: "Hired", value: stats.accepted, icon: CheckCircle, color: "text-green-600", bg: "bg-green-100 dark:bg-green-950/30" },
    { label: "Rejected", value: stats.rejected, icon: XCircle, color: "text-red-500", bg: "bg-red-100 dark:bg-red-950/30" },
    { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-950/30" },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <Card key={i} className="p-4 animate-pulse"><div className="h-16 bg-muted rounded" /></Card>)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-foreground">Hiring Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of your hiring activity and per-job performance</p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={stat.color} size={20} />
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Per-Job Analytics */}
      {jobStats.length > 0 && (
        <div>
          <h2 className="font-semibold text-foreground text-lg flex items-center gap-2 mb-4">
            <BarChart3 size={18} /> Per-Job Breakdown
          </h2>
          <div className="space-y-3">
            {jobStats.map((job) => (
              <Card key={job.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-foreground text-sm">{job.title}</p>
                    <div className="flex gap-1.5 mt-1">
                      <Badge variant="secondary" className="text-xs">{job.category}</Badge>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        job.status === "open" ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400" :
                        "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                      }`}>
                        {job.status === "open" ? "Open" : "Closed"}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(job.created_at).toLocaleDateString()}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3">
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <p className="text-lg font-bold text-foreground">{job.vacancies}</p>
                    <p className="text-xs text-muted-foreground">Vacancies</p>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <p className="text-lg font-bold text-foreground">{job.total_applications}</p>
                    <p className="text-xs text-muted-foreground">Applications</p>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <p className="text-lg font-bold text-green-600">{job.accepted}</p>
                    <p className="text-xs text-muted-foreground">Hired</p>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <p className="text-lg font-bold text-red-500">{job.rejected}</p>
                    <p className="text-xs text-muted-foreground">Rejected</p>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <p className="text-lg font-bold text-amber-600">{job.pending}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
