"use client";

import { useRef, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Calculator,
  ChartColumn,
  Clock,
  Ellipsis,
  House,
  LogOut,
  ReceiptText,
  X,
  type LucideIcon,
} from "lucide-react";
import { signOut } from "@/lib/auth-actions";

type NavItem = { href: string; label: string; icon: LucideIcon };

const primaryItems: NavItem[] = [
  { href: "/", label: "Home", icon: House },
  { href: "/pending", label: "Pending", icon: Clock },
  { href: "/history", label: "History", icon: ReceiptText },
  { href: "/reports", label: "Reports", icon: ChartColumn },
];

const secondaryItems: NavItem[] = [
  { href: "/fees", label: "Fee rules", icon: Calculator },
  { href: "/overview", label: "Overview", icon: BookOpen },
];

const allItems = [...primaryItems, ...secondaryItems];

function isActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/" || pathname.startsWith("/cash-");
  return pathname === href || pathname.startsWith(`${href}/`);
}

/* Desktop: a dark sidebar. A single marker slides to the current page. */

const ROW = 3.25; // rem: row height
const GAP = 0.25; // rem: space between rows

export function Sidebar({ account }: { account: ReactNode }) {
  const pathname = usePathname();
  const activeIndex = allItems.findIndex((item) => isActive(item.href, pathname));

  return (
    <aside className="sticky top-0 hidden h-svh flex-col bg-night px-4 py-6 text-night-ink lg:flex">
      <Link
        href="/"
        className="px-3 pb-10 font-display text-[3.5rem] font-light leading-none tracking-[-0.04em]"
      >
        CICO
      </Link>

      <nav aria-label="Main">
        <ul className="relative flex flex-col" style={{ gap: `${GAP}rem` }}>
          {activeIndex >= 0 && (
            <li
              aria-hidden
              className="absolute inset-x-0 top-0 rounded-ui bg-bg transition-transform duration-200 ease-(--ease-out)"
              style={{
                height: `${ROW}rem`,
                transform: `translateY(${activeIndex * (ROW + GAP)}rem)`,
              }}
            />
          )}
          {allItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href, pathname);
            return (
              <li key={href} className="relative">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`pressable flex items-center gap-3 rounded-ui px-3 font-medium ${
                    active ? "text-ink" : "hover:bg-white/10"
                  }`}
                  style={{ height: `${ROW}rem` }}
                >
                  <Icon aria-hidden className="size-6 shrink-0" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto space-y-3 px-3">
        <div className="text-small text-night-ink/75">{account}</div>
        <form action={signOut}>
          <button
            type="submit"
            className="pressable -mx-3 flex h-12 w-[calc(100%+1.5rem)] items-center gap-3 rounded-ui px-3 font-medium hover:bg-white/10"
          >
            <LogOut aria-hidden className="size-6" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}

/** Same footprint as the sidebar, shown for a moment while the URL is read. */
export function SidebarPlaceholder() {
  return (
    <aside className="sticky top-0 hidden h-svh bg-night px-4 py-6 text-night-ink lg:block">
      <span className="block px-3 font-display text-[3.5rem] font-light leading-none tracking-[-0.04em]">
        CICO
      </span>
    </aside>
  );
}

/** Same footprint as the bottom bar, shown for a moment while the URL is read. */
export function BottomNavPlaceholder() {
  return (
    <div
      aria-hidden
      className="fixed inset-x-0 bottom-0 z-40 h-20 bg-night pb-[env(safe-area-inset-bottom)] lg:hidden"
    />
  );
}

/* Phone and tablet: a bottom bar for the main screens, "More" for the rest. */

export function BottomNav({ account }: { account: ReactNode }) {
  const pathname = usePathname();
  const sheetRef = useRef<HTMLDialogElement>(null);

  const primaryIndex = primaryItems.findIndex((item) =>
    isActive(item.href, pathname),
  );
  const moreActive = secondaryItems.some((item) => isActive(item.href, pathname));
  const activeIndex = moreActive ? primaryItems.length : primaryIndex;

  const closeSheet = () => sheetRef.current?.close();

  return (
    <>
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 bg-night pb-[env(safe-area-inset-bottom)] text-night-ink lg:hidden"
      >
        <ul className="relative grid grid-cols-5 px-1 py-2">
          {activeIndex >= 0 && (
            <li
              aria-hidden
              className="absolute inset-y-2 left-1 w-[calc((100%-0.5rem)/5)] px-1 transition-transform duration-200 ease-(--ease-out)"
              style={{ transform: `translateX(${activeIndex * 100}%)` }}
            >
              <span className="block h-full rounded-ui bg-bg" />
            </li>
          )}
          {primaryItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href, pathname);
            return (
              <li key={href} className="relative">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`pressable flex h-16 flex-col items-center justify-center gap-1 text-small font-medium ${
                    active ? "text-ink" : ""
                  }`}
                >
                  <Icon aria-hidden className="size-6" />
                  {label}
                </Link>
              </li>
            );
          })}
          <li className="relative">
            <button
              type="button"
              onClick={() => sheetRef.current?.showModal()}
              aria-haspopup="dialog"
              className={`pressable flex h-16 w-full flex-col items-center justify-center gap-1 text-small font-medium ${
                moreActive ? "text-ink" : ""
              }`}
            >
              <Ellipsis aria-hidden className="size-6" />
              More
            </button>
          </li>
        </ul>
      </nav>

      <dialog
        ref={sheetRef}
        aria-labelledby="more-title"
        className="sheet lg:hidden"
        onClick={(event) => {
          if (event.target === event.currentTarget) closeSheet();
        }}
      >
        <div className="px-4 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between">
            <h2 id="more-title" className="text-lead font-medium">
              More
            </h2>
            <button
              type="button"
              onClick={closeSheet}
              aria-label="Close"
              className="pressable flex size-12 items-center justify-center rounded-full bg-surface"
            >
              <X aria-hidden className="size-6" />
            </button>
          </div>

          <ul className="mt-4 space-y-2">
            {secondaryItems.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={closeSheet}
                  aria-current={isActive(href, pathname) ? "page" : undefined}
                  className="pressable flex h-14 items-center gap-3 rounded-ui bg-surface px-4 text-lead font-medium"
                >
                  <Icon aria-hidden className="size-6" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-8 text-small text-muted">{account}</div>
          <form action={signOut} className="mt-2">
            <button
              type="submit"
              className="pressable flex h-14 w-full items-center gap-3 rounded-ui bg-surface px-4 text-lead font-medium"
            >
              <LogOut aria-hidden className="size-6" />
              Sign out
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
}
