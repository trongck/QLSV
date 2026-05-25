import type { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";



export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        
        <main className="flex-1">
          {children}
        </main>
        <div>
          <footer
            style={{ textAlign: "center", padding: "20px" }}
            
          >
            © 2026 - Developed by Trong Team
          </footer>
        </div>
      </div>
    </AuthProvider>
  );
}