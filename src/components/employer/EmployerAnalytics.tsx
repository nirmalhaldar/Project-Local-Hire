import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Briefcase, Users, CheckCircle, XCircle, Clock } from "lucide-react";

export default function EmployerAnalytics() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalJobs: 0, openJobs: 0, totalApplicants: 0, accepted: 0, rejected: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchStats();
  }, [user]);

  const fetchStats = async () => {
    const { data: jobs } = await supabase.from("jobs").select("id, status").eq("employer_id", user!.id);
    if (!jobs) { setLoading(false); return; }

    const jobIds = jobs.map((j) => j.id);
    const { data: apps } = jobIds.length > 0
      ? await supabase.from("job_applications").select("id, status").in("job_id", jobIds)
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
    setLoading(false);
  };

  const statCards = [
    { label: "Total Jobs", value: stats.totalJobs, icon: Briefcase, color: "text-primary", bg: "bg-primary/10" },
    { label: "Open Jobs", value: stats.openJobs, icon: Briefcase, color: "text-green-600", bg: "bg-green-100 dark:bg-green-950/30" },
    { label: "Total Applicants", value: stats.totalApplicants, icon: Users, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-950/30" },
    { label: "Accepted", value: stats.accepted, icon: CheckCircle, color: "text-green-600", bg: "bg-green-100 dark:bg-green-950/30" },
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
        <h1 className="font-display font-bold text-2xl text-foreground">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of your hiring activity</p>
      </div>

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
    </div>
  );
}
