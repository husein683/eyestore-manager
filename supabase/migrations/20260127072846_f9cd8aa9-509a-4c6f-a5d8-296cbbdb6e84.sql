-- Add new columns to prescriptions table for complete prescription details

-- VA (Visual Acuity) for D.V. section
ALTER TABLE public.prescriptions ADD COLUMN right_eye_va text;
ALTER TABLE public.prescriptions ADD COLUMN left_eye_va text;

-- N.V. (Near Vision) section - separate from D.V.
ALTER TABLE public.prescriptions ADD COLUMN right_eye_nv_sphere numeric;
ALTER TABLE public.prescriptions ADD COLUMN right_eye_nv_cylinder numeric;
ALTER TABLE public.prescriptions ADD COLUMN right_eye_nv_axis integer;
ALTER TABLE public.prescriptions ADD COLUMN right_eye_nv_va text;
ALTER TABLE public.prescriptions ADD COLUMN left_eye_nv_sphere numeric;
ALTER TABLE public.prescriptions ADD COLUMN left_eye_nv_cylinder numeric;
ALTER TABLE public.prescriptions ADD COLUMN left_eye_nv_axis integer;
ALTER TABLE public.prescriptions ADD COLUMN left_eye_nv_va text;

-- Lens options checkboxes
ALTER TABLE public.prescriptions ADD COLUMN emr_coating boolean DEFAULT false;
ALTER TABLE public.prescriptions ADD COLUMN blue_cut boolean DEFAULT false;
ALTER TABLE public.prescriptions ADD COLUMN plastic boolean DEFAULT false;
ALTER TABLE public.prescriptions ADD COLUMN tint boolean DEFAULT false;
ALTER TABLE public.prescriptions ADD COLUMN anti_glare boolean DEFAULT false;
ALTER TABLE public.prescriptions ADD COLUMN polycarbonate boolean DEFAULT false;

-- Lens type checkboxes
ALTER TABLE public.prescriptions ADD COLUMN bifocal boolean DEFAULT false;
ALTER TABLE public.prescriptions ADD COLUMN progressive boolean DEFAULT false;