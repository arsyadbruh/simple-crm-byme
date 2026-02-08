'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Navigation } from '@/components/navigation';
import pb, { Collections } from '@/lib/pocketbase';
import type {
  InstitutionsRecord,
  ContactsExpanded,
  ForecastsExpanded,
  ActivitiesExpanded,
} from '@/lib/pocketbase-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Edit,
  Plus,
  Users,
  Target,
  History,
} from 'lucide-react';
import Link from 'next/link';

export default function InstitutionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [institution, setInstitution] = useState<InstitutionsRecord | null>(null);
  const [contacts, setContacts] = useState<ContactsExpanded[]>([]);
  const [forecasts, setForecasts] = useState<ForecastsExpanded[]>([]);
  const [activities, setActivities] = useState<ActivitiesExpanded[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && params.id) {
      loadInstitutionData();
    }
  }, [user, params.id]);

  const loadInstitutionData = async () => {
    try {
      setLoading(true);
      const institutionId = params.id as string;

      // Load institution
      const inst = await pb.collection(Collections.Institutions).getOne<InstitutionsRecord>(institutionId);
      setInstitution(inst);

      // Load contacts
      const contactsData = await pb.collection(Collections.Contacts).getFullList<ContactsExpanded>({
        filter: `institution_id = '${institutionId}'`,
        sort: '-is_primary,-created',
      });
      setContacts(contactsData);

      // Load forecasts
      const forecastsData = await pb
        .collection(Collections.Forecasts)
        .getFullList<ForecastsExpanded>({
          filter: `institution_id = '${institutionId}'`,
          expand: 'program_id,product_id',
          sort: '-created',
        });
      setForecasts(forecastsData);

      // Load activities
      const activitiesData = await pb
        .collection(Collections.Activities)
        .getFullList<ActivitiesExpanded>({
          filter: `institution_id = '${institutionId}'`,
          expand: 'user_id,contact_id',
          sort: '-activity_date',
          $limit: 10,
        });
      setActivities(activitiesData);
    } catch (error) {
      console.error('Failed to load institution data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!institution) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Institution not found</h3>
              <Button onClick={() => router.push('/institutions')}>Back to Institutions</Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const getStatusColor = (status?: string) => {
    const colors: Record<string, string> = {
      'New': 'bg-blue-100 text-blue-800',
      'Existing Customer': 'bg-green-100 text-green-800',
      'Blacklist': 'bg-red-100 text-red-800',
    };
    return colors[status || ''] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const totalPipeline = forecasts.reduce((sum, f) => {
    if (f.status === 'Closed Won') {
      return sum + (f.fix_omset || f.target_amount);
    } else if (f.status !== 'Closed Lost') {
      return sum + f.target_amount;
    }
    return sum;
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Building2 className="h-10 w-10 text-indigo-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{institution.name}</h1>
                <div className="flex items-center gap-2 mt-2">
                  {institution.type && (
                    <Badge variant="outline">{institution.type}</Badge>
                  )}
                  {institution.status && (
                    <Badge className={getStatusColor(institution.status)}>
                      {institution.status}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button onClick={() => router.push(`/institutions/${institution.id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {institution.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                    <div>
                      <p className="text-sm">{institution.address}</p>
                      {(institution.city || institution.province) && (
                        <p className="text-sm text-gray-600">
                          {institution.city}
                          {institution.province && `, ${institution.province}`}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {institution.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{institution.phone}</span>
                  </div>
                )}
                {institution.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <a href={`mailto:${institution.email}`} className="text-sm text-blue-600 hover:underline">
                      {institution.email}
                    </a>
                  </div>
                )}
                {institution.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-500" />
                    <a
                      href={institution.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {institution.website}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            {institution.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{institution.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Pipeline</span>
                  <span className="font-semibold">{formatCurrency(totalPipeline)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Forecasts</span>
                  <span className="font-semibold">{forecasts.filter(f => f.status !== 'Closed Lost').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Contacts</span>
                  <span className="font-semibold">{contacts.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Tabs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contacts */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Contacts ({contacts.length})
                </CardTitle>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </CardHeader>
              <CardContent>
                {contacts.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No contacts yet</p>
                ) : (
                  <div className="space-y-3">
                    {contacts.map((contact) => (
                      <div key={contact.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{contact.name}</h4>
                              {contact.is_primary && (
                                <Badge variant="outline" className="text-xs">Primary</Badge>
                              )}
                            </div>
                            {contact.job_title && (
                              <p className="text-sm text-gray-600">{contact.job_title}</p>
                            )}
                            <div className="mt-2 space-y-1">
                              {contact.phone && (
                                <p className="text-sm text-gray-600">📞 {contact.phone}</p>
                              )}
                              {contact.email && (
                                <p className="text-sm text-gray-600">✉️ {contact.email}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Forecasts */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Forecasts ({forecasts.length})
                </CardTitle>
                <Link href="/forecasts">
                  <Button size="sm" variant="outline">View All</Button>
                </Link>
              </CardHeader>
              <CardContent>
                {forecasts.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No forecasts yet</p>
                ) : (
                  <div className="space-y-3">
                    {forecasts.slice(0, 5).map((forecast) => (
                      <div key={forecast.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{forecast.project_title}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {forecast.expand?.program_id?.name}
                            </p>
                            <p className="text-sm font-medium text-blue-600 mt-2">
                              {formatCurrency(forecast.target_amount)}
                            </p>
                          </div>
                          <Badge className={`${
                            forecast.status === 'Closed Won' ? 'bg-green-100 text-green-800' :
                            forecast.status === 'Closed Lost' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {forecast.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Recent Activities
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activities.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No activities yet</p>
                ) : (
                  <div className="space-y-4">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex gap-3">
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-indigo-600 mt-2"></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">{activity.subject}</h4>
                            <span className="text-xs text-gray-500">
                              {new Date(activity.activity_date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{activity.activity_type}</p>
                          {activity.expand?.contact_id && (
                            <p className="text-xs text-gray-500 mt-1">
                              with {activity.expand.contact_id.name}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
