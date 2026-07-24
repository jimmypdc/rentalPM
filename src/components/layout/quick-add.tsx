"use client";

import Link from "next/link";
import { Plus, Building2, Users, FileText, CircleDollarSign, Receipt, Wrench, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const actions = [
  { label: "Add Property", href: "/properties/new", icon: Building2 },
  { label: "Add Tenant", href: "/tenants/new", icon: Users },
  { label: "Add Lease", href: "/leases/new", icon: FileText },
  { label: "Record Payment", href: "/payments/new", icon: CircleDollarSign },
  { label: "Add Expense", href: "/expenses/new", icon: Receipt },
  { label: "Create Maintenance Request", href: "/maintenance/new", icon: Wrench },
  { label: "Add Task", href: "/tasks/new", icon: ListTodo },
];

export function QuickAdd() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Quick Add</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Create new</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {actions.map((a) => (
          <DropdownMenuItem key={a.href} asChild>
            <Link href={a.href}>
              <a.icon className="h-4 w-4" />
              {a.label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
