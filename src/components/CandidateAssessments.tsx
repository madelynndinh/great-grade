'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  UserIcon,
  BriefcaseIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentMagnifyingGlassIcon
} from '@heroicons/react/24/outline'

interface Assessment {
  file: string;
  name: string;
  score: number;
  comment: string;
  strengths?: string[];
  improvements?: string[];
  fitForRole?: string;
  error?: string;
}

interface Project {
  id: string;
  jobTitle: string;
  description: string;
}

interface FileItem {
  name: string;
  projectId: string;
}

export default function CandidateAssessments() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedAssessment, setExpandedAssessment] = useState<string | null>(null);

  // Load project details
  useEffect(() => {
    if (projectId) {
      const projects = JSON.parse(localStorage.getItem('projects') || '[]');
      const foundProject = projects.find((p: Project) => p.id === projectId);
      if (foundProject) {
        setProject(foundProject);
      }
    }
  }, [projectId]);

  // Load saved assessments from localStorage
  useEffect(() => {
    if (projectId) {
      const savedAssessments = JSON.parse(localStorage.getItem(`assessments_${projectId}`) || '[]');
      setAssessments(savedAssessments);
    }
  }, [projectId]);

  const processResumes = async () => {
    if (!project) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const allFiles = JSON.parse(localStorage.getItem('uploadedFiles') || '[]');
      const projectFiles = allFiles.filter((file: FileItem) => file.projectId === projectId);
      
      if (projectFiles.length === 0) {
        setIsLoading(false);
        setError('No resumes found for this project. Please upload resumes first.');
        return;
      }

      const filePaths = projectFiles.map((file: FileItem) => `/uploads/${file.name}`);
      
      const prompt = `Please evaluate these resumes for the position of ${project.jobTitle}. 
      Job Description: ${project.description}
      
      Evaluate based on:
      1. Relevant skills and experience
      2. Education background
      3. Project experience
      4. Overall fit for the role`;

      const response = await fetch('/api/assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          pdfPaths: filePaths
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process resumes');
      }

      const data = await response.json();
      console.log("data",data)
      if (!data.results || !Array.isArray(data.results)) {
        throw new Error('Invalid response format from assessment API');
      }

      const newAssessments = data.results
        .map((result: any) => ({
          file: result.file.split('/').pop(),
          name: result.name || 'Candidate',
          score: result.score || 0,
          comment: result.comment || 'No comment available',
          strengths: result.strengths || [],
          improvements: result.improvements || [],
          fitForRole: result.fitForRole || 'Not evaluated',
          error: result.error
        }))
        .sort((a: Assessment, b: Assessment) => b.score - a.score);

      // Save assessments to localStorage
      localStorage.setItem(`assessments_${projectId}`, JSON.stringify(newAssessments));
      setAssessments(newAssessments);
    } catch (error) {
      console.error('Error processing resumes:', error);
      setError(error instanceof Error ? error.message : 'Failed to process resumes');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDetails = (fileName: string) => {
    setExpandedAssessment(expandedAssessment === fileName ? null : fileName);
  };

  if (!projectId) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-600">Please select a project to view assessments.</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-600">Loading project details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Job Description Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-5">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <BriefcaseIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                {project.jobTitle}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {project.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Assessment Results Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-5">
          {/* Only show header with button if we have assessments */}
          {assessments.length > 0 && (
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900">
                Assessment Results
              </h2>
              <button
                onClick={processResumes}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <ArrowPathIcon className={`h-5 w-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Processing...' : 'Reassess Resumes'}
              </button>
            </div>
          )}

          {error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing Resumes...
              </div>
            </div>
          ) : assessments.length === 0 ? (
            <div className="text-center py-12">
              <DocumentMagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No assessments</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by processing your uploaded resumes.</p>
              <div className="mt-6">
                <button
                  onClick={processResumes}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <DocumentMagnifyingGlassIcon className="h-5 w-5 mr-2" />
                  Process Resumes
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {assessments.map((assessment) => (
                <div key={assessment.file} className="py-4">
                  {/* Summary View */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{assessment.name}</h3>
                        <p className="mt-1 text-sm text-gray-500">{assessment.file}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-2xl font-semibold text-gray-900">{assessment.score}</div>
                        <div className="text-sm text-gray-500">Score</div>
                      </div>
                      <button
                        onClick={() => toggleDetails(assessment.file)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        {expandedAssessment === assessment.file ? (
                          <ChevronUpIcon className="h-5 w-5" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedAssessment === assessment.file && (
                    <div className="mt-4 pl-14">
                      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700">Summary</h4>
                          <p className="mt-1 text-sm text-gray-600">{assessment.comment}</p>
                        </div>
                        
                        {assessment.strengths && assessment.strengths.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700">Key Strengths</h4>
                            <ul className="mt-1 text-sm text-gray-600 list-disc list-inside">
                              {assessment.strengths.map((strength, idx) => (
                                <li key={idx}>{strength}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {assessment.improvements && assessment.improvements.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700">Areas for Improvement</h4>
                            <ul className="mt-1 text-sm text-gray-600 list-disc list-inside">
                              {assessment.improvements.map((improvement, idx) => (
                                <li key={idx}>{improvement}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {assessment.fitForRole && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700">Fit for Role</h4>
                            <p className="mt-1 text-sm text-gray-600">{assessment.fitForRole}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}