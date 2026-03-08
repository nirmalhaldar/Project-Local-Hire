import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, Send, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface HiredWorker {
  worker_id: string;
  worker_name: string;
  job_id: string;
  job_title: string;
  already_rated: boolean;
}

interface RatingForm {
  rating: number;
  punctuality: number;
  skill_performance: number;
  behavior: number;
  review: string;
}

const StarRating = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => (
  <div className="flex items-center gap-2">
    <span className="text-xs text-muted-foreground w-28">{label}</span>
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button" onClick={() => onChange(s)} className="p-0.5">
          <Star size={18} className={s <= value ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"} />
        </button>
      ))}
    </div>
  </div>
);

export default function WorkerRatings() {
  const { user } = useAuth();
  const [hiredWorkers, setHiredWorkers] = useState<HiredWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingTarget, setRatingTarget] = useState<HiredWorker | null>(null);
  const [form, setForm] = useState<RatingForm>({ rating: 0, punctuality: 0, skill_performance: 0, behavior: 0, review: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) fetchHiredWorkers();
  }, [user]);

  const fetchHiredWorkers = async () => {
    const { data: jobs } = await supabase.from("jobs").select("id, title").eq("employer_id", user!.id);
    if (!jobs || jobs.length === 0) { setLoading(false); return; }

    const jobIds = jobs.map((j) => j.id);
    const jobMap = new Map(jobs.map((j) => [j.id, j.title]));

    const { data: apps } = await supabase
      .from("job_applications")
      .select("worker_id, job_id")
      .in("job_id", jobIds)
      .eq("status", "accepted");

    if (!apps || apps.length === 0) { setLoading(false); return; }

    const workerIds = [...new Set(apps.map((a) => a.worker_id))];
    const [profilesRes, ratingsRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name").in("id", workerIds),
      supabase.from("worker_ratings").select("worker_id, job_id").eq("employer_id", user!.id),
    ]);

    const nameMap = new Map((profilesRes.data || []).map((p) => [p.id, p.full_name || "Unknown"]));
    const ratedSet = new Set((ratingsRes.data || []).map((r) => `${r.worker_id}:${r.job_id}`));

    setHiredWorkers(apps.map((a) => ({
      worker_id: a.worker_id,
      worker_name: nameMap.get(a.worker_id) || "Unknown",
      job_id: a.job_id,
      job_title: jobMap.get(a.job_id) || "Unknown",
      already_rated: ratedSet.has(`${a.worker_id}:${a.job_id}`),
    })));
    setLoading(false);
  };

  const handleSubmitRating = async () => {
    if (!ratingTarget || form.rating === 0) {
      toast({ title: "Please provide an overall rating", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("worker_ratings").insert({
      employer_id: user!.id,
      worker_id: ratingTarget.worker_id,
      job_id: ratingTarget.job_id,
      rating: form.rating,
      punctuality: form.punctuality || null,
      skill_performance: form.skill_performance || null,
      behavior: form.behavior || null,
      review: form.review.trim() || null,
    } as any);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Rating submitted!", description: `You rated ${ratingTarget.worker_name}.` });
      setHiredWorkers(hiredWorkers.map((w) =>
        w.worker_id === ratingTarget.worker_id && w.job_id === ratingTarget.job_id
          ? { ...w, already_rated: true } : w
      ));
      setRatingTarget(null);
      setForm({ rating: 0, punctuality: 0, skill_performance: 0, behavior: 0, review: "" });
    }
    setSubmitting(false);
  };

  const unrated = hiredWorkers.filter((w) => !w.already_rated);
  const rated = hiredWorkers.filter((w) => w.already_rated);

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
        <h1 className="font-display font-bold text-2xl text-foreground">Rate Workers</h1>
        <p className="text-muted-foreground text-sm mt-1">Review hired workers based on performance, punctuality, and behavior</p>
      </div>

      {/* Rating Form */}
      {ratingTarget && (
        <Card className="p-6 border-primary/20 space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {ratingTarget.worker_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-foreground">{ratingTarget.worker_name}</p>
              <p className="text-xs text-muted-foreground">For: {ratingTarget.job_title}</p>
            </div>
          </div>

          <div className="space-y-2">
            <StarRating value={form.rating} onChange={(v) => setForm({ ...form, rating: v })} label="Overall Rating *" />
            <StarRating value={form.punctuality} onChange={(v) => setForm({ ...form, punctuality: v })} label="Punctuality" />
            <StarRating value={form.skill_performance} onChange={(v) => setForm({ ...form, skill_performance: v })} label="Skill Performance" />
            <StarRating value={form.behavior} onChange={(v) => setForm({ ...form, behavior: v })} label="Behavior" />
          </div>

          <Textarea
            value={form.review}
            onChange={(e) => setForm({ ...form, review: e.target.value })}
            placeholder="Write your review about this worker's performance..."
            rows={3}
          />

          <div className="flex gap-2">
            <Button onClick={handleSubmitRating} disabled={submitting || form.rating === 0} className="gap-1.5">
              <Send size={14} /> {submitting ? "Submitting..." : "Submit Rating"}
            </Button>
            <Button variant="outline" onClick={() => { setRatingTarget(null); setForm({ rating: 0, punctuality: 0, skill_performance: 0, behavior: 0, review: "" }); }}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Workers to Rate */}
      {unrated.length > 0 && (
        <div>
          <h2 className="font-semibold text-foreground mb-3">Pending Reviews ({unrated.length})</h2>
          <div className="space-y-3">
            {unrated.map((w, i) => (
              <Card key={`${w.worker_id}-${w.job_id}-${i}`} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {w.worker_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground text-sm">{w.worker_name}</p>
                    <p className="text-xs text-muted-foreground">{w.job_title}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setRatingTarget(w)} className="gap-1.5">
                  <Star size={14} /> Rate
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Already Rated */}
      {rated.length > 0 && (
        <div>
          <h2 className="font-semibold text-foreground mb-3">Completed Reviews ({rated.length})</h2>
          <div className="space-y-3">
            {rated.map((w, i) => (
              <Card key={`${w.worker_id}-${w.job_id}-${i}`} className="p-4 flex items-center justify-between opacity-70">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-muted text-muted-foreground text-sm font-semibold">
                      {w.worker_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground text-sm">{w.worker_name}</p>
                    <p className="text-xs text-muted-foreground">{w.job_title}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="gap-1"><CheckCircle size={12} /> Rated</Badge>
              </Card>
            ))}
          </div>
        </div>
      )}

      {hiredWorkers.length === 0 && (
        <div className="text-center py-16">
          <Star className="mx-auto text-muted-foreground mb-3" size={48} />
          <h3 className="font-display font-semibold text-lg text-foreground mb-1">No workers to rate</h3>
          <p className="text-muted-foreground text-sm">Once you accept applicants, you can rate their performance here.</p>
        </div>
      )}
    </div>
  );
}
