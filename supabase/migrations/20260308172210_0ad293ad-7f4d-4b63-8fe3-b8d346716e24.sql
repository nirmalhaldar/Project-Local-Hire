
-- Add worker profile fields
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS roles text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS categories text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS availability_status text DEFAULT 'open_for_work' CHECK (availability_status IN ('open_for_work', 'open_for_visit', 'unavailable')),
ADD COLUMN IF NOT EXISTS gig_wage_daily numeric,
ADD COLUMN IF NOT EXISTS visiting_fee numeric,
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS bio text;

-- Add job_type to jobs table
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS job_type text DEFAULT 'gig' CHECK (job_type IN ('gig', 'part_time', 'full_time', 'contract')),
ADD COLUMN IF NOT EXISTS roles_required text[] DEFAULT '{}';

-- Job applications
CREATE TABLE public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  worker_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(job_id, worker_id)
);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workers can view own applications" ON public.job_applications FOR SELECT TO authenticated USING (auth.uid() = worker_id);
CREATE POLICY "Workers can apply to jobs" ON public.job_applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = worker_id);
CREATE POLICY "Employers can view applications for their jobs" ON public.job_applications FOR SELECT TO authenticated USING (
  job_id IN (SELECT id FROM public.jobs WHERE employer_id = auth.uid())
);
CREATE POLICY "Employers can update application status" ON public.job_applications FOR UPDATE TO authenticated USING (
  job_id IN (SELECT id FROM public.jobs WHERE employer_id = auth.uid())
);

-- Saved jobs
CREATE TABLE public.saved_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, job_id)
);

ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own saved jobs" ON public.saved_jobs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can save jobs" ON public.saved_jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave jobs" ON public.saved_jobs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Employer ratings
CREATE TABLE public.employer_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  worker_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(worker_id, job_id)
);

ALTER TABLE public.employer_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view ratings" ON public.employer_ratings FOR SELECT USING (true);
CREATE POLICY "Workers can rate employers" ON public.employer_ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = worker_id);

-- Job reports
CREATE TABLE public.job_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  reporter_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason text NOT NULL,
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.job_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can report jobs" ON public.job_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can view own reports" ON public.job_reports FOR SELECT TO authenticated USING (auth.uid() = reporter_id);

-- Messages
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can mark messages as read" ON public.messages FOR UPDATE TO authenticated USING (auth.uid() = receiver_id);
