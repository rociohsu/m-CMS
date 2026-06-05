export let supabaseClient = null;

export async function initSupabase() {
  const SUPABASE_URL = "https://eusonkecppneirbualig.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_RZ-WBngQ-4ERcXx7wMhpTw_-Dwk61YT";

  try {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.supabaseClient = supabaseClient;
  } catch (e) {
    console.error("Supabase 初始化連線失敗:", e);
  }
}
