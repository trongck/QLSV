"use client";

import { useEffect, useState } from "react";
import { notificationRepository } from "@/services/repositories/notification.repo";
import { Notification } from "@/types/notification";

export const useNotification = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await notificationRepository.getNotifications();
      setNotifications(data);
    } finally {
      setLoading(false);
    }
  };

  return {
    notifications,
    loading,
  };
};
