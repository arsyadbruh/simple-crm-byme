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
import { Plus, History, Phone, Users as UsersIcon, Mail, MessageCircle, Calendar } from 'lucide-react';

export default function ActivitiesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [activities, setActivities] = useState<ActivitiesExpanded[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<ActivityType | 'All'>('All');

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

  const loadActivities = async () => {
    try {
      setLoading(true);
      
      const filter = filterType !== 'All' ? `activity_type = '${filterType}'` : '';
      
      const records = await pb.collection(Collections.Activities).getFullList<ActivitiesExpanded>({
        filter,
        expand: 'user_id,institution_id,contact_id,forecast_id',
        sort: '-activity_date',
      });
      setActivities(records);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
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

  const activityTypes: (ActivityType | 'All')[] = ['All', 'Call', 'Visit', 'Meeting', 'Email', 'WhatsApp', 'Other'];

  const getActivityIcon = (type: ActivityType) => {
    const icons = {
      'Call': Phone,
      'Visit': UsersIcon,
      'Meeting': Calendar,
      'Email': Mail,
      'WhatsApp': MessageCircle,
      'Other': History,
    };
    return icons[type] || History;
  };

  const getActivityColor = (type: ActivityType) => {
    const colors = {
      'Call': 'bg-blue-100 text-blue-800',
      'Visit': 'bg-green-100 text-green-800',
      'Meeting': 'bg-purple-100 text-purple-800',
      'Email': 'bg-yellow-100 text-yellow-800',
      'WhatsApp': 'bg-emerald-100 text-emerald-800',
      'Other': 'bg-gray-100 text-gray-800',
    };
    return colors[type] || colors.Other;
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
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Log Activity
          </Button>
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
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Log Activity
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = getActivityIcon(activity.activity_type);
              return (
                <Card key={activity.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-full ${getActivityColor(activity.activity_type)}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">{activity.subject}</h3>
                            <Badge className={getActivityColor(activity.activity_type)}>
                              {activity.activity_type}
                            </Badge>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(activity.activity_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        
                        {activity.description && (
                          <p className="text-gray-700 mb-3">{activity.description}</p>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          {activity.expand?.institution_id && (
                            <div>
                              <span className="text-gray-500">Institution:</span>
                              <p className="font-medium">{activity.expand.institution_id.name}</p>
                            </div>
                          )}
                          {activity.expand?.contact_id && (
                            <div>
                              <span className="text-gray-500">Contact:</span>
                              <p className="font-medium">{activity.expand.contact_id.name}</p>
                            </div>
                          )}
                          {activity.expand?.user_id && (
                            <div>
                              <span className="text-gray-500">Logged by:</span>
                              <p className="font-medium">{activity.expand.user_id.name || activity.expand.user_id.email}</p>
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
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
