import Sidebar from "@/components/layout/Sidebar"; // Hoặc đường dẫn đến file Sidebar của bạn
import Header from "@/components/layout/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      {/* 1. Gọi Sidebar ở đây để nó hiện bên trái */}
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 2. Gọi Header ở trên cùng (nếu có) */}
        <Header />

        {/* 3. Phần nội dung trang (children) sẽ hiện ở bên phải Sidebar */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
