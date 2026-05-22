import React from "react";

interface MessagesLayoutProps {
  children: React.ReactNode;
}

export function MessagesLayout({ children }: MessagesLayoutProps) {
  return (
    <>
      <style>{`
        .msg-container {
          padding: 24px 32px;
          height: calc(100vh - 90px);
          display: flex;
          flex-direction: column;
        }
        .msg-layout {
          display: flex;
          padding: 0;
          flex: 1;
          overflow: hidden;
          border: 1px solid #EAE0DA;
          border-radius: 12px;
          background: #FFF;
          box-shadow: 0 2px 10px rgba(0,0,0,0.02);
        }
        .msg-sidebar-left {
          width: 280px;
          border-right: 1px solid #EAE0DA;
          display: flex;
          flex-direction: column;
          background: #FAFAFA;
          flex-shrink: 0;
        }
        .msg-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #FAF9F8;
          min-width: 0;
        }
        .msg-sidebar-right {
          width: 260px;
          border-left: 1px solid #EAE0DA;
          padding: 24px;
          display: flex;
          flex-direction: column;
          background: #FFF;
          flex-shrink: 0;
          overflow-y: auto;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .msg-sidebar-right {
            display: none !important;
          }
        }
        @media (max-width: 768px) {
          .msg-container {
            padding: 12px;
            height: calc(100vh - 60px);
          }
          .msg-layout {
            flex-direction: column;
            height: 100%;
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
