import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import {
  GeneratePlanRequest,
  GeneratePlanResponse,
  DbExercise,
  Exercise,
} from './types.ts';
import { generateWorkoutPlan } from './algorithm.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

/**
 * Convert database exercise row to the Exercise type used by the algorithm
 */
function dbExerciseToExercise(dbEx: DbExercise): Exercise {
  return {
    id: dbEx.id,
    name: dbEx.name,
    category: dbEx.category || 'compound',
    muscleContributions: dbEx.muscle_contributions || [
      // Fallback for exercises without contributions data
      { muscleId: dbEx.primary_muscle_id || 1, contribution: 1.0 },
    ],
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client with user's JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Extract the JWT from the Authorization header
    const token = authHeader.replace('Bearer ', '');
    console.log('Token received:', token.substring(0, 50) + '...');

    // Verify user is authenticated using the token directly
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    console.log('Auth error:', authError);
    console.log('User:', user?.id);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: authError?.message }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const body: GeneratePlanRequest = await req.json();
    const { daysPerWeek, targetSets, saveTemplates = false } = body;

    // Validate input
    if (!daysPerWeek || daysPerWeek < 2 || daysPerWeek > 6) {
      return new Response(
        JSON.stringify({ error: 'daysPerWeek must be between 2 and 6' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!targetSets || typeof targetSets !== 'object') {
      return new Response(
        JSON.stringify({ error: 'targetSets is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch exercises from database (default + user's custom)
    console.log('Fetching exercises for user:', user.id);
    const { data: dbExercises, error: exercisesError } = await supabase
      .from('exercises')
      .select('id, name, category, muscle_contributions, primary_muscle_id, is_custom')
      .or(`is_custom.eq.false,user_id.eq.${user.id}`);

    if (exercisesError) {
      console.error('Error fetching exercises:', exercisesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch exercises', details: exercisesError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Fetched exercises count:', dbExercises?.length);

    // Convert DB exercises to algorithm format
    const exercises: Exercise[] = (dbExercises as DbExercise[]).map(
      dbExerciseToExercise
    );
    console.log('Converted exercises count:', exercises.length);

    // Generate the workout plan
    console.log('Generating plan for', daysPerWeek, 'days with targets:', targetSets);
    let plan;
    try {
      plan = generateWorkoutPlan(exercises, daysPerWeek, targetSets);
      console.log('Plan generated successfully, templates:', plan.templates.length);
    } catch (algoError) {
      console.error('Algorithm error:', algoError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate plan', details: String(algoError) }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Optionally save templates to database
    if (saveTemplates) {
      for (const template of plan.templates) {
        const exercisesData = template.exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          sets: ex.sets,
        }));

        const { error: insertError } = await supabase
          .from('workout_templates')
          .insert({
            user_id: user.id,
            name: template.name,
            exercises: exercisesData,
          });

        if (insertError) {
          console.error('Error saving template:', insertError);
          // Continue with other templates even if one fails
        }
      }
    }

    // Return the generated plan
    const response: GeneratePlanResponse = {
      templates: plan.templates,
      weeklySetsByMuscle: plan.weeklySetsByMuscle,
      warnings: plan.warnings,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-workout-plan:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
