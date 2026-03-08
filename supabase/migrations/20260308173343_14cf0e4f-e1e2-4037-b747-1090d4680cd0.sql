
-- Allow employers to view profiles of workers who applied to their jobs
CREATE POLICY "Employers can view applicant profiles" ON public.profiles
FOR SELECT TO authenticated USING (
  id IN (
    SELECT ja.worker_id FROM public.job_applications ja
    JOIN public.jobs j ON ja.job_id = j.id
    WHERE j.employer_id = auth.uid()
  )
);

-- Allow employers to view skills of applicants
CREATE POLICY "Employers can view applicant skills" ON public.worker_skills
FOR SELECT TO authenticated USING (
  user_id IN (
    SELECT ja.worker_id FROM public.job_applications ja
    JOIN public.jobs j ON ja.job_id = j.id
    WHERE j.employer_id = auth.uid()
  )
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
