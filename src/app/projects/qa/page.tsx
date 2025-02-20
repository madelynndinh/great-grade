'use client'

import { Suspense } from 'react'
import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  PaperAirplaneIcon,
  UserIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Project {
  id: string
  jobTitle: string
  description: string
}

function QAContent() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('projectId')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [project, setProject] = useState<Project | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (projectId) {
      const projects = JSON.parse(localStorage.getItem('projects') || '[]')
      const foundProject = projects.find((p: Project) => p.id === projectId)
      if (foundProject) {
        setProject(foundProject)
        setMessages([
          {
            role: 'assistant',
            content: `Hello! I'm your AI assistant for the ${foundProject.jobTitle} position. You can ask me any questions about the candidates' resumes, their qualifications, or specific details you'd like to know more about.`
          }
        ])
      }
    }
  }, [projectId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !project) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const allFiles = JSON.parse(localStorage.getItem('uploadedFiles') || '[]')
      const projectFiles = allFiles.filter((file: any) => file.projectId === projectId)
      const filePaths = projectFiles.map((file: any) => `/uploads/${file.name}`)

      const response = await fetch('/api/assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Based on the candidate resumes for the ${project.jobTitle} position, please answer the following question: ${userMessage}`,
          pdfPaths: filePaths,
          isQA: true
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer || 'I apologize, but I was unable to process your question.' }])
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I apologize, but I encountered an error while processing your question. Please try again.' 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  if (!projectId) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-600">Please select a project to start the Q&A session.</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-600">Loading project details...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              Interactive Q&A - {project.jobTitle}
            </h2>
          </div>

          <div className="border rounded-lg bg-gray-50">
            <div className="h-[500px] overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start space-x-3 ${
                    message.role === 'assistant' ? 'justify-start' : 'justify-end'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <ChatBubbleLeftIcon className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                  )}
                  <div
                    className={`rounded-lg px-4 py-2 max-w-[80%] ${
                      message.role === 'assistant'
                        ? 'bg-white border border-gray-200'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.role === 'user' && (
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center space-x-2 text-gray-500">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t p-4">
              <form onSubmit={handleSubmit} className="flex space-x-4">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question about the candidates..."
                  className="flex-1 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function InteractiveQA() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QAContent />
    
    </Suspense>
  )
}