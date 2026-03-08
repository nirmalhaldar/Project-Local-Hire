import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { Search, Shield, ShieldOff, CheckCircle, XCircle, Users } from "lucide-react";

interface UserRow {
  id: string;
  full_name: string | null;
  email: string | null;
  is_verified: boolean;
  created_at: string;
  role: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, is_verified, created_at"),
      supabase.from("user_roles").select("user_id, role"),
    ]);

    const roleMap = new Map<string, string>();
    (rolesRes.data || []).forEach((r) => roleMap.set(r.user_id, r.role));

    setUsers((profilesRes.data || []).map((p) => ({
      ...p,
      is_verified: p.is_verified || false,
      role: roleMap.get(p.id) || "unknown",
    })));
    setLoading(false);
  };

  const toggleVerified = async (userId: string, current: boolean) => {
    const { error } = await supabase.from("profiles").update({ is_verified: !current }).eq("id", userId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setUsers(users.map((u) => u.id === userId ? { ...u, is_verified: !current } : u));
    toast({ title: !current ? "User verified" : "Verification removed" });
  };

  const changeRole = async (userId: string, newRole: string) => {
    // Delete existing role and insert new one
    await supabase.from("user_roles").delete().eq("user_id", userId);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole as any });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setUsers(users.map((u) => u.id === userId ? { ...u, role: newRole } : u));
    toast({ title: "Role updated", description: `User is now ${newRole}` });
  };

  const filtered = users.filter((u) => {
    if (search) {
      const q = search.toLowerCase();
      if (!(u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))) return false;
    }
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    return true;
  });

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      worker: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
      employer: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
      admin: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
    };
    return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[role] || "bg-muted text-muted-foreground"}`}>{role}</span>;
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
        <h1 className="font-display font-bold text-2xl text-foreground">User Management</h1>
        <p className="text-muted-foreground text-sm mt-1">View, verify, and manage user roles ({users.length} total)</p>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." className="pl-9" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="worker">Workers</SelectItem>
            <SelectItem value="employer">Employers</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users className="mx-auto text-muted-foreground mb-3" size={48} />
          <p className="text-muted-foreground">No users found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((u) => (
            <Card key={u.id} className="p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                    {(u.full_name || "?").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground text-sm truncate">{u.full_name || "No name"}</p>
                    {u.is_verified && <CheckCircle className="text-primary shrink-0" size={14} />}
                    {roleBadge(u.role)}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{u.email || "No email"}</p>
                  <p className="text-xs text-muted-foreground">Joined {new Date(u.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => toggleVerified(u.id, u.is_verified)} className="gap-1">
                    {u.is_verified ? <ShieldOff size={14} /> : <Shield size={14} />}
                    {u.is_verified ? "Unverify" : "Verify"}
                  </Button>
                  <Select value={u.role} onValueChange={(v) => changeRole(u.id, v)}>
                    <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="worker">Worker</SelectItem>
                      <SelectItem value="employer">Employer</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
