'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar({ items }) {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex flex-col w-56 min-h-screen bg-base-100 border-r border-base-200 pt-4">
      <ul className="menu menu-md px-2 flex-1">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={pathname === item.href ? 'active' : ''}
            >
              {item.icon && <item.icon size={18} />}
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
