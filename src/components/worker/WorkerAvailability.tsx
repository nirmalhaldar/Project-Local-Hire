import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Calendar } from "lucide-react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface Availability {
  id?: string;
  day_of_week: number;
  start_time: string | null;
  end_time: string | null;
  is_available: boolean;
}

export default function WorkerAvailability() {
  const { user } = useAuth();
  const [availability, setAvailability] = useState<Availability[]>(
    DAYS.map((_, i) => ({ day_of_week: i, start_time: "09:00", end_time: "17:00", is_available: i > 0 && i < 6 }))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) fetchAvailability();
  }, [user]);

  const fetchAvailability = async () => {
    const { data } = await supabase
      .from("worker_availability")
      .select("*")
      .eq("user_id", user!.id);

    if (data && data.length > 0) {
      const merged = DAYS.map((_, i) => {
        const existing = data.find((d) => d.day_of_week === i);
        return existing
          ? { id: existing.id, day_of_week: i, start_time: existing.start_time, end_time: existing.end_time, is_available: existing.is_available ?? true }
          : { day_of_week: i, start_time: "09:00", end_time: "17:00", is_available: i > 0 && i < 6 };
      });
      setAvailability(merged);
    }
    setLoading(false);
  };

  const handleToggle = (index: number) => {
    const updated = [...availability];
    updated[index].is_available = !updated[index].is_available;
    setAvailability(updated);
  };

  const handleTimeChange = (index: number, field: "start_time" | "end_time", value: string) => {
    const updated = [...availability];
    updated[index][field] = value;
    setAvailability(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    // Delete existing and re-insert
    await supabase.from("worker_availability").delete().eq("user_id", user!.id);

    const rows = availability.map((a) => ({
      user_id: user!.id,
      day_of_week: a.day_of_week,
      start_time: a.start_time,
      end_time: a.end_time,
      is_available: a.is_available,
    }));

    const { error } = await supabase.from("worker_availability").insert(rows);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Your availability has been updated." });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 animate-pulse"><div className="h-10 bg-muted rounded" /></Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display font-bold text-2xl text-foreground">Availability</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Set your weekly schedule so employers know when you're free
        </p>
      </div>

      <Card className="divide-y divide-border">
        {availability.map((day, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <Switch
              checked={day.is_available}
              onCheckedChange={() => handleToggle(i)}
            />
            <span className="w-24 font-medium text-sm text-foreground">{DAYS[i]}</span>
            {day.is_available ? (
              <div className="flex items-center gap-2 text-sm">
                <Input
                  type="time"
                  value={day.start_time || "09:00"}
                  onChange={(e) => handleTimeChange(i, "start_time", e.target.value)}
                  className="w-32"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="time"
                  value={day.end_time || "17:00"}
                  onChange={(e) => handleTimeChange(i, "end_time", e.target.value)}
                  className="w-32"
                />
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Unavailable</span>
            )}
          </div>
        ))}
      </Card>

      <button
        onClick={handleSave}
        disabled={saving}
        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition disabled:opacity-50"
      >
        <Calendar size={16} />
        {saving ? "Saving..." : "Save Availability"}
      </button>
    </div>
  );
}
