import { getSupabaseClient } from "@/lib/utils/supabase/server";

export const scheduleRepo = {
  async getMySchedule(magv: string) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("lichhoc")
      .select("*")
      .eq("magv", magv);
  }
};
