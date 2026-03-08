import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, MessageSquare } from "lucide-react";

interface Conversation {
  user_id: string;
  user_name: string;
  last_message: string;
  last_time: string;
  unread: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export default function EmployerMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchConversations();
  }, [user]);

  useEffect(() => {
    if (selectedUserId) fetchMessages(selectedUserId);
  }, [selectedUserId]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("employer-messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${user.id}` }, (payload) => {
        const msg = payload.new as Message;
        if (msg.sender_id === selectedUserId) {
          setMessages((prev) => [...prev, msg]);
          supabase.from("messages").update({ is_read: true }).eq("id", msg.id);
        }
        fetchConversations();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, selectedUserId]);

  const fetchConversations = async () => {
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`)
      .order("created_at", { ascending: false });

    if (!msgs) { setLoading(false); return; }

    const convMap = new Map<string, Message[]>();
    msgs.forEach((m) => {
      const otherId = m.sender_id === user!.id ? m.receiver_id : m.sender_id;
      if (!convMap.has(otherId)) convMap.set(otherId, []);
      convMap.get(otherId)!.push(m);
    });

    const otherIds = [...convMap.keys()];
    const { data: profiles } = otherIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", otherIds)
      : { data: [] };

    const nameMap = new Map((profiles || []).map((p) => [p.id, p.full_name || "Unknown"]));

    const convList: Conversation[] = otherIds.map((id) => {
      const msgs = convMap.get(id)!;
      return {
        user_id: id,
        user_name: nameMap.get(id) || "Unknown",
        last_message: msgs[0].content,
        last_time: msgs[0].created_at,
        unread: msgs.filter((m) => m.receiver_id === user!.id && !m.is_read).length,
      };
    });

    convList.sort((a, b) => new Date(b.last_time).getTime() - new Date(a.last_time).getTime());
    setConversations(convList);
    setLoading(false);
  };

  const fetchMessages = async (otherId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${user!.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user!.id})`)
      .order("created_at", { ascending: true });
    if (data) setMessages(data);
    await supabase.from("messages").update({ is_read: true }).eq("sender_id", otherId).eq("receiver_id", user!.id);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedUserId) return;
    const { data } = await supabase.from("messages").insert({
      sender_id: user!.id, receiver_id: selectedUserId, content: newMessage.trim(),
    }).select().single();
    if (data) { setMessages([...messages, data]); setNewMessage(""); fetchConversations(); }
  };

  const selectedConv = conversations.find((c) => c.user_id === selectedUserId);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        <Card className="h-[500px] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-foreground">Messages</h1>
        <p className="text-muted-foreground text-sm mt-1">Chat with workers</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
        <Card className="md:col-span-1 overflow-hidden">
          <ScrollArea className="h-full">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6">
                <MessageSquare className="text-muted-foreground mb-2" size={32} />
                <p className="text-sm text-muted-foreground text-center">No conversations yet.</p>
              </div>
            ) : conversations.map((conv) => (
              <button
                key={conv.user_id}
                onClick={() => setSelectedUserId(conv.user_id)}
                className={`w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition border-b border-border ${selectedUserId === conv.user_id ? "bg-muted" : ""}`}
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                    {conv.user_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground text-sm truncate">{conv.user_name}</p>
                    {conv.unread > 0 && (
                      <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center shrink-0">{conv.unread}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{conv.last_message}</p>
                </div>
              </button>
            ))}
          </ScrollArea>
        </Card>

        <Card className="md:col-span-2 flex flex-col overflow-hidden">
          {selectedUserId ? (
            <>
              <div className="p-4 border-b border-border">
                <p className="font-semibold text-foreground">{selectedConv?.user_name}</p>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender_id === user!.id ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-xl px-4 py-2 text-sm ${msg.sender_id === user!.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="p-4 border-t border-border flex gap-2">
                <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." onKeyDown={(e) => e.key === "Enter" && handleSend()} />
                <Button onClick={handleSend} disabled={!newMessage.trim()}><Send size={16} /></Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="mx-auto text-muted-foreground mb-2" size={40} />
                <p className="text-muted-foreground text-sm">Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
