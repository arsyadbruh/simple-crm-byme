'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Navigation } from '@/components/navigation';
import pb, { Collections } from '@/lib/pocketbase';
import type { ActivitiesExpanded, ActivityType } from '@/lib/pocketbase-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, History, Phone, Users as UsersIcon, MessageCircle, Calendar, Pencil, Trash2 } from 'lucide-react';
import { ActivityFormDialog } from '@/components/activity-form-dialog';

export default function ActivitiesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [activities, setActivities] = useState<ActivitiesExpanded[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<ActivityType | 'All'>('All');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivitiesExpanded | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      loadActivities();
    }
  }, [user, filterType]);

  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem(`crm:view:activities:${user.id}`);
    if (stored === 'card' || stored === 'table') {
      setViewMode(stored);
    }
  }, [user]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      
      const filter = filterType !== 'All' ? `type = '${filterType}'` : '';
      
      const records = await pb.collection(Collections.Activities).getFullList<ActivitiesExpanded>({
        filter,
        expand: 'pic,contact,target_forecast',
        sort: '-date_contacted',
      });
      setActivities(records);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (activity: ActivitiesExpanded) => {
    setEditingActivity(activity);
    setIsFormOpen(true);
  };

  const handleDelete = async (activity: ActivitiesExpanded) => {
    const confirmed = window.confirm(`Delete activity "${activity.summary || activity.outcome || 'Untitled'}"?`);
    if (!confirmed) return;

    try {
      await pb.collection(Collections.Activities).delete(activity.id);
      loadActivities();
    } catch (error) {
      console.error('Failed to delete activity:', error);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingActivity(null);
    loadActivities();
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const activityTypes: (ActivityType | 'All')[] = ['All', 'Call', 'Visit', 'Meeting', 'Demo', 'WhatsApp'];

  const getActivityIcon = (type: ActivityType) => {
    const icons = {
      'Call': Phone,
      'Visit': UsersIcon,
      'Meeting': Calendar,
      'Demo': History,
      'WhatsApp': MessageCircle,
    };
    return icons[type] || History;
  };

  const getActivityColor = (type: ActivityType) => {
    const colors = {
      'Call': 'bg-blue-100 text-blue-800',
      'Visit': 'bg-green-100 text-green-800',
      'Meeting': 'bg-purple-100 text-purple-800',
      'Demo': 'bg-yellow-100 text-yellow-800',
      'WhatsApp': 'bg-emerald-100 text-emerald-800',
      'Other': 'bg-gray-100 text-gray-800',
    };
    return colors[type] || colors.Other;
  };

  const handleViewModeChange = (mode: 'card' | 'table') => {
    setViewMode(mode);
    if (user) {
      localStorage.setItem(`crm:view:activities:${user.id}`, mode);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Activities</h1>
            <p className="text-gray-600 mt-2">Track your CRM activities and interactions</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleViewModeChange('table')}
            >
              Table
            </Button>
            <Button
              variant={viewMode === 'card' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleViewModeChange('card')}
            >
              Cards
            </Button>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Log Activity
            </Button>
          </div>
        </div>

        {/* Filter */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 flex-wrap">
              <History className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter by Type:</span>
              {activityTypes.map((type) => (
                <Button
                  key={type}
                  variant={filterType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType(type)}
                >
                  {type}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : activities.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <History className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
              <p className="text-gray-600 mb-4">Start logging your CRM activities</p>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Log Activity
              </Button>
            </CardContent>
          </Card>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Summary</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Contact</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Logged By</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Next Action</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activities.map((activity) => {
                  const activityType = activity.type || 'Call';
                  const dateLabel = activity.date_contacted
                    ? new Date(activity.date_contacted).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : '-';
                  const nextAction = activity.next_action_date
                    ? new Date(activity.next_action_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : '-';
                  return (
                    <tr key={activity.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700">{dateLabel}</td>
                      <td className="px-4 py-3">
                        <Badge className={getActivityColor(activityType)}>{activityType}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {activity.summary || activity.outcome || 'Activity'}
                        </div>
                        {activity.details && (
                          <div className="text-gray-500">{activity.details}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {activity.expand?.contact?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {activity.expand?.pic?.name || activity.expand?.pic?.email || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{nextAction}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(activity)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(activity)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const activityType = activity.type || 'Call';
              const Icon = getActivityIcon(activityType);
              return (
                <Card key={activity.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-full ${getActivityColor(activityType)}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {activity.summary || activity.outcome || 'Activity'}
                            </h3>
                            <Badge className={getActivityColor(activityType)}>
                              {activityType}
                            </Badge>
                          </div>
                          {activity.date_contacted && (
                            <span className="text-sm text-gray-500">
                              {new Date(activity.date_contacted).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          )}
                        </div>
                        {activity.details && (
                          <p className="text-gray-700 mb-3">{activity.details}</p>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          {activity.expand?.contact && (
                            <div>
                              <span className="text-gray-500">Contact:</span>
                              <p className="font-medium">{activity.expand.contact.name}</p>
                            </div>
                          )}
                          {activity.expand?.pic && (
                            <div>
                              <span className="text-gray-500">Logged by:</span>
                              <p className="font-medium">{activity.expand.pic.name || activity.expand.pic.email}</p>
                            </div>
                          )}
                        </div>
                        {activity.next_action_date && (
                          <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                            <p className="text-sm text-yellow-800">
                              <span className="font-semibold">Next Action:</span>{' '}
                              {new Date(activity.next_action_date).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        <div className="flex gap-2 pt-4">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(activity)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(activity)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <ActivityFormDialog
        open={isFormOpen}
        onClose={handleFormClose}
        activity={editingActivity}
      />
    </div>
  );
}
