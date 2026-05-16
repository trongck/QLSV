export default function NotificationRightSidebar() {
  return (
    <div className="space-y-6">
      <div className="card p-6 rounded-3xl">
        <h3 className="font-bold mb-5 uppercase text-[var(--color-fg-subtle)]">
          Phân loại đối tượng
        </h3>

        <div className="space-y-4">
          <div className="bg-[#fff4f4] rounded-2xl px-4 py-3 flex justify-between">
            <span>Tất cả</span>
            <span>28</span>
          </div>

          <div className="flex justify-between px-4">
            <span>Sinh viên</span>
            <span>18</span>
          </div>

          <div className="flex justify-between px-4">
            <span>Giảng viên</span>
            <span>6</span>
          </div>

          <div className="flex justify-between px-4">
            <span>Nhân viên</span>
            <span>3</span>
          </div>
        </div>
      </div>

      <div className="card p-6 rounded-3xl">
        <h3 className="font-bold mb-5 uppercase text-[var(--color-fg-subtle)]">
          Dung lượng lưu trữ
        </h3>

        <div className="w-full h-3 bg-[#f3efeb] rounded-full overflow-hidden mb-4">
          <div className="w-[32%] h-full bg-[var(--color-primary)] rounded-full" />
        </div>

        <div className="flex justify-between text-sm text-[var(--color-fg-subtle)] mb-5">
          <span>3.2 GB / 10 GB</span>
          <span>32%</span>
        </div>

        <button className="btn-secondary w-full h-[48px]">Nâng cấp ngay</button>
      </div>
    </div>
  );
}
