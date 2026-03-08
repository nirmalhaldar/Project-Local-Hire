import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Users, Briefcase, FileText, Star, TrendingUp, Flag } from "lucide-react";

export default function AdminOverview() {
  const [stats, setStats] = useState({
    totalUsers: 0, workers: 0, employers: 0, admins: 0,
    totalJobs: 0, openJobs: 0,
    totalApplications: 0,
    totalReports: 0, pendingReports: 0,
    totalRatings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [rolesRes, jobsRes, appsRes, reportsRes, workerRatingsRes, employerRatingsRes] = await Promise.all([
      supabase.from("user_roles").select("role"),
      supabase.from("jobs").select("id, status"),
      supabase.from("job_applications").select("id"),
      supabase.from("job_reports").select("id, status"),
      supabase.from("worker_ratings").select("id"),
      supabase.from("employer_ratings").select("id"),
    ]);

    const roles = rolesRes.data || [];
    const jobs = jobsRes.data || [];
    const reports = reportsRes.data || [];

    setStats({
      totalUsers: roles.length,
      workers: roles.filter((r) => r.role === "worker").length,
      employers: roles.filter((r) => r.role === "employer").length,
      admins: roles.filter((r) => r.role === "admin").length,
      totalJobs: jobs.length,
      openJobs: jobs.filter((j) => j.status === "open").length,
      totalApplications: (appsRes.data || []).length,
      totalReports: reports.length,
      pendingReports: reports.filter((r) => r.status === "pending").length,
      totalRatings: (workerRatingsRes.data || []).length + (employerRatingsRes.data || []).length,
    });
    setLoading(false);
  };

  const cards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-primary", bg: "bg-primary/10", sub: `${stats.workers} workers · ${stats.employers} employers · ${stats.admins} admins` },
    { label: "Total Jobs", value: stats.totalJobs, icon: Briefcase, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-950/30", sub: `${stats.openJobs} open` },
    { label: "Applications", value: stats.totalApplications, icon: FileText, color: "text-green-600", bg: "bg-green-100 dark:bg-green-950/30", sub: "" },
    { label: "Reports", value: stats.totalReports, icon: Flag, color: "text-red-500", bg: "bg-red-100 dark:bg-red-950/30", sub: `${stats.pendingReports} pending` },
    { label: "Ratings", value: stats.totalRatings, icon: Star, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-950/30", sub: "" },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5].map((i) => <Card key={i} className="p-5 animate-pulse"><div className="h-20 bg-muted rounded" /></Card>)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-foreground">Platform Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">Key metrics across the platform</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="p-5">
            <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center mb-3`}>
              <c.icon className={c.color} size={20} />
            </div>
            <p className="text-3xl font-bold text-foreground">{c.value}</p>
            <p className="text-sm text-muted-foreground">{c.label}</p>
            {c.sub && <p className="text-xs text-muted-foreground mt-1">{c.sub}</p>}
          </Card>
        ))}
      </div>
    </div>
  );
}
