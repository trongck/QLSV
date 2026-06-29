"use client";

import { useState } from "react";
import { useTeacherRoster } from "@/hooks/giangvien/useTeacherRoster";
import styles from "@/app/(dashboard)/teacher/dashboard/teacher-dashboard.module.css";

interface RosterStudent {
  mssv: string;
  name: string;
  class: string;
  phone: string;
  email: string;
  parent: string;
  parentName: string;
  parentPhone: string;
  address: string;
  rawAddress: string;
}

export function RosterView() {
  const {
    classes,
    students: rawStudents,
    selectedPC,
    setSelectedPC,
    loading,
    rosterLoading,
    updateStudent,
  } = useTeacherRoster();

  // Map hook's StudentRosterRow → local display shape
  const studentList: RosterStudent[] = rawStudents.map((s) => ({
    mssv: s.mssv,
    name: s.name,
    class: s.class,
    phone: s.phone,
    email: s.email,
    parent: s.parent,
    parentName: s.parentName,
    parentPhone: s.parentPhone,
    address: s.address,
    rawAddress: s.rawAddress,
  }));

  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<RosterStudent | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenEdit = (student: RosterStudent) => {
    setEditingStudent({ ...student });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    setIsSaving(true);
    try {
      await updateStudent({
        masv: editingStudent.mssv,
        name: editingStudent.name,
        email: editingStudent.email,
        phone: editingStudent.phone,
        parentName: editingStudent.parentName,
        parentPhone: editingStudent.parentPhone,
        address: editingStudent.rawAddress || editingStudent.address,
      });
      alert("Đã cập nhật thông tin sinh viên thành công!");
      setIsEditModalOpen(false);
    } catch {
      // error is handled inside updateStudent (alert)
    } finally {
      setIsSaving(false);
    }
  };

  // Lọc an toàn đề phòng s.mssv hoặc s.name bị null từ DB
  const filteredStudents = studentList.filter(s => {
    const mssvMatch = s?.mssv ? s.mssv.includes(searchQuery.trim()) : false;
    const nameMatch = s?.name ? s.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) : false;
    return mssvMatch || nameMatch;
  });

  // Tìm sinh viên đang chọn một cách an toàn
  const currentStudent = studentList.find(s => s.mssv === selectedStudent) || studentList[0] || null;


  return (
    <div className="flex flex-col gap-5">
      {/* Tiêu đề & Thanh công cụ (Bố cục đồng bộ trang xanh) */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#6B4F43] m-0">Hồ sơ &amp; Danh sách sinh viên</h2>
          <p className="text-[13px] text-[#8B6F5F] m-0 mt-1">Tra cứu thông tin liên hệ và lý lịch chi tiết của sinh viên lớp giảng dạy</p>
        </div>

        {/* Thanh công cụ tìm kiếm và lọc ngang trải dài */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-[#FFF8F5] p-3 sm:px-4 rounded-xl border border-[#F0E1D9]">
          <div className="flex items-center gap-2.5 flex-1 w-full sm:max-w-[400px]">
            <input 
              type="text" 
              placeholder="Tìm kiếm mã số hoặc tên..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-[#EAD9CB] outline-none text-[13px] bg-white focus:border-[#F2A8A8] transition-colors"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full sm:w-auto">
            <span className="text-[13.5px] font-semibold text-[#6B4F43]">Lớp học phần:</span>
            <select 
              value={selectedPC ?? ""} 
              onChange={(e) => setSelectedPC(Number(e.target.value))}
              className="px-4 py-2 rounded-lg border border-[#EAD9CB] outline-none text-[#6B4F43] bg-white font-medium cursor-pointer w-full sm:w-auto focus:border-[#F2A8A8] transition-colors"
            >
              {classes.map(cls => (
                <option key={cls.maphancong} value={cls.maphancong}>
                  {(cls?.lop?.tenlop || cls?.malop || "")} - {(cls?.monhoc?.tenmon || "")}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bố cục chia cột: Bảng bên trái, Chi tiết cố định bên phải */}
      <div className="grid grid-cols-1 lg:grid-cols-3 items-start gap-6">
        
        {/* Khối 1: Bảng danh sách sinh viên */}
        <section className="bg-white p-0 overflow-hidden border border-[#F0E1D9] rounded-xl shadow-sm lg:col-span-2">
          <div className="py-4 px-5 border-b border-[#F0E1D9] bg-[#FFFBF9]">
            <h3 className="m-0 text-[15px] text-[#6B4F43] font-bold">Danh Sách Lớp Học</h3>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="w-full border-collapse text-left min-w-[800px]">
              <thead>
                <tr className="border-b border-[#F0E1D9] bg-[#FFFDFD]">
                  <th className="py-3.5 px-5 text-[13px] text-[#8B6F5F] font-semibold">Mã SV</th>
                  <th className="py-3.5 px-5 text-[13px] text-[#8B6F5F] font-semibold">Họ và tên</th>
                  <th className="py-3.5 px-5 text-[13px] text-[#8B6F5F] font-semibold">Lớp sinh hoạt</th>
                  <th className="py-3.5 px-5 text-[13px] text-[#8B6F5F] font-semibold">Số điện thoại</th>
                  <th className="py-3.5 px-5 text-[13px] text-[#8B6F5F] font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading || rosterLoading ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-[#8B6F5F]">
                      Đang tải danh sách sinh viên...
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-[#8B6F5F]">
                      Không tìm thấy sinh viên nào.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((std) => (
                    <tr 
                      key={std?.mssv} 
                      onClick={() => setSelectedStudent(std?.mssv)}
                      className={`border-b border-[#FDF3EE] cursor-pointer transition-colors duration-200 ${selectedStudent === std?.mssv ? "bg-[#FFF2F2]" : "bg-transparent hover:bg-gray-50"}`}
                    >
                      <td className="py-3.5 px-5 text-[13.5px] font-medium">{std?.mssv}</td>
                      <td className="py-3.5 px-5 text-sm font-semibold text-[#6B4F43]">{std?.name}</td>
                      <td className="py-3.5 px-5 text-[13.5px] text-[#8B6F5F]">{std?.class}</td>
                      <td className="py-3.5 px-5 text-[13.5px] text-[#6B4F43]">{std?.phone || "---"}</td>
                      <td className="py-3.5 px-5 text-right">
                        <span className={`text-[12.5px] font-bold border py-1 px-2.5 rounded-md ${selectedStudent === std?.mssv ? "text-[#C25450] border-[#C25450] bg-white" : "text-[#8B6F5F] border-[#8B6F5F] bg-[#FFFDFD]"}`}>
                          {selectedStudent === std?.mssv ? "Đang xem" : "Xem chi tiết"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Khối 2: Chi tiết thông tin sinh viên cố định ở bên phải */}
        <div className="lg:sticky lg:top-6 lg:col-span-1 w-full lg:max-h-[calc(100vh-80px)] lg:overflow-y-auto">
          {currentStudent ? (
            <section className="bg-white border border-[#F0E1D9] rounded-xl p-5 flex flex-col gap-5 shadow-sm">
              <div className="flex flex-col justify-between items-start border-b border-[#F0E1D9] pb-4 gap-4">
                <div className="flex items-center gap-4 w-full">
                  <div className="w-[55px] h-[55px] shrink-0 rounded-full bg-[#F2A8A8] flex items-center justify-center text-white text-[22px] font-bold">
                    {(currentStudent?.name ? currentStudent.name.charAt(0) : "?")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="m-0 text-base text-[#6B4F43] font-bold truncate">{currentStudent?.name}</h3>
                    <p className="m-0 mt-1 text-[12px] text-[#8B6F5F]">Mã số sinh viên: <strong>{currentStudent?.mssv}</strong></p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => handleOpenEdit(currentStudent)}
                  className="w-full py-2 px-4 rounded-lg border border-[#EAD9CB] bg-[#FFF8F5] text-[#6B4F43] text-[13px] font-semibold cursor-pointer hover:bg-[#FFF2EC] transition-colors"
                >
                   Chỉnh sửa hồ sơ
                </button>
              </div>

              {/* Grid thông tin xếp dọc gọn gàng để vừa với cột bên phải */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2.5 bg-[#FAF5F2] p-4 rounded-lg">
                  <h4 className="m-0 mb-1 text-[#8B6F5F] text-[12px] font-bold uppercase tracking-[0.5px]">Thông tin liên lạc</h4>
                  <div className="flex justify-between text-[13px] gap-2">
                    <span className="text-[#8B6F5F]">Lớp sinh hoạt:</span> <strong className="text-[#6B4F43] text-right">{currentStudent?.class}</strong>
                  </div>
                  <div className="flex justify-between text-[13px] gap-2">
                    <span className="text-[#8B6F5F]">Số điện thoại:</span> <strong className="text-[#6B4F43] text-right">{currentStudent?.phone}</strong>
                  </div>
                  <div className="flex justify-between text-[13px] gap-2">
                    <span className="text-[#8B6F5F]">Địa chỉ Email:</span> <strong className="text-[#6B4F43] text-right break-all">{currentStudent?.email}</strong>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 bg-[#FAF5F2] p-4 rounded-lg">
                  <h4 className="m-0 mb-1 text-[#8B6F5F] text-[12px] font-bold uppercase tracking-[0.5px]">Thông tin gia đình &amp; Cư trú</h4>
                  <div className="flex justify-between text-[13px] gap-2">
                    <span className="text-[#8B6F5F]">Phụ huynh:</span> <strong className="text-[#6B4F43] text-right">{currentStudent?.parent}</strong>
                  </div>
                  <div className="flex flex-col gap-1 text-[13px]">
                    <span className="text-[#8B6F5F]">Địa chỉ thường trú:</span> <strong className="text-[#6B4F43] leading-relaxed">{currentStudent?.address}</strong>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <div className="py-10 px-5 text-center text-[#8B6F5F] bg-white rounded-xl border border-[#F0E1D9] shadow-sm">
              Hãy chọn một sinh viên để xem chi tiết
            </div>
          )}
        </div>
      </div>

      {/* Backdrop-blurred Student Edit Modal Overlay */}
      {isEditModalOpen && editingStudent && (
        <div className="fixed inset-0 bg-[#2D1B14]/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-[520px] shadow-[0_20px_40px_rgba(0,0,0,0.2)] border border-[#EAD9CB] overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-[#F2A8A8] to-[#FFB4B4] p-5 sm:px-6 relative shrink-0">
              <h3 className="m-0 text-lg font-bold text-[#2D1B14]">Chỉnh sửa thông tin Sinh viên</h3>
              <p className="m-0 mt-1 text-[13px] opacity-90 text-[#2D1B14]">Mã số Sinh viên: <strong>{editingStudent?.mssv}</strong></p>
              <button 
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="absolute top-5 right-6 bg-transparent border-none text-xl cursor-pointer text-[#2D1B14] font-bold hover:opacity-70 transition-opacity"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="p-5 sm:p-6 flex flex-col gap-4 overflow-y-auto">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#8B6F5F] uppercase text-left">Họ và tên</label>
                  <input 
                    type="text" 
                    value={editingStudent?.name || ""}
                    onChange={(e) => setEditingStudent(prev => prev ? { ...prev, name: e.target.value } : null)}
                    required
                    className="p-2.5 px-3 rounded-lg border border-[#EAD9CB] text-sm outline-none text-[#2D1B14] focus:border-[#F2A8A8] transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#8B6F5F] uppercase text-left">Số điện thoại</label>
                  <input 
                    type="text" 
                    value={editingStudent?.phone || ""}
                    onChange={(e) => setEditingStudent(prev => prev ? { ...prev, phone: e.target.value } : null)}
                    required
                    className="p-2.5 px-3 rounded-lg border border-[#EAD9CB] text-sm outline-none text-[#2D1B14] focus:border-[#F2A8A8] transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#8B6F5F] uppercase text-left">Địa chỉ Email</label>
                <input 
                  type="email" 
                  value={editingStudent?.email || ""}
                  onChange={(e) => setEditingStudent(prev => prev ? { ...prev, email: e.target.value } : null)}
                  required
                  className="p-2.5 px-3 rounded-lg border border-[#EAD9CB] text-sm outline-none text-[#2D1B14] focus:border-[#F2A8A8] transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#8B6F5F] uppercase text-left">Họ tên Phụ huynh</label>
                  <input 
                    type="text" 
                    value={editingStudent?.parentName || ""}
                    onChange={(e) => setEditingStudent(prev => prev ? { ...prev, parentName: e.target.value } : null)}
                    required
                    className="p-2.5 px-3 rounded-lg border border-[#EAD9CB] text-sm outline-none text-[#2D1B14] focus:border-[#F2A8A8] transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#8B6F5F] uppercase text-left">SĐT Phụ huynh</label>
                  <input 
                    type="text" 
                    value={editingStudent?.parentPhone || ""}
                    onChange={(e) => setEditingStudent(prev => prev ? { ...prev, parentPhone: e.target.value } : null)}
                    required
                    className="p-2.5 px-3 rounded-lg border border-[#EAD9CB] text-sm outline-none text-[#2D1B14] focus:border-[#F2A8A8] transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#8B6F5F] uppercase text-left">Nơi cư trú</label>
                <input 
                  type="text" 
                  value={(editingStudent?.rawAddress || editingStudent?.address || "")}
                  onChange={(e) => setEditingStudent(prev => prev ? { ...prev, rawAddress: e.target.value } : null)}
                  required
                  className="p-2.5 px-3 rounded-lg border border-[#EAD9CB] text-sm outline-none text-[#2D1B14] focus:border-[#F2A8A8] transition-colors"
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 mt-2.5 border-t border-[#F5EAE1] pt-5">
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)}
                  className="py-2.5 px-4 rounded-lg border border-[#EAD9CB] bg-white text-[#6B4F3F] text-[13.5px] font-semibold cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="py-2.5 px-5 rounded-lg border-none btn-teacher text-white text-[13.5px] font-bold cursor-pointer shadow-[0_4px_12px_rgba(242,168,168,0.4)] hover:opacity-90 transition-opacity disabled:opacity-70"
                >
                  {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}