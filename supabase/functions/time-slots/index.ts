import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// --- Interface para as regras de disponibilidade do banco de dados ---
interface AvailabilityRule {
  id: number;
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  start_time: string; // "HH:mm"
  end_time: string; // "HH:mm"
  is_available: boolean;
}

// --- Função para gerar slots baseada em regras dinâmicas (Versão Remota) ---
function generateTimeSlots(rules: AvailabilityRule[], daysToGenerate: number): { id: number; date: string; time: string }[] {
  console.log('Generating time slots with rules:', rules);
  const generatedSlots: { id: number; date: string; time: string }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < daysToGenerate; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dayOfWeek = date.getDay();
    const dateString = date.toISOString().split('T')[0];

    const rulesForDay = rules.filter(rule => rule.day_of_week === dayOfWeek && rule.is_available);

    for (const rule of rulesForDay) {
      try {
        const startHour = parseInt(rule.start_time.split(':')[0]);
        const endHour = parseInt(rule.end_time.split(':')[0]);

        if (isNaN(startHour) || isNaN(endHour)) {
          console.error('Invalid time format for rule:', rule);
          continue;
        }

        for (let hour = startHour; hour < endHour; hour++) {
          const time = `${hour.toString().padStart(2, '0')}:00`;
          
          // Gerando um pseudo ID
          const pseudoId = date.getTime() + hour; 

          generatedSlots.push({
            id: pseudoId,
            date: dateString,
            time: time,
          });
        }
      } catch (e) {
        console.error('Error processing rule:', rule, e);
      }
    }
  }
  console.log('Generated slots:', generatedSlots.length);
  return generatedSlots;
}

// --- Função principal de serviço ---
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('time-slots function invoked');
    
    // Configuração do Cliente Supabase com Auth
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    
    // 1. Verificação de Autenticação
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('Unauthorized access attempt');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // 2. Busca de Regras de Disponibilidade (time_slots)
    console.log('Fetching availability rules for user:', user.id);
    const { data: availabilityRules, error: rulesError } = await supabase
      .from('time_slots')
      .select('id, day_of_week, start_time, end_time, is_available');

    if (rulesError) {
      console.error('Supabase error fetching availability rules:', rulesError);
      throw new Error(`Failed to fetch availability rules: ${rulesError.message}`);
    }
    
    // 3. Geração de Slots
    const generatedTimeSlots = generateTimeSlots(availabilityRules || [], 7); // Gera slots para os próximos 7 dias

    // 4. Busca de Agendamentos (appointments)
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('time_slot_id'); // Assume que 'time_slot_id' é um campo que contém o ID do slot reservado

    if (appointmentsError) {
      console.error('Supabase error fetching appointments:', appointmentsError);
      throw new Error(`Failed to fetch appointments: ${appointmentsError.message}`);
    }

    const bookedSlotIds = appointments.map(a => a.time_slot_id);
    const now = new Date();

    // 5. Filtragem de Slots Disponíveis
    const availableTimeSlots = generatedTimeSlots.filter(slot => {
      const slotTime = new Date(`${slot.date}T${slot.time}:00`);
      const isBooked = bookedSlotIds.includes(slot.id); 
      const isPast = slotTime < now;

      // Retorna apenas slots que estão no futuro E não estão reservados.
      return !isPast && !isBooked;
    });

    return new Response(JSON.stringify(availableTimeSlots), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Caught error in time-slots function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})