-- Create store settings table
CREATE TABLE public.store_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_name TEXT NOT NULL DEFAULT 'Naeem Optics',
  address TEXT DEFAULT '123 Main Street',
  phone TEXT DEFAULT '+92 300 1234567',
  email TEXT DEFAULT 'info@naeemoptics.com',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view settings
CREATE POLICY "Authenticated users can view store settings"
ON public.store_settings
FOR SELECT
USING (true);

-- Only admins can update store settings
CREATE POLICY "Only admins can manage store settings"
ON public.store_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_store_settings_updated_at
BEFORE UPDATE ON public.store_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.store_settings (store_name, address, phone, email)
VALUES ('Naeem Optics', '123 Main Street', '+92 300 1234567', 'info@naeemoptics.com');