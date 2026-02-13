"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/pulses", label: "Pulse Archive" },
  { href: "/battlecards", label: "Battlecards" },
  { href: "/intel", label: "Intel Feed" },
  { href: "/content", label: "Content Engine" },
  { href: "/admin", label: "Admin" },
] as const;

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-zinc-800/80 bg-zinc-950">
      <div className="mx-auto flex h-14 max-w-7xl items-center px-6">
        <Link
          href="/"
          className="mr-8 flex items-center gap-2.5"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-finmo-600">
            <span className="text-xs font-bold text-white leading-none">F</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-zinc-100 leading-tight">
              War Room
            </span>
            <span className="text-[10px] font-medium tracking-wider text-finmo-400 uppercase leading-tight">
              Finmo Intel
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-0.5">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-finmo-600/15 text-finmo-300"
                    : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                )}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full bg-finmo-500" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
