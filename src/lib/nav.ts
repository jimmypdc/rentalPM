import {
  LayoutDashboard,
  Building2,
  DoorOpen,
  Users,
  FileText,
  CircleDollarSign,
  Wrench,
  HardHat,
  UserSquare,
  Receipt,
  Calculator,
  FolderOpenDot,
  ClipboardCheck,
  ListTodo,
  BarChart3,
  Calendar,
  Settings,
  ScrollText,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavSection {
  heading?: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    heading: "Portfolio",
    items: [
      { label: "Properties", href: "/properties", icon: Building2 },
      { label: "Units", href: "/units", icon: DoorOpen },
      { label: "Owners", href: "/owners", icon: UserSquare },
    ],
  },
  {
    heading: "Leasing",
    items: [
      { label: "Tenants", href: "/tenants", icon: Users },
      { label: "Leases", href: "/leases", icon: FileText },
      { label: "Rent & Payments", href: "/payments", icon: CircleDollarSign },
      { label: "Rent Roll", href: "/rent-roll", icon: ScrollText },
    ],
  },
  {
    heading: "Operations",
    items: [
      { label: "Maintenance", href: "/maintenance", icon: Wrench },
      { label: "Vendors", href: "/vendors", icon: HardHat },
      { label: "Inspections", href: "/inspections", icon: ClipboardCheck },
      { label: "Tasks", href: "/tasks", icon: ListTodo },
    ],
  },
  {
    heading: "Financials",
    items: [
      { label: "Expenses", href: "/expenses", icon: Receipt },
      { label: "Accounting", href: "/accounting", icon: Calculator },
      { label: "Reports", href: "/reports", icon: BarChart3 },
    ],
  },
  {
    heading: "System",
    items: [
      { label: "Documents", href: "/documents", icon: FolderOpenDot },
      { label: "Calendar", href: "/calendar", icon: Calendar },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export const allNavItems: NavItem[] = navSections.flatMap((s) => s.items);
