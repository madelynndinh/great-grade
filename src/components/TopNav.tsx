'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import clsx from 'clsx'

function TopNavContent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('projectId')

  const navigation = [
    { name: 'Overview', href: '/projects' },
    { name: 'Resume Upload', href: '/projects/upload' },
    { name: 'Assessments', href: '/projects/assessments' },
    { name: 'Interactive Q&A', href: '/projects/qa' },
  ]

  return (
    <div className="border-b border-gray-200 bg-white">
      <nav className="flex px-8 space-x-8">
        {navigation.map((item) => {
          const href = projectId ? `${item.href}?projectId=${projectId}` : item.href
          return (
            <Link
              key={item.name}
              href={href}
              className={clsx(
                'top-nav-item',
                pathname === item.href && 'active'
              )}
            >
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export default function TopNav() {
  return (
    <Suspense fallback={<div>Loading navigation...</div>}>
      <TopNavContent />
  
    </Suspense>
  )
}