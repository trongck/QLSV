import { notificationData } from "@/data/notification.data";

export const notificationRepository = {
  async getNotifications() {
    return Promise.resolve(notificationData);
  },
};
