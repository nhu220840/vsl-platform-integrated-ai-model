"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  BookOpen,
  LogOut,
  Terminal,
  Circle,
  Shield,
} from "lucide-react";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { useAuthStore } from "@/stores/auth-store";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  // nhớ bỏ cmt sau khi test xong
  // const { isLoggedIn, userRole, username } = useAuthStatus();

  // 2. THÊM ĐOẠN FAKE STATUS NÀY VÀO: (nhớ xóa)
  const isLoggedIn = true;     // Giả vờ đã đăng nhập
  const userRole = "ADMIN";    // Giả vờ là Admin
  const username = "DevMode";  // Tên hiển thị giả

  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    // Redirect to login if not authenticated
    
    // nhớ bỏ cmt sau khi test xong
    // if (!isLoggedIn) {
    //   router.replace("/login");
    //   return;
    // }

    // // Redirect to home if not admin
    // if (userRole !== "ADMIN") {
    //   router.replace("/");
    //   return;
    // }
  }, [isLoggedIn, userRole, router]);

  const menuItems = [
    { href: "/admin", label: "[DASHBOARD]", icon: LayoutDashboard },
    { href: "/admin/users", label: "[USER_MANAGER]", icon: Users },
    { href: "/admin/contributions", label: "[CONTRIBUTIONS]", icon: FileText },
    { href: "/admin/dictionary", label: "[DICTIONARY_DB]", icon: BookOpen },
  ];

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname?.startsWith(href);
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Show loading screen while checking authentication
  if (!isLoggedIn || userRole !== "ADMIN") {
    return (
      <div className="min-h-screen bg-[var(--bg-color)] text-[var(--primary-color)] flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 animate-pulse" />
          <p className="text-sm tracking-wider">VERIFYING ADMIN ACCESS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--primary-color)] overflow-hidden">
      {/* Top Status Bar */}
      <div className="fixed top-0 left-0 right-0 h-10 bg-[#0a0a0a] border-b border-[var(--primary-color)] flex items-center px-5 text-xs z-[1000] border-glow">
        <span className="text-[11px] tracking-wider flex items-center gap-2">
          <Terminal className="w-3 h-3" />
          SYSTEM: ADMIN_ACCESS_GRANTED | USER:{" "}
          {username?.toUpperCase() || "ADMIN"}
        </span>
        <div className="ml-auto flex items-center gap-4">
          <Circle className="w-2 h-2 fill-[var(--primary-color)] text-[var(--primary-color)] animate-pulse" />
          <span className="text-[11px]">ONLINE</span>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="fixed left-0 top-10 w-[250px] h-[calc(100vh-2.5rem)] bg-[var(--bg-color)] border-r border-[var(--primary-color)] p-5 overflow-y-auto z-[999]">
        <div className="text-sm font-bold tracking-widest mb-8 text-[var(--primary-color)] text-glow border-b border-[var(--primary-color)] pb-2.5">
          <span className="flex items-center gap-2">
            <Terminal className="w-4 h-4" />
            VSL_ADMIN
          </span>
          <span className="block mt-1">CORE</span>
        </div>

        <ul className="list-none space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    block px-4 py-3 mb-2 border transition-all duration-300 text-xs tracking-wide relative
                    ${
                      active
                        ? "border-[var(--primary-color)] bg-[rgba(0,255,65,0.15)] text-glow border-glow"
                        : "border-transparent hover:border-[var(--primary-color)] hover:bg-[rgba(0,255,65,0.1)] hover:border-glow"
                    }
                  `}
                >
                  <span className="flex items-center">
                    <Icon className="w-5 h-5 mr-2.5 min-w-[20px]" />
                    <span>{item.label}</span>
                  </span>
                </Link>
              </li>
            );
          })}
          <li>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 mb-2 border border-transparent transition-all duration-300 text-xs tracking-wide text-left hover:border-[var(--primary-color)] hover:bg-[rgba(0,255,65,0.1)] hover:border-glow"
            >
              <span className="flex items-center">
                <LogOut className="w-5 h-5 mr-2.5 min-w-[20px]" />
                <span>[LOGOUT]</span>
              </span>
            </button>
          </li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="ml-[250px] mt-10 p-8 min-h-[calc(100vh-2.5rem)] overflow-y-auto bg-gradient-to-br from-[var(--bg-color)] to-[#0a0a0a]">
        {children}
      </main>
    </div>
  );
}
