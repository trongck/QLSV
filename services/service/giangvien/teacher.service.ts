import { diemDanhService } from "./diemdanh.service";
import { examService } from "./exam.service";
import { scheduleService } from "./schedule.service";
import { profileService } from "./profile.service";
import { dashboardService } from "./dashboard.service";
import { classService } from "./class.service";
import { gradeService } from "./grade.service";
import { rosterService } from "./roster.service";
import { taskService } from "./task.service";
import { reportService } from "./report.service";
import { notificationService } from "./notification.service";

export const giangVienService = {
  ...profileService,
  ...dashboardService,
  ...classService,
  ...gradeService,
  ...rosterService,
  ...taskService,
  ...reportService,
  ...scheduleService,
  ...diemDanhService,
  ...examService,
  ...notificationService,
};
