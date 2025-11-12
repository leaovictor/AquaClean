CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
    appointment_time TIMESTAMP WITH TIME ZONE NOT NULL,
    service_type TEXT NOT NULL DEFAULT 'basic',
    status TEXT NOT NULL DEFAULT 'scheduled',
    special_instructions TEXT,
    total_price NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own appointments." ON appointments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create appointments." ON appointments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointments." ON appointments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own appointments." ON appointments
  FOR DELETE USING (auth.uid() = user_id);
