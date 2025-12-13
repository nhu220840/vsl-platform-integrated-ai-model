import type { Metadata } from "next";
import { Space_Mono } from "next/font/google"; // Import font từ Google
import "./globals.css";
import { Toaster } from "react-hot-toast"; // Thông báo popup

// Cấu hình font
const spaceMono = Space_Mono({ 
  subsets: ["latin", "vietnamese"],
  weight: ["400", "700"],
  variable: "--font-mono", // Biến CSS
});

export const metadata: Metadata = {
  title: "VSL Platform | Cyberpunk Edition",
  description: "Vietnamese Sign Language Translator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={spaceMono.className}>
        {children}
        {/* Nơi hiển thị thông báo (Toast) */}
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: '#000',
              color: '#00ff41',
              border: '1px solid #00ff41',
              fontFamily: 'var(--font-mono)'
            }
          }}
        />
      </body>
    </html>
  );
}// Cache bust: 1765629378
