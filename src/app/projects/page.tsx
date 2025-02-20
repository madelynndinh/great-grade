'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'

interface Project {
  id: string;
  projectName: string;
  jobTitle: string;
  status: string;
  candidates: number;
  lastUpdated: string;
}

export default function Projects() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    // Load projects from localStorage
    const savedProjects = JSON.parse(localStorage.getItem('projects') || '[]');
    setProjects(savedProjects);
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
        <Link
          href="/projects/create"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Create New Project
        </Link>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Active Projects</h3>
          <div className="mt-4 divide-y divide-gray-200">
            {projects.length === 0 ? (
              <p className="py-4 text-gray-500">No projects yet. Create your first project!</p>
            ) : (
              projects.map((project) => (
                <div 
                  key={project.id} 
                  className="py-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => router.push(`/projects/${project.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{project.jobTitle}</h4>
                      <p className="text-sm text-gray-500">
                        {project.candidates} candidates • Last updated {formatDistanceToNow(new Date(project.lastUpdated))} ago
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        project.status === 'Active' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}