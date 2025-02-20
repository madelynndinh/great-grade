'use client'

import { useCallback, useState, useRef, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { 
  PlusIcon, 
  EyeIcon, 
  ArrowDownTrayIcon, 
  TrashIcon,
  DocumentMagnifyingGlassIcon 
} from '@heroicons/react/24/outline'

interface FileItem {
  name: string
  uploadDate: string
  status: 'Done' | 'Pending' | 'Failed'
  projectId: string
}

export default function ResumeUpload() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get('projectId');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load files from localStorage and filter by project
    const savedFiles = JSON.parse(localStorage.getItem('uploadedFiles') || '[]') as FileItem[];
    const projectFiles = projectId 
      ? savedFiles.filter((file: FileItem) => file.projectId === projectId)
      : savedFiles;
    setFiles(projectFiles);
  }, [projectId]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!projectId) {
      alert('Please select a project first');
      return;
    }

    // Check if file is PDF
    if (file.type !== 'application/pdf') {
      alert('Please upload only PDF files');
      return;
    }

    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);

    try {
      // Add file to list with pending status
      const newFile: FileItem = {
        name: file.name,
        uploadDate: new Date().toISOString().split('T')[0],
        status: 'Pending',
        projectId
      };

      // Get all files and add the new one
      const allFiles = JSON.parse(localStorage.getItem('uploadedFiles') || '[]') as FileItem[];
      const updatedFiles = [newFile, ...allFiles];
      
      // Update state with project-specific files
      const projectFiles = updatedFiles.filter((f: FileItem) => f.projectId === projectId);
      setFiles(projectFiles);
      
      // Save all files to localStorage
      localStorage.setItem('uploadedFiles', JSON.stringify(updatedFiles));

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();

      // Update file status to Done
      const finalAllFiles: FileItem[] = updatedFiles.map((f: FileItem): FileItem => 
        f.name === file.name && f.projectId === projectId 
          ? { ...f, status: 'Done' as const } 
          : f
      );
      
      const finalProjectFiles = finalAllFiles.filter((f: FileItem) => f.projectId === projectId);
      setFiles(finalProjectFiles);
      localStorage.setItem('uploadedFiles', JSON.stringify(finalAllFiles));

      // Update project's candidate count
      if (projectId) {
        const projects = JSON.parse(localStorage.getItem('projects') || '[]');
        const updatedProjects = projects.map((p: any) => {
          if (p.id === projectId) {
            return {
              ...p,
              candidates: (p.candidates || 0) + 1,
              lastUpdated: new Date().toISOString()
            };
          }
          return p;
        });
        localStorage.setItem('projects', JSON.stringify(updatedProjects));
      }

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      // Update file status to Failed
      const allFiles = JSON.parse(localStorage.getItem('uploadedFiles') || '[]') as FileItem[];
      const failedFiles: FileItem[] = allFiles.map((f: FileItem): FileItem => 
        f.name === file.name && f.projectId === projectId 
          ? { ...f, status: 'Failed' as const } 
          : f
      );
      const projectFailedFiles = failedFiles.filter((f: FileItem) => f.projectId === projectId);
      setFiles(projectFailedFiles);
      localStorage.setItem('uploadedFiles', JSON.stringify(failedFiles));
      alert(error instanceof Error ? error.message : 'Upload failed');
    }
  };

  const handleView = async (fileName: string) => {
    try {
      const response = await fetch(`/api/files/view?fileName=${fileName}`);
      if (!response.ok) {
        throw new Error('Failed to get file URL');
      }
      const { url } = await response.json();
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error viewing file:', error);
      alert('Failed to view file');
    }
  };

  const handleDownload = async (fileName: string) => {
    try {
      const response = await fetch(`/api/files/download?fileName=${fileName}`);
      if (!response.ok) {
        throw new Error('Failed to get download URL');
      }
      const { url } = await response.json();
      
      // Create temporary link and click it
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
    }
  };

  const handleDelete = async (fileName: string) => {
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      const response = await fetch(`/api/upload?fileName=${fileName}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete file');
      }

      // Remove file from localStorage
      const allFiles = JSON.parse(localStorage.getItem('uploadedFiles') || '[]') as FileItem[];
      const updatedFiles = allFiles.filter((f: FileItem) => !(f.name === fileName && f.projectId === projectId));
      const projectFiles = updatedFiles.filter((f: FileItem) => f.projectId === projectId);
      
      setFiles(projectFiles);
      localStorage.setItem('uploadedFiles', JSON.stringify(updatedFiles));

      // Update project's candidate count
      if (projectId) {
        const projects = JSON.parse(localStorage.getItem('projects') || '[]');
        const updatedProjects = projects.map((p: any) => {
          if (p.id === projectId) {
            return {
              ...p,
              candidates: Math.max((p.candidates || 0) - 1, 0),
              lastUpdated: new Date().toISOString()
            };
          }
          return p;
        });
        localStorage.setItem('projects', JSON.stringify(updatedProjects));
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete file');
    }
  };

  const handleProcessResumes = () => {
    if (files.length === 0) {
      alert('Please upload resumes first');
      return;
    }
    setIsProcessing(true);
    router.push(`/projects/assessments?projectId=${projectId}`);
  };

  if (!projectId) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-600">Please select a project first to upload resumes.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-6 py-4">
        <div className="flex justify-between items-center mb-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Upload Resume
          </button>
        </div>
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 text-sm font-medium text-gray-900">File Name</th>
              <th className="text-left py-3 text-sm font-medium text-gray-900">Upload Date</th>
              <th className="text-left py-3 text-sm font-medium text-gray-900">Actions</th>
              <th className="text-left py-3 text-sm font-medium text-gray-900">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {files.map((file, index) => (
              <tr key={index}>
                <td className="py-4 text-sm text-gray-900">{file.name}</td>
                <td className="py-4 text-sm text-gray-500">{file.uploadDate}</td>
                <td className="py-4 text-sm">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleView(file.name)}
                      className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                      title="View"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDownload(file.name)}
                      className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                      title="Download"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(file.name)}
                      className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md"
                      title="Delete"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
                <td className="py-4 text-sm">
                  <span className={`status-badge ${file.status.toLowerCase()}`}>
                    {file.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {files.length > 0 && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleProcessResumes}
              disabled={isProcessing}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              <DocumentMagnifyingGlassIcon className="h-5 w-5 mr-2" />
              {isProcessing ? 'Processing...' : 'Process Resumes'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}