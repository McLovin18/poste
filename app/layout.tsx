// src/app/layout.tsx
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { AuthProvider } from "@/lib/auth"; // <- importar

export const metadata = {
  title: "CNEL - Levantamiento de Postes",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-gray-50">
        <AuthProvider>
          <div className="">
              <main className="p-4">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
