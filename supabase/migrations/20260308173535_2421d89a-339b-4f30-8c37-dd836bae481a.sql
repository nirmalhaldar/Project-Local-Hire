
-- Add vacancies column to jobs
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS vacancies integer DEFAULT 1;

-- Create worker_ratings table (employer rates worker)
CREATE TABLE IF NOT EXISTS public.worker_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL,
  worker_id uuid NOT NULL,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review text,
  punctuality integer CHECK (punctuality >= 1 AND punctuality <= 5),
  skill_performance integer CHECK (skill_performance >= 1 AND skill_performance <= 5),
  behavior integer CHECK (behavior >= 1 AND behavior <= 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(employer_id, worker_id, job_id)
);

ALTER TABLE public.worker_ratings ENABLE ROW LEVEL SECURITY;

-- Anyone can view worker ratings (public transparency)
CREATE POLICY "Anyone can view worker ratings" ON public.worker_ratings FOR SELECT USING (true);

-- Employers can rate workers they hired
CREATE POLICY "Employers can rate workers" ON public.worker_ratings FOR INSERT WITH CHECK (
  auth.uid() = employer_id
  AND EXISTS (
    SELECT 1 FROM public.job_applications ja
    JOIN public.jobs j ON ja.job_id = j.id
    WHERE ja.job_id = worker_ratings.job_id
    AND ja.worker_id = worker_ratings.worker_id
    AND j.employer_id = auth.uid()
    AND ja.status = 'accepted'
  )
);

-- Allow profiles to be viewed by anyone who has messaged them (for candidate search)
CREATE POLICY "Users can view profiles of message participants" ON public.profiles FOR SELECT USING (
  id IN (
    SELECT sender_id FROM messages WHERE receiver_id = auth.uid()
    UNION
    SELECT receiver_id FROM messages WHERE sender_id = auth.uid()
  )
);

-- Allow employers to view all worker profiles for candidate search
CREATE POLICY "Employers can browse worker profiles" ON public.profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'employer'
  )
);

-- Allow employers to view all worker skills for candidate search
CREATE POLICY "Employers can browse worker skills" ON public.worker_skills FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'employer'
  )
);
