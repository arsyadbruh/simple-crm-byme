'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Navigation } from '@/components/navigation';
import pb, { Collections } from '@/lib/pocketbase';
import type { InstitutionsRecord } from '@/lib/pocketbase-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Building2, Search, MapPin, Eye, Pencil, Trash2 } from 'lucide-react';

export default function InstitutionsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [institutions, setInstitutions] = useState<InstitutionsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      loadInstitutions();
    }
  }, [user]);

  const loadInstitutions = async () => {
    try {
      setLoading(true);
      const records = await pb.collection(Collections.Institutions).getFullList<InstitutionsRecord>({
        sort: '-created',
      });
      setInstitutions(records);
    } catch (error) {
      console.error('Failed to load institutions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (institution: InstitutionsRecord) => {
    const confirmed = window.confirm(`Delete institution "${institution.name || 'Untitled'}"?`);
    if (!confirmed) return;

    try {
      await pb.collection(Collections.Institutions).delete(institution.id);
      loadInstitutions();
    } catch (error) {
      console.error('Failed to delete institution:', error);
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

  const getStatusColor = (status?: string) => {
    const colors: Record<string, string> = {
      'New': 'bg-blue-100 text-blue-800',
      'Existing Customer': 'bg-green-100 text-green-800',
      'Blacklist': 'bg-red-100 text-red-800',
    };
    return colors[status || ''] || 'bg-gray-100 text-gray-800';
  };

  const filteredInstitutions = institutions.filter((inst) =>
    inst.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inst.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inst.type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Institutions</h1>
            <p className="text-gray-600 mt-2">Manage your target accounts and customers</p>
          </div>
          <Button onClick={() => router.push('/institutions/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Institution
          </Button>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name, city, or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredInstitutions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'No institutions found' : 'No institutions yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery ? 'Try adjusting your search' : 'Get started by adding your first institution'}
              </p>
              {!searchQuery && (
                <Button onClick={() => router.push('/institutions/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Institution
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInstitutions.map((institution) => (
              <Card key={institution.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{institution.name || 'Untitled Institution'}</CardTitle>
                      <div className="flex items-center gap-2">
                        {institution.type && (
                          <Badge variant="outline" className="text-xs">
                            {institution.type}
                          </Badge>
                        )}
                        {institution.status && (
                          <Badge className={getStatusColor(institution.status)}>
                            {institution.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Building2 className="h-8 w-8 text-indigo-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {institution.city && (
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        {institution.city}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => router.push(`/institutions/${institution.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/institutions/${institution.id}/edit`)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(institution)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
