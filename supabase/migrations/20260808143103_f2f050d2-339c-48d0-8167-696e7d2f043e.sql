-- school-images: public read, admin write
CREATE POLICY "school_images_read" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'school-images');

CREATE POLICY "school_images_admin_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'school-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "school_images_admin_update" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'school-images' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'school-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "school_images_admin_delete" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'school-images' AND public.has_role(auth.uid(), 'admin'));

-- chat-images: approved users read, own folder write
CREATE POLICY "chat_images_read" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'chat-images' AND public.is_approved(auth.uid()));

CREATE POLICY "chat_images_insert_own" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'chat-images'
  AND public.is_approved(auth.uid())
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "chat_images_delete_own" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'chat-images'
  AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin'))
);