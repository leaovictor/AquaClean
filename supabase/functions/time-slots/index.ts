import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

// This function returns a static list of mock time slots for demonstration purposes.
// In a real application, you would query your database to get available slots.
function getMockTimeSlots() {
  const slots = [];
  const today = new Date();
  
  for (let i = 0; i < 5; i++) { // Generate slots for the next 5 days
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateString = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD

    for (let j = 9; j <= 17; j++) { // Generate slots from 9 AM to 5 PM
      const time = `${j.toString().padStart(2, '0')}:00`;
      slots.push({
        id: (i * 100) + j, // Unique ID
        date: dateString,
        time: time,
      });
    }
  }
  return slots;
}


serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const timeSlots = getMockTimeSlots();

    return new Response(JSON.stringify(timeSlots), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
