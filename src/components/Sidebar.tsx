'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  ChartBarIcon,
  Square3Stack3DIcon,
  ChartPieIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'

const navigation = [
  { name: 'Dashboard', href: '/', icon: ChartBarIcon },
  { name: 'Projects', href: '/projects', icon: Square3Stack3DIcon },
  { name: 'Metrics', href: '/metrics', icon: ChartPieIcon },
  { name: 'Reports', href: '/reports', icon: ClipboardDocumentListIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-48 flex-col bg-white border-r border-gray-200">
      <div className="flex h-12 items-center px-3">
        <h1 className="text-base font-semibold text-gray-900">HR Platform</h1>
      </div>
      <nav className="flex-1 space-y-0.5 px-2 py-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'group flex items-center px-2 py-1.5 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon
                className={clsx(
                  'mr-2 h-4 w-4 flex-shrink-0',
                  isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-gray-200 p-3">
        <div className="flex items-center">
          <div className="h-6 w-6 rounded-full bg-gray-200" />
          <div className="ml-2">
            <p className="text-xs font-medium text-gray-700">Amanda</p>
            <p className="text-xs text-gray-500">View profile</p>
          </div>
        </div>
      </div>
    </div>
  )
}