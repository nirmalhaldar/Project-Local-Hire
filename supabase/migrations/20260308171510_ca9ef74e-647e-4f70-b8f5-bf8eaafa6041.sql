
-- Jobs table (posted by employers)
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  category text NOT NULL,
  location_address text,
  location_lat double precision,
  location_lng double precision,
  pay_min numeric,
  pay_max numeric,
  pay_type text DEFAULT 'hourly' CHECK (pay_type IN ('hourly', 'fixed', 'daily')),
  status text DEFAULT 'open' CHECK (status IN ('open', 'closed', 'filled')),
  skills_required text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Worker skills
CREATE TABLE public.worker_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  skill text NOT NULL,
  experience_years integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Worker availability
CREATE TABLE public.worker_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time,
  end_time time,
  is_available boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Worker portfolio
CREATE TABLE public.worker_portfolio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS policies for jobs (public read, employer write)
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view open jobs" ON public.jobs FOR SELECT USING (status = 'open');
CREATE POLICY "Employers can insert own jobs" ON public.jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = employer_id);
CREATE POLICY "Employers can update own jobs" ON public.jobs FOR UPDATE TO authenticated USING (auth.uid() = employer_id);
CREATE POLICY "Employers can delete own jobs" ON public.jobs FOR DELETE TO authenticated USING (auth.uid() = employer_id);

-- RLS for worker_skills
ALTER TABLE public.worker_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own skills" ON public.worker_skills FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own skills" ON public.worker_skills FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own skills" ON public.worker_skills FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own skills" ON public.worker_skills FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS for worker_availability
ALTER TABLE public.worker_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own availability" ON public.worker_availability FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own availability" ON public.worker_availability FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own availability" ON public.worker_availability FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own availability" ON public.worker_availability FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS for worker_portfolio
ALTER TABLE public.worker_portfolio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own portfolio" ON public.worker_portfolio FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own portfolio" ON public.worker_portfolio FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own portfolio" ON public.worker_portfolio FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own portfolio" ON public.worker_portfolio FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Storage bucket for portfolio images
INSERT INTO storage.buckets (id, name, public) VALUES ('portfolio', 'portfolio', true);
CREATE POLICY "Users can upload portfolio images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'portfolio' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Anyone can view portfolio images" ON storage.objects FOR SELECT USING (bucket_id = 'portfolio');
CREATE POLICY "Users can delete own portfolio images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'portfolio' AND (storage.foldername(name))[1] = auth.uid()::text);
