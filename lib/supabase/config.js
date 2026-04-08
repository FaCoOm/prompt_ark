// lib/supabase/config.js - Supabase Configuration
// Should match prompt-ark-hub-supabase/.env

const PROD_SUPABASE_URL = 'https://uwuiarfxrgdvvnhoixqs.supabase.co';
const PROD_SUPABASE_ANON_KEY = 'sb_publishable_8VG9tfMMsWXNQmUq7B3t5g_hs4BNBCQ';
const PROD_SITE_ROOT = 'https://promptark.oometa.ai';
const PROD_HUB_URL = `${PROD_SITE_ROOT}/hub`;

let cachedSiteRoot = null;
let cachedHubUrl = null;
let cachedSupabaseConfig = null;

export async function getSiteRoot() {
  if (cachedSiteRoot) return cachedSiteRoot;

  cachedSiteRoot = PROD_SITE_ROOT;
  return cachedSiteRoot;
}

export async function getHubUrl() {
  if (cachedHubUrl) return cachedHubUrl;

  cachedHubUrl = PROD_HUB_URL;
  return cachedHubUrl;
}

export async function getSupabaseConfig() {
  if (cachedSupabaseConfig) return cachedSupabaseConfig;

  cachedSupabaseConfig = { url: PROD_SUPABASE_URL, anonKey: PROD_SUPABASE_ANON_KEY };
  return cachedSupabaseConfig;
}
