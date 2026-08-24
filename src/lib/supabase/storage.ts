import { createClient } from './client';

/**
 * Uploads a receipt file to Supabase Storage bucket 'receipts'
 * Returns the public URL of the uploaded receipt or null on failure.
 */
export async function uploadReceiptToSupabase(file: File): Promise<string | null> {
  try {
    const supabase = createClient();
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `receipts/${fileName}`;

    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.warn('Supabase storage upload error, falling back to local object:', error);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('receipts')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.warn('Storage upload failed:', err);
    return null;
  }
}
