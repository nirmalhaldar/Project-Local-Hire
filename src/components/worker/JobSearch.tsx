import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search, MapPin, DollarSign, List, Map, Clock, Briefcase } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Job {
  id: string;
  title: string;
  description: string | null;
  category: string;
  location_address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  pay_min: number | null;
  pay_max: number | null;
  pay_type: string | null;
  skills_required: string[];
  created_at: string;
}

const CATEGORIES = [
  "All Categories",
  "Construction",
  "Cleaning",
  "Delivery",
  "Gardening",
  "Painting",
  "Plumbing",
  "Electrical",
  "Moving",
  "Carpentry",
  "Other",
];

export default function JobSearch() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (!error && data) setJobs(data);
    setLoading(false);
  };

  const filteredJobs = jobs.filter((job) => {
    const matchSearch =
      !search ||
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.description?.toLowerCase().includes(search.toLowerCase()) ||
      job.location_address?.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      category === "All Categories" || job.category === category;
    return matchSearch && matchCategory;
  });

  const formatPay = (job: Job) => {
    if (!job.pay_min && !job.pay_max) return "Negotiable";
    const min = job.pay_min ? `₹${job.pay_min}` : "";
    const max = job.pay_max ? `₹${job.pay_max}` : "";
    const type = job.pay_type === "hourly" ? "/hr" : job.pay_type === "daily" ? "/day" : "";
    if (min && max) return `${min} - ${max}${type}`;
    return `${min || max}${type}`;
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-2xl text-foreground">Find Jobs</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Browse and search available jobs near you
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Search jobs, locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1 border border-border rounded-lg p-1">
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List size={16} />
          </Button>
          <Button
            variant={viewMode === "map" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("map")}
          >
            <Map size={16} />
          </Button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-5 animate-pulse">
              <div className="h-5 bg-muted rounded w-3/4 mb-3" />
              <div className="h-4 bg-muted rounded w-1/2 mb-2" />
              <div className="h-4 bg-muted rounded w-1/3" />
            </Card>
          ))}
        </div>
      ) : viewMode === "list" ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredJobs.length === 0 ? (
            <div className="col-span-2 text-center py-16">
              <Briefcase className="mx-auto text-muted-foreground mb-3" size={48} />
              <h3 className="font-display font-semibold text-lg text-foreground mb-1">
                No jobs found
              </h3>
              <p className="text-muted-foreground text-sm">
                {jobs.length === 0
                  ? "No jobs have been posted yet. Check back soon!"
                  : "Try adjusting your search or filters."}
              </p>
            </div>
          ) : (
            filteredJobs.map((job) => (
              <Card
                key={job.id}
                className="p-5 hover:shadow-md transition-shadow cursor-pointer border-border"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground text-base">
                      {job.title}
                    </h3>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {job.category}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock size={12} />
                    {timeAgo(job.created_at)}
                  </span>
                </div>

                {job.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {job.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-3 text-sm">
                  {job.location_address && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <MapPin size={14} />
                      {job.location_address}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-primary font-medium">
                    <DollarSign size={14} />
                    {formatPay(job)}
                  </span>
                </div>

                {job.skills_required.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {job.skills_required.map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      ) : (
        /* Map View Placeholder */
        <Card className="h-[500px] flex items-center justify-center">
          <div className="text-center">
            <Map className="mx-auto text-muted-foreground mb-3" size={48} />
            <h3 className="font-display font-semibold text-lg text-foreground mb-1">
              Map View
            </h3>
            <p className="text-muted-foreground text-sm">
              {filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""} available
            </p>
            <p className="text-muted-foreground text-xs mt-2">
              Map integration coming soon. Switch to list view to browse jobs.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
