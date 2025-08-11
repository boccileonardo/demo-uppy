import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { 
  Users, 
  Upload, 
  HardDrive, 
  Activity,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { cachedApiService } from '../services/cachedApi';
import { useQuery } from '../hooks/useQuery';

export function AdminOverview() {
  // Use cached queries for admin stats and activity
  const {
    data: stats,
    loading: statsLoading,
    error: statsError
  } = useQuery(
    cachedApiService.getAdminStats,
    [],
    {
      staleTime: 2 * 60 * 1000, // 2 minutes - stats change frequently
      enabled: true
    }
  );

  const {
    data: recentActivity,
    loading: activityLoading,
    error: activityError
  } = useQuery(
    cachedApiService.getAdminActivity,
    [5], // limit to 5 activities
    {
      staleTime: 1 * 60 * 1000, // 1 minute - activity changes very frequently
      enabled: true
    }
  );

  const loading = statsLoading || activityLoading;
  const error = statsError || activityError;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                </div>
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-32"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-32"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
              <p>Error loading admin data: {error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) return null;

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return date.toLocaleDateString();
  };

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
            <div className="text-2xl">{stats.total_users}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                {stats.active_users} active
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                {stats.inactive_users} inactive
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
            <div className="text-2xl">{stats.total_uploads.toLocaleString()}</div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>{stats.successful_uploads} successful, {stats.failed_uploads} failed</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats.storage_used}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.successful_uploads.toLocaleString()} successful uploads
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
            {!recentActivity || recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No recent activity</p>
              </div>
            ) : (
              recentActivity.map((activity, index) => (
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
                    <span className="text-xs text-muted-foreground">{formatTime(activity.time)}</span>
                  </div>
                  {index < (recentActivity?.length || 0) - 1 && <Separator className="mt-4" />}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
