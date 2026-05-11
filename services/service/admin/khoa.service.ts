import { SupabaseClient } from "@supabase/supabase-js";
import * as repo from "../../repositories/admin/khoa.repo";

export async function getKhoaListService(supabase: SupabaseClient, search?: string) {
  const { data, error } = await repo.getKhoaListRepo(supabase, search);
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function createKhoaService(supabase: SupabaseClient, body: any) {
  const { makhoa, tenkhoa, dienthoai, email } = body;
  const { data, error } = await repo.createKhoaRepo(supabase, {
    makhoa: makhoa.trim(),
    tenkhoa: tenkhoa.trim(),
    dienthoai: dienthoai || null,
    email: email || null,
  });

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function updateKhoaService(supabase: SupabaseClient, makhoa: string, body: any) {
  const { tenkhoa, dienthoai, email } = body;
  const { data, error } = await repo.updateKhoaRepo(supabase, makhoa, {
    tenkhoa: tenkhoa.trim(),
    dienthoai: dienthoai || null,
    email: email || null,
  });

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function deleteKhoaService(supabase: SupabaseClient, makhoa: string) {
  const { error } = await repo.deleteKhoaRepo(supabase, makhoa);
  if (error) {
    throw new Error(error.message);
  }
}
