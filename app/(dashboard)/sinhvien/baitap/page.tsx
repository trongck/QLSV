"use client";

import React, { useState, useEffect } from "react";
import { Search, FileText, Loader2 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useStudentAssignments, Assignment } from "@/hooks/sinhvien/useStudentAssignments";
import { AssignmentCard } from "@/components/student/assignments/AssignmentCard";
import { AssignmentViewerModal } from "@/components/student/assignments/AssignmentViewerModal";
import { AssignmentSubmitModal } from "@/components/student/assignments/AssignmentSubmitModal";
import { SubmissionDetailModal } from "@/components/student/assignments/SubmissionDetailModal";

export default function AssignmentPage() {
  const {
    filteredAssignments,
    loading,
    submitting,
    error,
    successMsg,
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    handleSubmitWithUpload,
  } = useStudentAssignments();

  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Submit states
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitTarget, setSubmitTarget] = useState<Assignment | null>(null);

  // Submission detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailTarget, setDetailTarget] = useState<Assignment | null>(null);

  const openSubmitModal = (item: Assignment) => {
    setSubmitTarget(item);
    setShowSubmitModal(true);
  };

  const handleSubmit = async (submitText: string, file: File | null, fileUrl: string | null) => {
    if (!submitTarget) return;
    try {
      await handleSubmitWithUpload(submitTarget.mabaitap, submitText, file, fileUrl);
      setTimeout(() => {
        setShowSubmitModal(false);
        setSubmitTarget(null);
      }, 1500);
    } catch (err) {
      // Error handled by hook state (error)
    }
  };

  return (
    <DashboardShell pageTitle="Bài tập">
      <div className="p-4 sm:p-8 bg-[#FAF7F6] min-h-screen font-sans">
        {/* Header */}
        <div className="mb-6 sm:mb-10 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Bài tập</h1>
            <p className="text-gray-400 text-sm mt-1">Danh sách bài tập và đồ án cần hoàn thành</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
          <div className="flex bg-gray-200/50 p-1 rounded-2xl w-full md:w-auto">
            {["Tất cả", "Chưa làm", "Đã nộp"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab
                    ? "bg-[#6B7280] text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <input
                type="text"
                placeholder="Tìm kiếm bài tập..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 ring-red-100 outline-none transition-all shadow-sm"
              />
              <Search
                className="absolute left-4 top-3.5 text-gray-400"
                size={20}
              />
            </div>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-3 text-gray-400">
            <Loader2 size={32} className="animate-spin text-red-500" />
            <p className="text-sm font-bold">Đang tải danh sách bài tập...</p>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="bg-white p-20 rounded-[2.5rem] border border-dashed border-gray-200 text-center">
            <FileText className="mx-auto mb-4 text-[#EAD9CB]" size={64} />
            <p className="text-gray-400 font-bold text-lg">Không tìm thấy bài tập nào</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredAssignments.map((item) => (
              <AssignmentCard
                key={item.mabaitap}
                item={item}
                onViewDetails={(target) => {
                  setSelectedAssignment(target);
                  setShowModal(true);
                }}
                onSubmit={openSubmitModal}
                onViewSubmission={(target) => {
                  setDetailTarget(target);
                  setShowDetailModal(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Assignment Viewer Modal */}
      <AssignmentViewerModal
        isOpen={showModal}
        assignment={selectedAssignment}
        onClose={() => {
          setShowModal(false);
          setSelectedAssignment(null);
        }}
      />

      {/* Submit Modal */}
      <AssignmentSubmitModal
        isOpen={showSubmitModal}
        assignment={submitTarget}
        onClose={() => {
          setShowSubmitModal(false);
          setSubmitTarget(null);
        }}
        onSubmit={handleSubmit}
        isSubmitting={submitting}
        error={error}
        success={successMsg}
      />

      {/* Submission Detail Modal */}
      <SubmissionDetailModal
        isOpen={showDetailModal}
        assignment={detailTarget}
        onClose={() => {
          setShowDetailModal(false);
          setDetailTarget(null);
        }}
      />
    </DashboardShell>
  );
}