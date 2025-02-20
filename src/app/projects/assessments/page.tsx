'use client'

import { Suspense } from 'react'
import CandidateAssessments from '@/components/CandidateAssessments'

export default function Assessments() {
  return (
    <div className="space-y-8">
      <div className="flex items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Candidate Assessments</h1>
      </div>
      
      <Suspense fallback={<div>Loading...</div>}>
        <CandidateAssessments />
      
      </Suspense>
    </div>
  )
}