ALTER TABLE appointments
RENAME COLUMN appointment_time TO start_time;

ALTER TABLE appointments
ADD COLUMN end_time TIMESTAMP WITH TIME ZONE;
