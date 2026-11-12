// Supabase Edge Function: create-admin (deploy with `supabase functions deploy create-admin`)
// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY secrets. Invoke from owner session.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization') || '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anon = Deno.env.get('SUPABASE_ANON_KEY');
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const userClient = createClient(supabaseUrl, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    const { data: profile } = await userClient.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'owner') return new Response(JSON.stringify({ error: 'Owner only' }), { status: 403 });

    const { email, password, name, phone } = await req.json();
    const admin = createClient(supabaseUrl, service);
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name, phone } });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    await admin.from('profiles').upsert({ id: data.user.id, email, name, phone, role: 'admin' });
    return new Response(JSON.stringify({ ok: true, userId: data.user.id }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
});
