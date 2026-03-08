import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch worker profile, skills, and available jobs
    const [profileRes, skillsRes, jobsRes] = await Promise.all([
      supabase.from("profiles").select("roles, categories, availability_status, gig_wage_daily").eq("id", userId).single(),
      supabase.from("worker_skills").select("skill, experience_years").eq("user_id", userId),
      supabase.from("jobs").select("id, title, category, location_address, pay_min, pay_max, pay_type, job_type, skills_required, roles_required").eq("status", "open").limit(50),
    ]);

    const profile = profileRes.data;
    const skills = skillsRes.data || [];
    const jobs = jobsRes.data || [];

    if (jobs.length === 0) {
      return new Response(JSON.stringify({ recommendations: [], sections: { recommended: [], highPaying: [] } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `You are a job recommendation AI for a blue-collar job platform called LocalHire.

Worker profile:
- Roles: ${(profile?.roles || []).join(", ") || "Not specified"}
- Categories: ${(profile?.categories || []).join(", ") || "Not specified"}
- Skills: ${skills.map(s => `${s.skill} (${s.experience_years}yr)`).join(", ") || "Not specified"}
- Expected daily wage: ₹${profile?.gig_wage_daily || "Not set"}

Available jobs (JSON):
${JSON.stringify(jobs.map(j => ({ id: j.id, title: j.title, category: j.category, pay_min: j.pay_min, pay_max: j.pay_max, skills: j.skills_required, roles: j.roles_required })))}

Return a JSON object with:
1. "recommended" - array of job IDs best matching the worker's skills and roles (max 6)
2. "highPaying" - array of job IDs sorted by highest pay (max 6)

Only return valid job IDs from the list. Return ONLY the JSON object, no markdown.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fallback: return jobs sorted by relevance heuristic
      return new Response(JSON.stringify({
        recommended: jobs.slice(0, 6).map(j => j.id),
        highPaying: [...jobs].sort((a, b) => (b.pay_max || 0) - (a.pay_max || 0)).slice(0, 6).map(j => j.id),
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "{}";

    // Parse AI response (strip markdown if any)
    let parsed;
    try {
      const cleaned = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { recommended: jobs.slice(0, 6).map((j: any) => j.id), highPaying: [] };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
