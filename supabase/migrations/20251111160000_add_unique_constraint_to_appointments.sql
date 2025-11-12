CREATE UNIQUE INDEX unique_active_appointment_on_time_slot
ON appointments (time_slot_id)
WHERE status IN ('scheduled', 'confirmed');
