import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Fetch a paused or running run
    const { data: runs, error: runsError } = await supabase
      .from('runs')
      .select('*')
      .or('state.eq.paused,state.eq.running')
      .order('created_at', { ascending: true })
      .limit(1)

    if (runsError) throw runsError
    if (!runs || runs.length === 0) {
      return new Response(JSON.stringify({ message: "No runs available" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const availableRun = runs[0]

    // If the run is paused, start it
    if (availableRun.state === "paused") {
      const { data: runStarted, error: startError } = await supabase
        .rpc('start_paused_run', { run_id: availableRun.id })

      if (startError) throw startError
      if (!runStarted) {
        return new Response(JSON.stringify({ message: "Failed to start run" }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }
    }

    const startTime = Date.now()

    // Fetch project messages from Firestore
    // Note: You'll need to implement Firestore access in the Edge Function
    // const messages = await fetchMessagesFromFirestore(availableRun.project_id)

    // Call OpenAI
    // Note: You'll need to implement OpenAI API call in the Edge Function
    // const nextAction = await callOpenAI(messages, availableRun.llm_temperature)

    // Process the next action
    // if (nextAction.includes("<lov-scenario-finished/>")) {
    //   await supabase
    //     .from('runs')
    //     .update({ state: 'completed' })
    //     .eq('id', availableRun.id)
    //   return new Response(JSON.stringify({ message: "Scenario completed" }), {
    //     headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    //     status: 200,
    //   })
    // }

    // const chatRequest = extractChatRequest(nextAction)

    // Send chat message
    // Note: You'll need to implement the chat endpoint call in the Edge Function
    // const chatResponse = await sendChatMessage(availableRun.project_id, chatRequest, availableRun.system_version)

    // Add result
    // await supabase
    //   .from('results')
    //   .insert({
    //     run_id: availableRun.id,
    //     reviewer_id: null,
    //     result: {
    //       type: 'chat_message_sent',
    //       data: chatResponse,
    //     },
    //   })

    const endTime = Date.now()
    const timeUsage = Math.round((endTime - startTime) / 1000)

    // Update the total_time_usage
    await supabase
      .rpc('update_run_time_usage', { 
        run_id: availableRun.id, 
        time_increment: timeUsage 
      })

    // Check if the run has timed out
    const { data: runData } = await supabase
      .from('runs')
      .select('state')
      .eq('id', availableRun.id)
      .single()

    if (runData.state !== 'timed_out') {
      await supabase
        .from('runs')
        .update({ state: 'paused' })
        .eq('id', availableRun.id)
    }

    return new Response(JSON.stringify({ message: "Iteration completed successfully" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
