-- Create storage bucket for certificate images
INSERT INTO storage.buckets (id, name, public) VALUES ('certificates', 'certificates', true);

-- Allow public read access
CREATE POLICY "Public can view certificates" ON storage.objects FOR SELECT USING (bucket_id = 'certificates');

-- Allow authenticated users to upload
CREATE POLICY "Users can upload certificates" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'certificates');

-- Allow authenticated users to delete
CREATE POLICY "Users can delete certificates" ON storage.objects FOR DELETE USING (bucket_id = 'certificates');