import { scheduleRepo } from "@/services/repositories/giangvien/schedule.repo";

export const scheduleService = {
  /**
   * Lấy danh sách lịch dạy
   */
  async getMySchedule(magv: string) {
    const { data, error } = await scheduleRepo.getMySchedule(magv);

    if (error) return [];
    return data;
  },
};
