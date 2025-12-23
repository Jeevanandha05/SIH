-- Create table to store original registered certificates
CREATE TABLE public.certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cert_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  college TEXT NOT NULL,
  department TEXT NOT NULL,
  start_year TEXT,
  end_year TEXT,
  file_hash TEXT,
  file_name TEXT,
  image_url TEXT,
  extracted_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by TEXT,
  status TEXT NOT NULL DEFAULT 'active'
);

-- Create table for verification logs
CREATE TABLE public.verification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  certificate_id UUID REFERENCES public.certificates(id),
  verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  result TEXT NOT NULL, -- 'original', 'fake', 'no_match'
  confidence_score NUMERIC,
  extracted_data JSONB,
  matched_fields JSONB,
  ip_address TEXT
);

-- Enable RLS
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_logs ENABLE ROW LEVEL SECURITY;

-- Public read for certificates (verification needs this)
CREATE POLICY "Anyone can view certificates" ON public.certificates FOR SELECT USING (true);

-- Only authenticated users can insert/update certificates
CREATE POLICY "Authenticated users can insert certificates" ON public.certificates FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update certificates" ON public.certificates FOR UPDATE USING (true);

-- Anyone can insert verification logs
CREATE POLICY "Anyone can insert verification logs" ON public.verification_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view verification logs" ON public.verification_logs FOR SELECT USING (true);