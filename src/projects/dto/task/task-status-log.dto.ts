import { TaskStatus } from "@prisma/client";

export class TaskStatusLogDto {
  id: string;
  taskId: string;
  userId: string;
  oldStatus: TaskStatus | null;
  newStatus: TaskStatus;
  comment: string | null;
  createdAt: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
}
