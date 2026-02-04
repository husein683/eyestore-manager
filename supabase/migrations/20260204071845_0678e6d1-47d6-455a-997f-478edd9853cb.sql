-- Add age column to prescriptions table
ALTER TABLE public.prescriptions 
ADD COLUMN age integer NULL;