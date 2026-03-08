import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Image, Upload } from "lucide-react";

interface PortfolioItem {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
}

export default function WorkerPortfolio() {
  const { user } = useAuth();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [uploading, setUploading] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchPortfolio();
  }, [user]);

  const fetchPortfolio = async () => {
    const { data } = await supabase
      .from("worker_portfolio")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    const path = `${user!.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("portfolio").upload(path, file);

    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } else {
      const { data } = supabase.storage.from("portfolio").getPublicUrl(path);
      setNewImageUrl(data.publicUrl);
    }
    setUploading(false);
  };

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    const { data, error } = await supabase
      .from("worker_portfolio")
      .insert({
        user_id: user!.id,
        title: newTitle.trim(),
        description: newDesc.trim() || null,
        image_url: newImageUrl,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (data) {
      setItems([data, ...items]);
      setNewTitle("");
      setNewDesc("");
      setNewImageUrl(null);
      setAdding(false);
      toast({ title: "Added", description: "Portfolio item added." });
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("worker_portfolio").delete().eq("id", id);
    setItems(items.filter((i) => i.id !== id));
    toast({ title: "Deleted", description: "Portfolio item removed." });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="h-48 animate-pulse"><div className="h-full bg-muted rounded" /></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Portfolio</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Showcase your past work to attract employers
          </p>
        </div>
        <Button onClick={() => setAdding(true)} disabled={adding}>
          <Plus size={16} className="mr-2" /> Add Work
        </Button>
      </div>

      {/* Add form */}
      {adding && (
        <Card className="p-5 space-y-4">
          <Input
            placeholder="Project title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <Textarea
            placeholder="Short description (optional)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            rows={2}
          />
          <div>
            {newImageUrl ? (
              <div className="relative rounded-lg overflow-hidden">
                <img src={newImageUrl} alt="Preview" className="w-full h-48 object-cover" />
                <button
                  onClick={() => setNewImageUrl(null)}
                  className="absolute top-2 right-2 bg-background/80 rounded-full p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg py-8 cursor-pointer hover:border-primary/50 transition">
                <Upload size={20} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {uploading ? "Uploading..." : "Upload image"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                  disabled={uploading}
                />
              </label>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAdd} disabled={!newTitle.trim()}>Save</Button>
            <Button variant="outline" onClick={() => { setAdding(false); setNewTitle(""); setNewDesc(""); setNewImageUrl(null); }}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Portfolio grid */}
      {items.length === 0 && !adding ? (
        <div className="text-center py-16">
          <Image className="mx-auto text-muted-foreground mb-3" size={48} />
          <h3 className="font-display font-semibold text-lg text-foreground mb-1">No work yet</h3>
          <p className="text-muted-foreground text-sm">
            Add photos and descriptions of your past projects.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden group">
              {item.image_url ? (
                <img src={item.image_url} alt={item.title} className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 bg-muted flex items-center justify-center">
                  <Image className="text-muted-foreground" size={32} />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <h3 className="font-medium text-foreground">{item.title}</h3>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {item.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
