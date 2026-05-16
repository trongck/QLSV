export interface Notification {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  type: string;
  important?: boolean;
}
