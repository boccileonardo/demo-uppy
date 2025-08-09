import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { 
  Users, 
  Upload, 
  HardDrive, 
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

export function AdminOverview() {
  // Mock data for demonstration
  const stats = {
    totalUsers: 156,
    activeUsers: 142,
    inactiveUsers: 14,
    totalUploads: 2847,
    successfulUploads: 2734,
    failedUploads: 113,
    storageUsed: '8.4 TB'
  };

  const recentActivity = [
    { id: 1, user: 'john.doe@company.com', action: 'File uploaded', time: '2 minutes ago', status: 'success' },
    { id: 2, user: 'jane.smith@company.com', action: 'Account created', time: '5 minutes ago', status: 'info' },
    { id: 3, user: 'bob.wilson@company.com', action: 'Upload failed', time: '8 minutes ago', status: 'error' },
    { id: 4, user: 'alice.brown@company.com', action: 'Password changed', time: '12 minutes ago', status: 'info' },
    { id: 5, user: 'mike.davis@company.com', action: 'File uploaded', time: '15 minutes ago', status: 'success' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards - Single Row on Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats.totalUsers}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                {stats.activeUsers} active
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                {stats.inactiveUsers} inactive
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Uploads</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats.totalUploads.toLocaleString()}</div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span>+12% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats.storageUsed}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.successfulUploads.toLocaleString()} successful uploads
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={activity.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {activity.status === 'success' && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      {activity.status === 'error' && (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                      {activity.status === 'info' && (
                        <Activity className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.user}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
                {index < recentActivity.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
