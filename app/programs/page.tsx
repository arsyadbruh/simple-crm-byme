'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Navigation } from '@/components/navigation';
import pb, { Collections } from '@/lib/pocketbase';
import type { ProgramsRecord } from '@/lib/pocketbase-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Eye, Layers, Pencil, Plus, Search, Trash2 } from 'lucide-react';

const segmentOptions = ['CSR', 'Yayasan', 'Pemerintah', 'Sekolah', 'Other'] as const;

type ProgramFormData = {
  name: string;
  code: string;
  description: string;
  segments: ProgramsRecord['segments'];
};

const emptyForm: ProgramFormData = {
  name: '',
  code: '',
  description: '',
  segments: [],
};

export default function ProgramsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [programs, setPrograms] = useState<ProgramsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<ProgramsRecord | null>(null);
  const [formData, setFormData] = useState<ProgramFormData>(emptyForm);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      loadPrograms();
    }
  }, [user]);

  const loadPrograms = async () => {
    try {
      setLoading(true);
      const records = await pb.collection(Collections.Programs).getFullList<ProgramsRecord>({
        sort: '-created',
      });
      setPrograms(records);
    } catch (error) {
      console.error('Failed to load programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPrograms = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return programs.filter((program) => {
      const segments = program.segments?.join(' ').toLowerCase() || '';
      return (
        program.name?.toLowerCase().includes(query) ||
        program.code?.toLowerCase().includes(query) ||
        segments.includes(query)
      );
    });
  }, [programs, searchQuery]);

  const openCreateDialog = () => {
    setEditingProgram(null);
    setFormData(emptyForm);
    setIsDialogOpen(true);
  };

  const openEditDialog = (program: ProgramsRecord) => {
    setEditingProgram(program);
    setFormData({
      name: program.name || '',
      code: program.code || '',
      description: program.description || '',
      segments: program.segments || [],
    });
    setIsDialogOpen(true);
  };

  const toggleSegment = (segment: (typeof segmentOptions)[number]) => {
    setFormData((prev) => {
      const current = new Set(prev.segments || []);
      if (current.has(segment)) {
        current.delete(segment);
      } else {
        current.add(segment);
      }
      return { ...prev, segments: Array.from(current) as ProgramsRecord['segments'] };
    });
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingProgram(null);
      setFormData(emptyForm);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (editingProgram) {
        await pb.collection(Collections.Programs).update(editingProgram.id, formData);
      } else {
        await pb.collection(Collections.Programs).create(formData);
      }
      handleDialogClose(false);
      loadPrograms();
    } catch (error) {
      console.error('Failed to save program:', error);
    }
  };

  const handleDelete = async (program: ProgramsRecord) => {
    const confirmed = window.confirm(`Delete program "${program.name || 'Untitled'}"?`);
    if (!confirmed) return;

    try {
      await pb.collection(Collections.Programs).delete(program.id);
      loadPrograms();
    } catch (error) {
      console.error('Failed to delete program:', error);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Programs</h1>
            <p className="text-gray-600 mt-2">Manage program definitions and segments</p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            New Program
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name, code, or segment..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredPrograms.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Layers className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'No programs found' : 'No programs yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery ? 'Try adjusting your search' : 'Create your first program to get started'}
              </p>
              {!searchQuery && (
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Program
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrograms.map((program) => (
              <Card key={program.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{program.name || 'Untitled Program'}</CardTitle>
                      {program.code && (
                        <p className="text-sm text-gray-500 mt-1">Code: {program.code}</p>
                      )}
                    </div>
                    <Layers className="h-6 w-6 text-indigo-600" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {program.description && (
                    <p className="text-sm text-gray-600">{program.description}</p>
                  )}
                  {program.segments && program.segments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {program.segments.map((segment) => (
                        <Badge key={segment} variant="outline" className="text-xs">
                          {segment}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => router.push(`/programs/${program.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(program)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(program)}>
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

      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProgram ? 'Edit Program' : 'New Program'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="program-name">Program Name</Label>
              <Input
                id="program-name"
                value={formData.name}
                onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                placeholder="Program name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="program-code">Program Code</Label>
              <Input
                id="program-code"
                value={formData.code}
                onChange={(event) => setFormData({ ...formData, code: event.target.value })}
                placeholder="PRG-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="program-description">Description</Label>
              <textarea
                id="program-description"
                value={formData.description}
                onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                placeholder="Short description"
                className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <Label>Segments</Label>
              <div className="grid grid-cols-2 gap-2">
                {segmentOptions.map((segment) => (
                  <label key={segment} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={formData.segments?.includes(segment) || false}
                      onChange={() => toggleSegment(segment)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    {segment}
                  </label>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingProgram ? 'Save Changes' : 'Create Program'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
