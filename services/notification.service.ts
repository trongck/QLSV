import api from "@/lib/axios";

export const notificationService = {
  async getAll() {
    return api.get("/notifications");
  },
};
