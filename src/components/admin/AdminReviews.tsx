import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { Star, Trash2 } from "lucide-react";

interface ReviewRow {
  id: string;
  type: "worker" | "employer";
  rating: number;
  review: string | null;
  created_at: string;
  reviewer_name: string;
  target_name: string;
  job_title: string;
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    const [wrRes, erRes] = await Promise.all([
      supabase.from("worker_ratings").select("*").order("created_at", { ascending: false }),
      supabase.from("employer_ratings").select("*").order("created_at", { ascending: false }),
    ]);

    // Gather all user IDs and job IDs
    const allWr = wrRes.data || [];
    const allEr = erRes.data || [];
    const userIds = new Set<string>();
    const jobIds = new Set<string>();

    allWr.forEach((r) => { userIds.add(r.employer_id); userIds.add(r.worker_id); jobIds.add(r.job_id); });
    allEr.forEach((r) => { userIds.add(r.employer_id); userIds.add(r.worker_id); jobIds.add(r.job_id); });

    const [profilesRes, jobsRes] = await Promise.all([
      userIds.size > 0 ? supabase.from("profiles").select("id, full_name").in("id", [...userIds]) : { data: [] },
      jobIds.size > 0 ? supabase.from("jobs").select("id, title").in("id", [...jobIds]) : { data: [] },
    ]);

    const nameMap = new Map((profilesRes.data || []).map((p) => [p.id, p.full_name || "Unknown"]));
    const jobMap = new Map((jobsRes.data || []).map((j) => [j.id, j.title]));

    const rows: ReviewRow[] = [
      ...allWr.map((r) => ({
        id: r.id,
        type: "worker" as const,
        rating: r.rating,
        review: r.review,
        created_at: r.created_at,
        reviewer_name: nameMap.get(r.employer_id) || "Unknown",
        target_name: nameMap.get(r.worker_id) || "Unknown",
        job_title: jobMap.get(r.job_id) || "Unknown",
      })),
      ...allEr.map((r) => ({
        id: r.id,
        type: "employer" as const,
        rating: r.rating,
        review: r.review,
        created_at: r.created_at,
        reviewer_name: nameMap.get(r.worker_id) || "Unknown",
        target_name: nameMap.get(r.employer_id) || "Unknown",
        job_title: jobMap.get(r.job_id) || "Unknown",
      })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setReviews(rows);
    setLoading(false);
  };

  const deleteReview = async (id: string, type: "worker" | "employer") => {
    const table = type === "worker" ? "worker_ratings" : "employer_ratings";
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setReviews(reviews.filter((r) => r.id !== id));
    toast({ title: "Review deleted" });
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
        <h1 className="font-display font-bold text-2xl text-foreground">Review Moderation</h1>
        <p className="text-muted-foreground text-sm mt-1">Moderate worker and employer ratings ({reviews.length} total)</p>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-16">
          <Star className="mx-auto text-muted-foreground mb-3" size={48} />
          <p className="text-muted-foreground">No reviews yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {r.reviewer_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{r.reviewer_name}</span>
                      <span className="text-muted-foreground"> rated </span>
                      <span className="font-medium">{r.target_name}</span>
                      <span className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${
                        r.type === "worker" ? "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400" :
                        "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                      }`}>
                        {r.type === "worker" ? "Worker Review" : "Employer Review"}
                      </span>
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={14} className={s <= r.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"} />
                      ))}
                      <span className="text-xs text-muted-foreground ml-2">for: {r.job_title}</span>
                    </div>
                    {r.review && <p className="text-sm text-muted-foreground mt-2">"{r.review}"</p>}
                    <p className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="text-destructive hover:text-destructive gap-1 shrink-0" onClick={() => deleteReview(r.id, r.type)}>
                  <Trash2 size={14} /> Remove
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
