-- Add payment tracking columns to sales table
ALTER TABLE public.sales
ADD COLUMN IF NOT EXISTS paid_amount numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS balance numeric NOT NULL DEFAULT 0;

-- Update store settings with correct info
UPDATE public.store_settings
SET 
  store_name = 'Naeem Optics',
  address = 'Circular-Road, Sheranwala Gate, Near Allied Bank',
  phone = '+92 300 9839515',
  email = 'saadk2953@gmail.com',
  updated_at = now();