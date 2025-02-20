'use client'

import { Suspense } from 'react'
import ResumeUpload from '@/components/ResumeUpload'

export default function Upload() {
  return (
    <div className="space-y-8">
      <div className="flex items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Resume Upload</h1>
      </div>
      
      <Suspense fallback={<div>Loading...</div>}>
        <ResumeUpload />
      
      </Suspense>
    </div>
  )
}