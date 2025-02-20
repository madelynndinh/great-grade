'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateProject() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    projectName: '',
    jobTitle: '',
    description: '',
    criteria: {
      quality: 40,
      efficiency: 30,
      innovation: 30
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real application, you would make an API call here
    // For now, we'll use localStorage to persist the data
    const existingProjects = JSON.parse(localStorage.getItem('projects') || '[]');
    const newProject = {
      id: Date.now().toString(),
      ...formData,
      status: 'Active',
      candidates: 0,
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem('projects', JSON.stringify([...existingProjects, newProject]));
    router.push('/projects');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Create New Project</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1">
            Project Name
          </label>
          <input
            type="text"
            id="projectName"
            name="projectName"
            required
            value={formData.projectName}
            onChange={handleChange}
            className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">
            Job Title
          </label>
          <input
            type="text"
            id="jobTitle"
            name="jobTitle"
            required
            value={formData.jobTitle}
            onChange={handleChange}
            className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Brief Description
          </label>
          <textarea
            id="description"
            name="description"
            required
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Criteria Overview</h3>
          <p className="text-gray-600">Default criteria include quality, efficiency, and innovation.</p>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quality</label>
              <div className="text-lg font-medium text-gray-900">{formData.criteria.quality}%</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Efficiency</label>
              <div className="text-lg font-medium text-gray-900">{formData.criteria.efficiency}%</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Innovation</label>
              <div className="text-lg font-medium text-gray-900">{formData.criteria.innovation}%</div>
            </div>
          </div>
        </div>

        <div className="pt-6">
          <button
            type="submit"
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Create Project
          </button>
        </div>
      </form>
    </div>
  );
}