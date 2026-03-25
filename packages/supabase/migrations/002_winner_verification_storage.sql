-- Winner verification image storage
-- Creates a private storage bucket and admin-only access policies

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'winner-verifications',
  'winner-verifications',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins can read winner verification files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'winner-verifications'
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can upload winner verification files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'winner-verifications'
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update winner verification files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'winner-verifications'
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'winner-verifications'
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete winner verification files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'winner-verifications'
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
