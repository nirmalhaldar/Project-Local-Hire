
-- Admin policies: admins can view/update/delete everything using existing has_role function

-- Profiles: admin can view all
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Jobs: admin can view all (including closed), update, delete
CREATE POLICY "Admins can view all jobs" ON public.jobs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all jobs" ON public.jobs FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete all jobs" ON public.jobs FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Job applications: admin can view all, update
CREATE POLICY "Admins can view all applications" ON public.job_applications FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all applications" ON public.job_applications FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Messages: admin can view all
CREATE POLICY "Admins can view all messages" ON public.messages FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- User roles: admin can view all, update, delete
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Job reports: admin can view all, update status
CREATE POLICY "Admins can view all reports" ON public.job_reports FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update reports" ON public.job_reports FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Worker ratings: admin can view all (already public), delete
CREATE POLICY "Admins can delete ratings" ON public.worker_ratings FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Employer ratings: admin can delete
CREATE POLICY "Admins can delete employer ratings" ON public.employer_ratings FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Worker skills: admin can view all
CREATE POLICY "Admins can view all skills" ON public.worker_skills FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
