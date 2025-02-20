import { 
  ChartBarIcon,
  UsersIcon,
  DocumentCheckIcon,
  ClockIcon 
} from '@heroicons/react/24/outline'

export default function Dashboard() {
  const stats = [
    {
      name: 'Total Projects',
      value: '12',
      icon: ChartBarIcon,
      change: '+2.5%',
      changeType: 'positive'
    },
    {
      name: 'Active Candidates',
      value: '48',
      icon: UsersIcon,
      change: '+12%',
      changeType: 'positive'
    },
    {
      name: 'Processed Resumes',
      value: '156',
      icon: DocumentCheckIcon,
      change: '+8.2%',
      changeType: 'positive'
    },
    {
      name: 'Average Processing Time',
      value: '2.4m',
      icon: ClockIcon,
      change: '-10%',
      changeType: 'positive'
    }
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white px-6 py-5 rounded-lg border border-gray-200 shadow-sm"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <stat.icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  <p className={`ml-2 text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <DocumentCheckIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">New resume processed</p>
                    <p className="text-sm text-gray-500">2 minutes ago</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Project Status</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <ChartBarIcon className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Software Engineer</p>
                    <p className="text-sm text-gray-500">8 candidates</p>
                  </div>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}