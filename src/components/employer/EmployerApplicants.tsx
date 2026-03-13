import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Users, MessageCircle, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ApplicationWithJob {
  id: string;
  worker_id: string;
  job_id: string;
  status: string;
  created_at: string;
  job_title: string;
  job_category: string;
  worker_name: string;
  worker_email: string;
  worker_phone: string;
  worker_roles: string[];
  worker_skills: string[];
}

export default function EmployerApplicants() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<ApplicationWithJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "rejected">("all");
  const [messagingWorker, setMessagingWorker] = useState<ApplicationWithJob | null>(null);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    if (user) fetchApplications();
  }, [user]);

  const fetchApplications = async () => {
    const { data: jobs } = await supabase.from("jobs").select("id, title, category").eq("employer_id", user!.id);
    if (!jobs || jobs.length === 0) { setLoading(false); return; }

    const jobIds = jobs.map((j) => j.id);
    const jobMap = new Map(jobs.map((j) => [j.id, j]));

    const { data: apps } = await supabase
      .from("job_applications")
      .select("*")
      .in("job_id", jobIds)
      .order("created_at", { ascending: false });

    if (!apps || apps.length === 0) { setLoading(false); return; }

    const workerIds = [...new Set(apps.map((a) => a.worker_id))];
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

    setApplications(apps.map((a) => {
      const job = jobMap.get(a.job_id);
      const profile = profileMap.get(a.worker_id);
      return {
        ...a,
        job_title: job?.title || "Unknown",
        job_category: job?.category || "",
        worker_name: profile?.full_name || "Unknown",
        worker_email: profile?.email || "",
        worker_phone: profile?.phone || "",
        worker_roles: (profile as any)?.roles || [],
        worker_skills: skillsMap.get(a.worker_id) || [],
      };
    }));
    setLoading(false);
  };

  const handleSelectWorker = async (app: ApplicationWithJob) => {
    const { error } = await supabase.from("job_applications").update({ status: "accepted", updated_at: new Date().toISOString() }).eq("id", app.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    
    setApplications(applications.map((a) => a.id === app.id ? { ...a, status: "accepted" } : a));
    toast({ title: "Worker selected!", description: "You can now send them a message." });
    
    setMessagingWorker(app);
    setMessageText(`Hello ${app.worker_name || "there"}, you have been selected for the role. Can we talk more about it?`);
  };

  const handleUpdate = async (appId: string, status: "accepted" | "rejected") => {
    const { error } = await supabase.from("job_applications").update({ status, updated_at: new Date().toISOString() }).eq("id", appId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      setApplications(applications.map((a) => a.id === appId ? { ...a, status } : a));
      toast({ title: `Application ${status}` });
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !messagingWorker) return;
    setSendingMessage(true);
    
    const { error } = await supabase.from("messages").insert({
      sender_id: user!.id,
      receiver_id: messagingWorker.worker_id,
      content: messageText.trim(),
    });
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Message sent!", description: "Your message has been sent to the worker." });
      setMessagingWorker(null);
      setMessageText("");
    }
    setSendingMessage(false);
  };

  const filtered = filter === "all" ? applications : applications.filter((a) => a.status === filter);

  const statusBadge = (status: string) => {
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
        <h1 className="font-display font-bold text-2xl text-foreground">All Applicants</h1>
        <p className="text-muted-foreground text-sm mt-1">Review and manage applications across all your jobs</p>
      </div>

      <div className="flex gap-2">
        {(["all", "pending", "accepted", "rejected"] as const).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} className="capitalize">
            {f} {f !== "all" && `(${applications.filter((a) => a.status === f).length})`}
            {f === "all" && ` (${applications.length})`}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users className="mx-auto text-muted-foreground mb-3" size={48} />
          <h3 className="font-display font-semibold text-lg text-foreground mb-1">No applications</h3>
          <p className="text-muted-foreground text-sm">
            {applications.length === 0 ? "You haven't received any applications yet." : "No applications match this filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => (
            <Card key={app.id} className="p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-foreground">{app.worker_name}</p>
                  <p className="text-xs text-muted-foreground">{app.worker_email} {app.worker_phone && `· ${app.worker_phone}`}</p>
                </div>
                {statusBadge(app.status)}
              </div>

              <p className="text-sm text-muted-foreground mb-2">
                Applied for: <span className="font-medium text-foreground">{app.job_title}</span>
                <Badge variant="secondary" className="ml-2 text-xs">{app.job_category}</Badge>
              </p>

              {app.worker_roles.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {app.worker_roles.map((r) => <Badge key={r} variant="outline" className="text-xs">{r}</Badge>)}
                </div>
              )}

              {app.worker_skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {app.worker_skills.map((s) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                </div>
              )}

              <p className="text-xs text-muted-foreground mb-3">Applied {new Date(app.created_at).toLocaleDateString()}</p>

              {app.status === "pending" && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleSelectWorker(app)}>Accept</Button>
                  <Button size="sm" variant="outline" onClick={() => handleUpdate(app.id, "rejected")}>Reject</Button>
                </div>
              )}
              {app.status === "accepted" && (
                <Button size="sm" variant="outline" onClick={() => { setMessagingWorker(app); setMessageText(""); }}>
                  <MessageCircle size={14} className="mr-1.5" /> Message
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!messagingWorker} onOpenChange={(open) => !open && setMessagingWorker(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Message {messagingWorker?.worker_name}</DialogTitle>
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
