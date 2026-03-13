import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Briefcase, Bookmark, CheckCircle, XCircle, Clock, TrendingUp, MessageCircle, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Stats {
  applied: number;
  saved: number;
  accepted: number;
  rejected: number;
  pending: number;
}

export default function WorkerAnalytics() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ applied: 0, saved: 0, accepted: 0, rejected: 0, pending: 0 });
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagingJob, setMessagingJob] = useState<any>(null);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    if (user) fetchStats();
  }, [user]);

  const fetchStats = async () => {
    const [appsRes, savedRes] = await Promise.all([
      supabase.from("job_applications").select("id, status, created_at, job_id").eq("worker_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("saved_jobs").select("id").eq("user_id", user!.id),
    ]);

    const apps = appsRes.data || [];
    const saved = savedRes.data || [];

    setStats({
      applied: apps.length,
      saved: saved.length,
      accepted: apps.filter((a) => a.status === "accepted").length,
      rejected: apps.filter((a) => a.status === "rejected").length,
      pending: apps.filter((a) => a.status === "pending").length,
    });

    // Fetch job details for recent applications
    if (apps.length > 0) {
      const jobIds = apps.slice(0, 10).map((a) => a.job_id);
      const { data: jobsData } = await supabase.from("jobs").select("id, title, category, employer_id").in("id", jobIds);
      const jobMap = new Map((jobsData || []).map((j) => [j.id, j]));
      
      // Get employer names
      const employerIds = [...new Set((jobsData || []).map((j) => j.employer_id))];
      const { data: employerProfiles } = await supabase.from("profiles").select("id, company_name, full_name").in("id", employerIds);
      const employerMap = new Map((employerProfiles || []).map((p) => [p.id, p.company_name || p.full_name || "Employer"]));
      
      setRecentApplications(apps.slice(0, 10).map((a) => ({ 
        ...a, 
        job: jobMap.get(a.job_id),
        employer_name: employerMap.get(jobMap.get(a.job_id)?.employer_id) || "Employer"
      })));
    }

    setLoading(false);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !messagingJob) return;
    setSendingMessage(true);
    
    const { error } = await supabase.from("messages").insert({
      sender_id: user!.id,
      receiver_id: messagingJob.job.employer_id,
      content: messageText.trim(),
    });
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Message sent!", description: "Your message has been sent to the employer." });
      setMessagingJob(null);
      setMessageText("");
    }
    setSendingMessage(false);
  };

  const statCards = [
    { label: "Applied Jobs", value: stats.applied, icon: Briefcase, color: "text-primary", bg: "bg-primary/10" },
    { label: "Saved Jobs", value: stats.saved, icon: Bookmark, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-950/30" },
    { label: "Accepted", value: stats.accepted, icon: CheckCircle, color: "text-green-600", bg: "bg-green-100 dark:bg-green-950/30" },
    { label: "Rejected", value: stats.rejected, icon: XCircle, color: "text-red-500", bg: "bg-red-100 dark:bg-red-950/30" },
    { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-950/30" },
  ];

  const statusBadge = (status: string) => {
    const map: Record<string, { text: string; className: string }> = {
      pending: { text: "Pending", className: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" },
      accepted: { text: "Accepted", className: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400" },
      rejected: { text: "Rejected", className: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400" },
    };
    const s = map[status] || map.pending;
    return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.className}`}>{s.text}</span>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => <Card key={i} className="p-4 animate-pulse"><div className="h-16 bg-muted rounded" /></Card>)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-foreground">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Track your job applications and activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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

      {/* Recent Applications */}
      <Card className="p-6">
        <h2 className="font-semibold text-foreground text-lg mb-4 flex items-center gap-2">
          <TrendingUp size={18} /> Recent Applications
        </h2>
        {recentApplications.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4 text-center">No applications yet. Start applying to jobs!</p>
        ) : (
          <div className="divide-y divide-border">
            {recentApplications.map((app) => (
              <div key={app.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-foreground text-sm">{app.job?.title || "Unknown Job"}</p>
                  <p className="text-xs text-muted-foreground">{app.job?.category} · {new Date(app.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  {statusBadge(app.status)}
                  {app.status === "accepted" && (
                    <Button size="sm" variant="outline" onClick={() => { setMessagingJob(app); setMessageText(""); }}>
                      <MessageCircle size={14} className="mr-1.5" /> Message
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Message Employer Dialog */}
      <Dialog open={!!messagingJob} onOpenChange={(open) => !open && setMessagingJob(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Message {messagingJob?.employer_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message..."
              rows={4}
            />
            <Button onClick={handleSendMessage} disabled={sendingMessage || !messageText.trim()} className="w-full">
              <Send size={16} className="mr-2" />
              {sendingMessage ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
