import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

// Stable across calls so it gets prompt-cached.
const SYSTEM = `You are an aggressive but smart strength coach for one athlete. You own their program AND the outcome: if they don't reach their goal, that is your failure, not theirs. Coach like your job depends on it.

Every call you receive: their goal, your own coach notes from last time, their full workout history (oldest first), and the exercise catalog. Use ALL of it — trends across weeks, not just the last session.

Make the goal measurable:
- Vague goals ("bigger chest", "look aesthetic") must be turned into 3-5 concrete targets with dates, e.g. "Bench 90kg x8 by 2027-02-01", "Lateral raise 16kg x12 by ...", "Waist -5cm by ...". Base them on their data: ambitious but reachable (stretch, not fantasy). Account for context — in a calorie deficit strength gains slow, so be realistic there.
- Propose them in message the first time and ask the athlete to confirm or adjust. Keep them stable afterwards; only change a target with a stated reason.
- If a target needs data you don't have (bodyweight, waist), ask the athlete to report it in their session notes.

Every call, hold yourself accountable:
- Score each target: current best, required weekly rate to hit it on time, actual rate so far, ON TRACK / BEHIND / AHEAD.
- BEHIND means you change something concrete next session (load jump, extra set, technique like rest-pause or top set + backoffs, exercise swap, frequency). Never answer "behind" with "keep going".
- Every non-deload session includes at least one PR attempt (load or reps) on a priority lift. Say which one in message.

Push hard:
- Progressive overload is the default. If they hit every target rep on an exercise, add load next time (+2.5kg upper / +5kg lower, or +1 rep if the dumbbell jump is too big).
- If they beat the target, jump more.
- Hold the load once if they miss reps once. Cut ~10% (deload that lift) after 2 consecutive misses on the same exercise.
- Call out skipped sessions or sandbagging plainly. Be direct, motivating, short.

Never injure them:
- Any mention of pain, tweak, or sharp discomfort: remove or swap the movement that loads that area and say so. Pain ≠ soreness; ask if unclear.
- Weekly hard sets per muscle grows at most ~10% week over week.
- Schedule a deload week every 4-6 weeks of hard progression, or earlier if performance drops across several lifts.
- New lifts start conservative (RPE ~7) until you have data.

Only use exercises from the catalog, by exact id. Weights in the athlete's unit. Use 0 for bodyweight exercises.

Output:
- program: the weekly plan (split, days, purpose of each day) — keep it stable unless there is a reason to change it, and say why if you change it.
- templates: one entry per distinct workout day in the program (e.g. "Upper A", "Lower A"), each exercise with per-set weight x reps = the exact prescription for the NEXT time they do that day, plus a short cue. Re-prescribe EVERY template every call (progress the day just trained from its actual results; adjust others for fatigue, scorecard, trends). Keep names stable across calls so they update in place. The athlete may have edited your templates by hand (swapped, added or removed exercises, changed sets): treat their current version as their preference and keep those changes unless they are unsafe or clearly hurt the goal — if you override one, say why in message.
- next_template: name of the template they should do next (one of your templates).
- scorecard: one line per target: "Target — best now → goal by date — STATUS (rate needed vs actual)". Empty string only until targets exist.
- message: 2-4 sentences to the athlete: verdict on the last session, today's PR attempt, and what changed if anything is behind.
- notes: your private memory for next time. Rewrite it fully each call: goal progress, per-lift trend (best sets, stalls), fatigue, injuries/pain history, adherence, current mesocycle week. Be concise — this is all you'll remember beyond the raw logs.`;

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['program', 'scorecard', 'templates', 'next_template', 'message', 'notes'],
  properties: {
    program: { type: 'string' },
    scorecard: { type: 'string' },
    templates: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'exercises'],
        properties: {
          name: { type: 'string' },
          exercises: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['exercise_id', 'cue', 'sets'],
              properties: {
                exercise_id: { type: 'integer' },
                cue: { type: 'string' },
                sets: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['weight', 'reps'],
                    properties: { weight: { type: 'number' }, reps: { type: 'integer' } },
                  },
                },
              },
            },
          },
        },
      },
    },
    next_template: { type: 'string' },
    message: { type: 'string' },
    notes: { type: 'string' },
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Missing authorization header' }, 401);

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (!user) return json({ error: 'Unauthorized' }, 401);

  try {
    const { goal, days_per_week } = await req.json().catch(() => ({}));
    if (goal !== undefined || days_per_week !== undefined) {
      const { error } = await supabase.from('coach_state').upsert({
        user_id: user.id,
        ...(goal !== undefined && { goal: String(goal).slice(0, 2000) }),
        ...(days_per_week !== undefined && { days_per_week: Math.min(7, Math.max(1, Number(days_per_week) || 4)) }),
      });
      if (error) throw error;
    }

    const [{ data: state }, { data: profile }, { data: workouts, error: wErr }, { data: exercises, error: eErr }, { data: templates }] =
      await Promise.all([
        supabase.from('coach_state').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('profiles').select('age, gender, height, weight, weight_unit').eq('id', user.id).maybeSingle(),
        supabase
          .from('workouts')
          .select('started_at, name, notes, workout_sets(set_number, weight, reps, exercises(name))')
          .eq('user_id', user.id)
          .not('completed_at', 'is', null)
          .order('started_at'),
        supabase.from('exercises').select('id, name').or(`is_custom.eq.false,user_id.eq.${user.id}`).order('id'),
        supabase.from('workout_templates').select('name, exercises').eq('user_id', user.id).eq('from_coach', true).order('name'),
      ]);
    if (wErr) throw wErr;
    if (eErr) throw eErr;
    if (!state?.goal) return json({ error: 'Set a goal first' }, 400);

    // ponytail: full history every call. ~50 tokens/session → years fit in context. Summarize old logs only if cost bites.
    const history = (workouts ?? [])
      .map((w: any) => {
        const byExercise = new Map<string, string[]>();
        for (const s of [...w.workout_sets].sort((a: any, b: any) => a.set_number - b.set_number)) {
          const name = s.exercises?.name ?? '?';
          byExercise.set(name, [...(byExercise.get(name) ?? []), `${s.weight}x${s.reps}`]);
        }
        const lines = [...byExercise].map(([name, sets]) => `  ${name}: ${sets.join(', ')}`);
        const notes = w.notes ? ` — athlete notes: ${w.notes}` : '';
        return `${w.started_at.slice(0, 10)} ${w.name ?? ''}${notes}\n${lines.join('\n')}`;
      })
      .join('\n');

    const catalog = (exercises ?? []).map((e: any) => `${e.id}: ${e.name}`).join('\n');
    const exerciseName = new Map((exercises ?? []).map((e: any) => [e.id, e.name]));
    const currentTemplates = (templates ?? [])
      .map((t: any) => `${t.name}: ${(t.exercises ?? []).map((e: any) => `${exerciseName.get(e.exerciseId) ?? e.exerciseId} ${e.targets?.length ? e.targets.map((t: any) => `${t.weight}x${t.reps}`).join(' ') : `${e.sets} sets`}`).join(', ')}`)
      .join('\n');

    const userContent = `Today: ${new Date().toISOString().slice(0, 10)}
Goal: ${state.goal}
Training days per week: ${state.days_per_week}
Athlete profile: ${JSON.stringify(profile ?? {})}

Your current program:
${state.program ?? '(none yet — design it)'}

Your templates as they are now (athlete may have edited them):
${currentTemplates || '(none yet)'}

Your coach notes from last time:
${state.notes ?? '(none yet — first call)'}

Workout history (weight x reps):
${history || '(no workouts logged yet — prescribe a calibration session)'}

Exercise catalog (id: name):
${catalog}`;

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });
    const response = await anthropic.beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: SCHEMA } },
      system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userContent }],
    } as any);

    if (response.stop_reason === 'refusal') return json({ error: 'Coach declined this request' }, 502);
    if (response.stop_reason === 'max_tokens') return json({ error: 'Coach response was cut off' }, 502);
    const text = response.content.find((b: any) => b.type === 'text') as { text: string } | undefined;
    if (!text) return json({ error: 'Empty coach response' }, 502);
    const out = JSON.parse(text.text);

    // One source of truth: next session = the chosen template's prescription.
    const next = out.templates.find((t: any) => t.name === out.next_template) ?? out.templates[0];
    out.next_session = next && {
      name: next.name,
      exercises: next.exercises.map((e: any) => ({ ...e, name: exerciseName.get(e.exercise_id) ?? 'Exercise' })),
    };

    const { data: saved, error: saveErr } = await supabase
      .from('coach_state')
      .update({
        program: out.program,
        scorecard: out.scorecard,
        notes: out.notes,
        message: out.message,
        next_session: out.next_session,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select()
      .single();
    if (saveErr) throw saveErr;

    await syncTemplates(supabase, user.id, out.templates);

    return json(saved);
  } catch (error) {
    console.error('coach error:', error);
    return json({ error: String((error as Error)?.message ?? error) }, 500);
  }
});

// Update coach templates in place by name, insert new ones, drop stale ones.
async function syncTemplates(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  templates: { name: string; exercises: { exercise_id: number; cue: string; sets: { weight: number; reps: number }[] }[] }[]
) {
  const { data: existing, error } = await supabase
    .from('workout_templates')
    .select('id, name')
    .eq('user_id', userId)
    .eq('from_coach', true);
  if (error) throw error;
  const byName = new Map((existing ?? []).map((t: any) => [t.name, t.id]));

  for (const t of templates) {
    const exercises = t.exercises.map((e) => ({
      exerciseId: e.exercise_id,
      sets: e.sets.length,
      targets: e.sets,
      cue: e.cue,
    }));
    const id = byName.get(t.name);
    const { error: err } = id
      ? await supabase.from('workout_templates').update({ exercises }).eq('id', id)
      : await supabase.from('workout_templates').insert({ user_id: userId, name: t.name, exercises, from_coach: true });
    if (err) throw err;
    byName.delete(t.name);
  }

  // ponytail: stale template still scheduled in planned_workouts → FK blocks delete; it just stays. Fine.
  for (const id of byName.values()) {
    await supabase.from('workout_templates').delete().eq('id', id);
  }
}
