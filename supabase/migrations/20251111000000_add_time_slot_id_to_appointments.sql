ALTER TABLE appointments
ADD COLUMN time_slot_id INTEGER REFERENCES time_slots(id) ON DELETE SET NULL;
