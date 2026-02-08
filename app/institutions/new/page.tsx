'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Building2, ArrowLeft } from 'lucide-react';

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

export default function InstitutionCreatePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<InstitutionFormData>(emptyForm);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

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
      await pb.collection(Collections.Institutions).create(payload);
      router.push('/institutions');
    } catch (error) {
      console.error('Failed to create institution:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-indigo-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">New Institution</h1>
              <p className="text-gray-600 mt-1">Create a new institution record</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => router.push('/institutions')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
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
                <Button type="button" variant="outline" onClick={() => router.push('/institutions')}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Create Institution'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
