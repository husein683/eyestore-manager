-- Add is_approved column to profiles table for admin approval
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT false;

-- Update existing users to be approved (so they don't lose access)
UPDATE public.profiles SET is_approved = true WHERE is_approved = false;