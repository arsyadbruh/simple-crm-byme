'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Navigation } from '@/components/navigation';
import pb, { Collections } from '@/lib/pocketbase';
import type { InstitutionsRecord } from '@/lib/pocketbase-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, ArrowLeft, Trash2 } from 'lucide-react';

const institutionTypes: NonNullable<InstitutionsRecord['type']>[] = [
  'Yayasan',
  'CSR',
  'Pemerintah',
  'Sekolah',
  'Other',
];

const institutionStatuses: NonNullable<InstitutionsRecord['status']>[] = [
  'New',
  'Existing Customer',
  'Blacklist',
];

type InstitutionFormData = {
  name: string;
  code: string;
  national_number: string;
  type: InstitutionsRecord['type'] | '';
  status: InstitutionsRecord['status'] | '';
  city: string;
  address: string;
  website: string;
  first_buy_date: string;
};

const emptyForm: InstitutionFormData = {
  name: '',
  code: '',
  national_number: '',
  type: '',
  status: '',
  city: '',
  address: '',
  website: '',
  first_buy_date: '',
};

export default function InstitutionEditPage() {
  const { user, isLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [institution, setInstitution] = useState<InstitutionsRecord | null>(null);
  const [formData, setFormData] = useState<InstitutionFormData>(emptyForm);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && params.id) {
      loadInstitution();
    }
  }, [user, params.id]);

  const loadInstitution = async () => {
    try {
      setLoading(true);
      const record = await pb
        .collection(Collections.Institutions)
        .getOne<InstitutionsRecord>(params.id as string);
      setInstitution(record);
      setFormData({
        name: record.name || '',
        code: record.code || '',
        national_number: record.national_number || '',
        type: record.type || '',
        status: record.status || '',
        city: record.city || '',
        address: record.address || '',
        website: record.website || '',
        first_buy_date: record.first_buy_date || '',
      });
    } catch (error) {
      console.error('Failed to load institution:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!institution) return;

    setSaving(true);
    const payload: Partial<InstitutionsRecord> = {
      name: formData.name.trim(),
      code: formData.code.trim() || undefined,
      national_number: formData.national_number.trim() || undefined,
      type: formData.type || undefined,
      status: formData.status || undefined,
      city: formData.city.trim() || undefined,
      address: formData.address.trim() || undefined,
      website: formData.website.trim() || undefined,
      first_buy_date: formData.first_buy_date || undefined,
    };

    try {
      await pb.collection(Collections.Institutions).update(institution.id, payload);
      router.push(`/institutions/${institution.id}`);
    } catch (error) {
      console.error('Failed to update institution:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!institution) return;
    const confirmed = window.confirm(`Delete institution "${institution.name || 'Untitled'}"?`);
    if (!confirmed) return;

    try {
      await pb.collection(Collections.Institutions).delete(institution.id);
      router.push('/institutions');
    } catch (error) {
      console.error('Failed to delete institution:', error);
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
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-indigo-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Institution</h1>
              <p className="text-gray-600 mt-1">Update institution details</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push(`/institutions/${institution.id}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Institution Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="institution-name">Institution Name</Label>
                  <Input
                    id="institution-name"
                    value={formData.name}
                    onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                    placeholder="Institution name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="institution-code">Institution Code</Label>
                  <Input
                    id="institution-code"
                    value={formData.code}
                    onChange={(event) => setFormData({ ...formData, code: event.target.value })}
                    placeholder="INST-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="institution-national">National Number</Label>
                  <Input
                    id="institution-national"
                    value={formData.national_number}
                    onChange={(event) => setFormData({ ...formData, national_number: event.target.value })}
                    placeholder="NPWP / NPSN / NIB"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as InstitutionsRecord['type'] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {institutionTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as InstitutionsRecord['status'] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {institutionStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="institution-city">City</Label>
                  <Input
                    id="institution-city"
                    value={formData.city}
                    onChange={(event) => setFormData({ ...formData, city: event.target.value })}
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="institution-website">Website</Label>
                  <Input
                    id="institution-website"
                    value={formData.website}
                    onChange={(event) => setFormData({ ...formData, website: event.target.value })}
                    placeholder="https://example.org"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="institution-first-buy">First Buy Date</Label>
                  <Input
                    id="institution-first-buy"
                    type="date"
                    value={formData.first_buy_date}
                    onChange={(event) => setFormData({ ...formData, first_buy_date: event.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="institution-address">Address</Label>
                <textarea
                  id="institution-address"
                  value={formData.address}
                  onChange={(event) => setFormData({ ...formData, address: event.target.value })}
                  placeholder="Full address"
                  className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/institutions/${institution.id}`)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
