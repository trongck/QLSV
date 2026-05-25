import React from "react";

interface MessagesLayoutProps {
  children: React.ReactNode;
}

export function MessagesLayout({ children }: MessagesLayoutProps) {
  return (
    <>
      <style>{`
        .msg-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
          height: calc(100vh - 130px);
        }
        .msg-layout {
          display: flex;
          padding: 0;
          flex: 1;
          min-height: 0;
          overflow: hidden;
          border: 1px solid #F0E1D9;
          border-radius: 12px;
          background: #FFF;
          box-shadow: 0 4px 20px rgba(76, 38, 24, 0.03);
        }
        .msg-sidebar-left {
          width: 300px;
          border-right: 1px solid #F0E1D9;
          display: flex;
          flex-direction: column;
          background: #FDF8F5;
          flex-shrink: 0;
        }
        .msg-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #FAF6F3;
          min-width: 0;
        }
        .msg-sidebar-right {
          width: 240px;
          border-left: 1px solid #F0E1D9;
          padding: 20px;
          display: flex;
          flex-direction: column;
          background: #FDF8F5;
          flex-shrink: 0;
          overflow-y: auto;
        }

        /* Responsive */
        @media (max-width: 1200px) {
          .msg-sidebar-right {
            display: none !important;
          }
        }
        @media (max-width: 768px) {
          .msg-container {
            padding: 0;
            height: calc(100vh - 56px);
            gap: 0;
          }
          .msg-layout {
            flex-direction: column;
            height: 100%;
            border: none;
            border-radius: 0;
            box-shadow: none;
          }
          
          /* When showing list (hide chat panel) */
          .msg-layout.show-list .msg-sidebar-left {
            width: 100%;
            height: 100%;
            display: flex;
            border-right: none;
            border-bottom: none;
          }
          .msg-layout.show-list .msg-main {
            display: none !important;
          }
          
          /* When showing chat panel (hide list panel) */
          .msg-layout.show-chat .msg-sidebar-left {
            display: none !important;
          }
          .msg-layout.show-chat .msg-main {
            width: 100%;
            height: 100%;
            display: flex;
          }
          
          /* Show back button on mobile */
          .msg-back-btn {
            display: block !important;
          }
        }
      `}</style>
      <div className="msg-container">{children}</div>
    </>
  );
}
