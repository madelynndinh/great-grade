'use client'

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface Project {
  id: string;
  projectName: string;
  jobTitle: string;
  description: string;
  status: string;
  candidates: number;
  lastUpdated: string;
  criteria: {
    quality: number;
    efficiency: number;
    innovation: number;
  };
}

export default function ProjectDetails() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const foundProject = projects.find((p: Project) => p.id === params.id);
    if (foundProject) {
      setProject(foundProject);
    }
  }, [params.id]);

  if (!project) {
    return <div>Project not found</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Projects
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-5">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{project.projectName}</h1>
              <p className="mt-1 text-sm text-gray-500">
                Last updated {formatDistanceToNow(new Date(project.lastUpdated))} ago
              </p>
            </div>
            <span className={`px-3 py-1 text-sm rounded-full ${
              project.status === 'Active' 
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {project.status}
            </span>
          </div>

          <div className="mt-6 border-t border-gray-200 pt-6">
            <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Job Title</dt>
                <dd className="mt-1 text-lg text-gray-900">{project.jobTitle}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Candidates</dt>
                <dd className="mt-1 text-lg text-gray-900">{project.candidates}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-gray-900">{project.description}</dd>
              </div>
            </dl>
          </div>

          <div className="mt-6 border-t border-gray-200 pt-6">
            <h2 className="text-lg font-medium text-gray-900">Evaluation Criteria</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="bg-gray-50 p-4 rounded-lg">
                <dt className="text-sm font-medium text-gray-500">Quality</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  {project.criteria.quality}%
                </dd>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <dt className="text-sm font-medium text-gray-500">Efficiency</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  {project.criteria.efficiency}%
                </dd>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <dt className="text-sm font-medium text-gray-500">Innovation</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  {project.criteria.innovation}%
                </dd>
              </div>
            </div>
          </div>

          <div className="mt-8 flex space-x-4">
            <button
              onClick={() => router.push(`/projects/upload?projectId=${project.id}`)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Upload Resumes
            </button>
            <button
              onClick={() => router.push(`/projects/assessments?projectId=${project.id}`)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View Assessments
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}