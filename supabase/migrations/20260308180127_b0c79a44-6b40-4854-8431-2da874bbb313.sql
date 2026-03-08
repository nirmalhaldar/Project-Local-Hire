ALTER TABLE public.profiles
ADD COLUMN location_address text,
ADD COLUMN location_lat double precision,
ADD COLUMN location_lng double precision;