// ============================================================
// RiseFinance — Supabase клієнт
// ============================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// ⚠️ ЗАМІНІТЬ на свої дані з Supabase → Settings → API
const SUPABASE_URL = 'https://ohsfqrslfgxiltwihntw.supabase.co';
// Використовуйте anon public key (JWT, починається з eyJ...)
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oc2ZxcnNsZmd4aWx0d2lobnR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwOTY4NjcsImV4cCI6MjEwNzY3Mjg2N30.WKi98O4o2tCHyLHRn5HvNxd0MJM2SLmMqr34L_r_Xzg';

if (!SUPABASE_ANON_KEY.startsWith('eyJ')) {
  console.error(
    '[RiseFinance] ❌ Неправильний Supabase ключ.\n' +
    'Потрібен anon public key (eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oc2ZxcnNsZmd4aWx0d2lobnR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwOTY4NjcsImV4cCI6MjEwNzY3Mjg2N30.WKi98O4o2tCHyLHRn5HvNxd0MJM2SLmMqr34L_r_Xzg).\n' +
    'Settings → API → Project API keys → anon public'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== Новини =====
export async function loadNews() {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(6);
  if (error) throw error;
  return data ?? [];
}

// ===== Консультація =====
export async function submitConsultation({ name, email, message }) {
  const { error } = await supabase
    .from('consultations')
    .insert({ name, email, message });
  if (error) throw error;
}

// ===== Підписка =====
export async function subscribe(email) {
  const { error } = await supabase
    .from('subscribers')
    .insert({ email });
  if (error) {
    if (error.code === '23505') {
      throw new Error('Ця адреса вже підписана на новини.');
    }
    throw error;
  }
}

// ===== Авторизація адміна =====
export async function loginAdmin(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function logoutAdmin() {
  await supabase.auth.signOut();
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// ===== Адмін-операції =====
export async function getConsultations() {
  const { data, error } = await supabase
    .from('consultations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function toggleConsultation(id, currentStatus) {
  const newStatus = currentStatus === 'new' ? 'processed' : 'new';
  const { error } = await supabase
    .from('consultations')
    .update({ status: newStatus })
    .eq('id', id);
  if (error) throw error;
}

export async function addNews({ title, content, image }) {
  const { error } = await supabase
    .from('news')
    .insert({ title, content, image: image || null });
  if (error) throw error;
}

export async function deleteNews(id) {
  const { error } = await supabase.from('news').delete().eq('id', id);
  if (error) throw error;
}

export async function getStats() {
  const [c, n, s, news] = await Promise.all([
    supabase.from('consultations').select('*', { count: 'exact', head: true }),
    supabase.from('consultations').select('*', { count: 'exact', head: true }).eq('status', 'new'),
    supabase.from('subscribers').select('*', { count: 'exact', head: true }),
    supabase.from('news').select('*', { count: 'exact', head: true }),
  ]);
  return {
    consultations: c.count ?? 0,
    new: n.count ?? 0,
    subscribers: s.count ?? 0,
    news: news.count ?? 0,
  };
}