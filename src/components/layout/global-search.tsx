"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { allNavItems } from "@/lib/nav";

export interface SearchEntry {
  label: string;
  sublabel: string;
  href: string;
  group: string;
  keywords?: string;
}

export function GlobalSearch({ index }: { index: SearchEntry[] }) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const groups = React.useMemo(() => {
    const map = new Map<string, SearchEntry[]>();
    for (const e of index) {
      if (!map.has(e.group)) map.set(e.group, []);
      map.get(e.group)!.push(e);
    }
    return Array.from(map.entries());
  }, [index]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-full items-center gap-2 rounded-lg border border-input bg-muted/60 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted md:w-72"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="hidden rounded border bg-card px-1.5 text-[10px] font-medium text-muted-foreground md:inline">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search properties, tenants, owners, vendors, pages…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {groups.map(([group, entries]) => (
            <CommandGroup key={group} heading={group}>
              {entries.map((e) => (
                <CommandItem
                  key={e.href + e.label}
                  value={`${e.label} ${e.sublabel} ${e.keywords ?? ""}`}
                  onSelect={() => go(e.href)}
                >
                  <div className="flex flex-col">
                    <span className="text-sm">{e.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {e.sublabel}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
          <CommandGroup heading="Navigation">
            {allNavItems.map((item) => (
              <CommandItem
                key={item.href}
                value={`go to ${item.label}`}
                onSelect={() => go(item.href)}
              >
                <item.icon className="h-4 w-4 text-muted-foreground" />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
