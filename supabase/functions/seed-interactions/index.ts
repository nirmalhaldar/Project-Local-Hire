import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

const REVIEWS = [
  "Great worker, very punctual and skilled. Highly recommend!",
  "Did an excellent job. Very professional and clean work.",
  "Good work overall. Could improve on communication.",
  "Very hardworking and dedicated. Will hire again.",
  "Showed up on time and completed the work perfectly.",
  "Decent work but took longer than expected.",
  "Outstanding performance! Exceeded expectations.",
  "Reliable and trustworthy. Great attitude.",
  "Average work quality but good effort.",
  "Fantastic job! Very detail-oriented and thorough.",
  "Completed the task efficiently. Good value for money.",
  "Professional behavior and quality workmanship.",
  "Needs improvement in time management but skilled.",
  "Excellent craftsmanship. Very satisfied with the result.",
  "Good worker. Friendly and cooperative throughout.",
];

const EMPLOYER_REVIEWS = [
  "Great employer! Clear instructions and timely payment.",
  "Very professional. Good working conditions provided.",
  "Fair pay and respectful treatment. Would work again.",
  "Excellent communication throughout the project.",
  "Paid on time and provided all necessary materials.",
  "Good employer but could improve on communication.",
  "Very supportive and understanding. Highly recommended.",
  "Professional workplace with safety measures in place.",
  "Reasonable expectations and fair compensation.",
  "Great experience working with this employer.",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Get all workers and employers
    const { data: allRoles } = await admin.from("user_roles").select("user_id, role");
    const workerIds = (allRoles || []).filter(r => r.role === "worker").map(r => r.user_id);
    const employerIds = (allRoles || []).filter(r => r.role === "employer").map(r => r.user_id);

    // Get all open jobs
    const { data: allJobs } = await admin.from("jobs").select("id, employer_id").eq("status", "open");
    const jobs = allJobs || [];

    // Get first 5 employers' jobs
    const first5Employers = employerIds.slice(0, 5);
    const first5Jobs = jobs.filter(j => first5Employers.includes(j.employer_id));
    const otherJobs = jobs.filter(j => !first5Employers.includes(j.employer_id));

    // --- 1. Create 60 applications from various workers ---
    const applications: any[] = [];
    const appliedPairs = new Set<string>();

    // Apply to first 5 employers' jobs more heavily
    const shuffledWorkers = shuffle(workerIds);
    let appCount = 0;

    // Each of the first 5 employers' jobs gets 2-4 applications
    for (const job of first5Jobs) {
      const numApplicants = randInt(2, 4);
      const applicants = shuffle(workerIds).slice(0, numApplicants);
      for (const workerId of applicants) {
        const key = `${workerId}-${job.id}`;
        if (appliedPairs.has(key) || appCount >= 60) continue;
        appliedPairs.add(key);
        const statuses = ["pending", "pending", "pending", "accepted", "rejected"];
        applications.push({
          job_id: job.id,
          worker_id: workerId,
          status: pick(statuses),
        });
        appCount++;
      }
    }

    // Fill remaining applications on other jobs
    while (appCount < 60 && otherJobs.length > 0) {
      const job = pick(otherJobs);
      const worker = pick(workerIds);
      const key = `${worker}-${job.id}`;
      if (appliedPairs.has(key)) continue;
      appliedPairs.add(key);
      applications.push({
        job_id: job.id,
        worker_id: worker,
        status: pick(["pending", "accepted"]),
      });
      appCount++;
    }

    // Insert applications
    if (applications.length > 0) {
      const { error: appErr } = await admin.from("job_applications").insert(applications);
      if (appErr) console.error("Applications insert error:", appErr.message);
    }

    // --- 2. Create worker ratings (employers rate accepted workers) ---
    const acceptedApps = applications.filter(a => a.status === "accepted");
    const workerRatings: any[] = [];

    for (const app of acceptedApps) {
      const job = jobs.find(j => j.id === app.job_id);
      if (!job) continue;

      workerRatings.push({
        worker_id: app.worker_id,
        employer_id: job.employer_id,
        job_id: app.job_id,
        rating: randInt(3, 5),
        punctuality: randInt(3, 5),
        skill_performance: randInt(3, 5),
        behavior: randInt(3, 5),
        review: pick(REVIEWS),
      });
    }

    if (workerRatings.length > 0) {
      const { error: wrErr } = await admin.from("worker_ratings").insert(workerRatings);
      if (wrErr) console.error("Worker ratings error:", wrErr.message);
    }

    // --- 3. Create employer ratings (workers rate employers they worked for) ---
    const employerRatings: any[] = [];
    const ratedEmployerPairs = new Set<string>();

    for (const app of acceptedApps) {
      const job = jobs.find(j => j.id === app.job_id);
      if (!job) continue;
      const key = `${app.worker_id}-${job.employer_id}-${app.job_id}`;
      if (ratedEmployerPairs.has(key)) continue;
      ratedEmployerPairs.add(key);

      if (Math.random() > 0.3) { // 70% chance of leaving a review
        employerRatings.push({
          worker_id: app.worker_id,
          employer_id: job.employer_id,
          job_id: app.job_id,
          rating: randInt(3, 5),
          review: pick(EMPLOYER_REVIEWS),
        });
      }
    }

    if (employerRatings.length > 0) {
      const { error: erErr } = await admin.from("employer_ratings").insert(employerRatings);
      if (erErr) console.error("Employer ratings error:", erErr.message);
    }

    // --- 4. Create some messages between workers and employers ---
    const messages: any[] = [];
    const MESSAGE_TEMPLATES_WORKER = [
      "Hi, I'm interested in this job. When can I start?",
      "Hello, I have 3 years of experience in this field. Can we discuss?",
      "Is this position still available? I'd like to apply.",
      "I can start immediately. Please let me know the details.",
      "What are the working hours for this job?",
    ];
    const MESSAGE_TEMPLATES_EMPLOYER = [
      "Thank you for applying! Can you come for an interview tomorrow?",
      "Your profile looks great. When are you available to start?",
      "We'd like to hire you. Please confirm your availability.",
      "Can you share more about your experience?",
      "The job starts next Monday. Are you interested?",
    ];

    // Create conversations for some accepted applications
    for (const app of acceptedApps.slice(0, 15)) {
      const job = jobs.find(j => j.id === app.job_id);
      if (!job) continue;

      // Worker message
      messages.push({
        sender_id: app.worker_id,
        receiver_id: job.employer_id,
        job_id: app.job_id,
        content: pick(MESSAGE_TEMPLATES_WORKER),
        is_read: true,
      });

      // Employer reply
      messages.push({
        sender_id: job.employer_id,
        receiver_id: app.worker_id,
        job_id: app.job_id,
        content: pick(MESSAGE_TEMPLATES_EMPLOYER),
        is_read: Math.random() > 0.3,
      });
    }

    if (messages.length > 0) {
      const { error: msgErr } = await admin.from("messages").insert(messages);
      if (msgErr) console.error("Messages error:", msgErr.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        applications_created: applications.length,
        worker_ratings_created: workerRatings.length,
        employer_ratings_created: employerRatings.length,
        messages_created: messages.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Seed error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
