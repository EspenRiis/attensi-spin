-- ============================================
-- Storage Policies for event-logos bucket
-- ============================================
-- Run this in Supabase SQL Editor after creating the bucket

-- Policy 1: Allow authenticated users to upload logos
CREATE POLICY "Authenticated users can upload logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-logos');

-- Policy 2: Allow authenticated users to update their own logos
CREATE POLICY "Users can update logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'event-logos');

-- Policy 3: Allow authenticated users to delete their own logos
CREATE POLICY "Users can delete logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'event-logos');

-- Policy 4: Allow public read access to all logos
CREATE POLICY "Public can view logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'event-logos');
