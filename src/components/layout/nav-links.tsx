"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  LayoutDashboard,
  MessageCircle,
  Newspaper,
  ShieldCheck,
  GraduationCap,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
};

const common: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/feed", label: "Community", icon: Newspaper },
  { href: "/people", label: "People", icon: Users },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

const roleItems: Record<Role, NavItem[]> = {
  STUDENT: [
    { href: "/training", label: "Training", icon: GraduationCap },
    { href: "/companies", label: "Companies", icon: Building2 },
    { href: "/opportunities", label: "Opportunities", icon: BriefcaseBusiness },
  ],
  TRAINER: [
    { href: "/training", label: "Training", icon: GraduationCap },
    { href: "/trainer", label: "Trainer desk", icon: GraduationCap },
  ],
  COMPANY: [
    { href: "/companies", label: "Companies", icon: Building2 },
    { href: "/opportunities", label: "Opportunities", icon: BriefcaseBusiness },
  ],
  ADMIN: [
    { href: "/training", label: "Training", icon: GraduationCap },
    { href: "/admin", label: "Admin", icon: ShieldCheck },
  ],
};

export function NavLinks({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = [...common, ...roleItems[role]];

  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
              active
                ? "bg-primary text-white"
                : "text-muted hover:bg-slate-100 hover:text-foreground",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
