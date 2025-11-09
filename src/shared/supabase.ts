// src/shared/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ilfoxowzpibbgrpveqrs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsZm94b3d6cGliYmdycHZlcXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTg2MTksImV4cCI6MjA3ODI3NDYxOX0.QEQDnjxbLnY0fAJp0_8h-43z2K5F2esBykm7S3UT9yw';

export const supabase = createClient(supabaseUrl, supabaseKey);
