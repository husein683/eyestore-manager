-- Add addition field to prescriptions table
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS addition NUMERIC(5, 2);

-- Update product_type constraint to include contact_lens_solution and hearing_aid
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_product_type_check;
ALTER TABLE public.products ADD CONSTRAINT products_product_type_check 
  CHECK (product_type IN ('eyeglasses', 'sunglasses', 'contact_lenses', 'accessories', 'contact_lens_solution', 'custom_eyesight', 'hearing_aid'));

-- Update existing cleaning_solutions to contact_lens_solution
UPDATE public.products SET product_type = 'contact_lens_solution' WHERE product_type = 'cleaning_solutions';