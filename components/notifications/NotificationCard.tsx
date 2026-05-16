import { MoreVertical } from "lucide-react";
import { Notification } from "@/types/notification";

interface Props {
  data: Notification;
}

export default function NotificationCard({ data }: Props) {
  return (
    <div className="flex items-center justify-between p-5 border-b border-[#f3efeb] last:border-none">
      <div>
        <h3 className="font-bold text-lg mb-2">{data.title}</h3>

        <p className="text-[#777]">{data.description}</p>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-[#777]">{data.createdAt}</span>

        <span className="bg-[#fde9e8] text-[#d85c57] px-3 py-1 rounded-full text-sm">
          {data.type}
        </span>

        <button>
          <MoreVertical size={18} />
        </button>
      </div>
    </div>
  );
}
