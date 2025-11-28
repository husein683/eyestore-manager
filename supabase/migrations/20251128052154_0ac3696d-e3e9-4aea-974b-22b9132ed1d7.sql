-- Create employees table
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  hire_date DATE NOT NULL,
  position TEXT,
  salary_type TEXT NOT NULL CHECK (salary_type IN ('daily', 'monthly')),
  base_salary NUMERIC NOT NULL,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create employee_payments table
CREATE TABLE public.employee_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('daily', 'monthly', 'bonus', 'advance')),
  payment_method TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employees
CREATE POLICY "Authenticated users can view employees"
  ON public.employees FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage employees"
  ON public.employees FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for employee_payments
CREATE POLICY "Authenticated users can view payments"
  ON public.employee_payments FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage payments"
  ON public.employee_payments FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_employees_created_by ON public.employees(created_by);
CREATE INDEX idx_employee_payments_employee_id ON public.employee_payments(employee_id);
CREATE INDEX idx_employee_payments_payment_date ON public.employee_payments(payment_date);
CREATE INDEX idx_employee_payments_created_by ON public.employee_payments(created_by);