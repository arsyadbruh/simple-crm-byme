'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Navigation } from '@/components/navigation';
import pb, { Collections } from '@/lib/pocketbase';
import type { ProgramsRecord, SubProgramsExpanded, SubProgramsRecord } from '@/lib/pocketbase-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, FolderTree, Pencil, Plus, Search, Trash2 } from 'lucide-react';

const emptyForm = {
  name: '',
  code: '',
  program_relation: '',
};

export default function SubProgramsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [subPrograms, setSubPrograms] = useState<SubProgramsExpanded[]>([]);
  const [programs, setPrograms] = useState<ProgramsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubProgram, setEditingSubProgram] = useState<SubProgramsRecord | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subProgramRecords, programRecords] = await Promise.all([
        pb.collection(Collections.SubPrograms).getFullList<SubProgramsExpanded>({
          expand: 'program_relation',
          sort: '-created',
        }),
        pb.collection(Collections.Programs).getFullList<ProgramsRecord>({
          sort: 'name',
        }),
      ]);
      setSubPrograms(subProgramRecords);
      setPrograms(programRecords);
    } catch (error) {
      console.error('Failed to load sub programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubPrograms = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return subPrograms.filter((subProgram) => {
      const programName = subProgram.expand?.program_relation?.name?.toLowerCase() || '';
      return (
        subProgram.name?.toLowerCase().includes(query) ||
        subProgram.code?.toLowerCase().includes(query) ||
        programName.includes(query)
      );
    });
  }, [subPrograms, searchQuery]);

  const openCreateDialog = () => {
    setEditingSubProgram(null);
    setFormData(emptyForm);
    setIsDialogOpen(true);
  };

  const openEditDialog = (subProgram: SubProgramsExpanded) => {
    setEditingSubProgram(subProgram);
    setFormData({
      name: subProgram.name || '',
      code: subProgram.code || '',
      program_relation: subProgram.program_relation || '',
    });
    setIsDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingSubProgram(null);
      setFormData(emptyForm);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (editingSubProgram) {
        await pb.collection(Collections.SubPrograms).update(editingSubProgram.id, formData);
      } else {
        await pb.collection(Collections.SubPrograms).create(formData);
      }
      handleDialogClose(false);
      loadData();
    } catch (error) {
      console.error('Failed to save sub program:', error);
    }
  };

  const handleDelete = async (subProgram: SubProgramsRecord) => {
    const confirmed = window.confirm(`Delete sub program "${subProgram.name || 'Untitled'}"?`);
    if (!confirmed) return;

    try {
      await pb.collection(Collections.SubPrograms).delete(subProgram.id);
      loadData();
    } catch (error) {
      console.error('Failed to delete sub program:', error);
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
            <h1 className="text-3xl font-bold text-gray-900">Sub Programs</h1>
            <p className="text-gray-600 mt-2">Organize programs into sub categories</p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            New Sub Program
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name, code, or program..."
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
        ) : filteredSubPrograms.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FolderTree className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'No sub programs found' : 'No sub programs yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery ? 'Try adjusting your search' : 'Create your first sub program to get started'}
              </p>
              {!searchQuery && (
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Sub Program
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubPrograms.map((subProgram) => (
              <Card key={subProgram.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{subProgram.name || 'Untitled Sub Program'}</CardTitle>
                      {subProgram.code && (
                        <p className="text-sm text-gray-500 mt-1">Code: {subProgram.code}</p>
                      )}
                    </div>
                    <FolderTree className="h-6 w-6 text-indigo-600" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium text-gray-700">Program:</span>{' '}
                    {subProgram.expand?.program_relation?.name || '-'}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => router.push(`/sub-programs/${subProgram.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(subProgram)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(subProgram)}>
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
            <DialogTitle>{editingSubProgram ? 'Edit Sub Program' : 'New Sub Program'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sub-program-name">Sub Program Name</Label>
              <Input
                id="sub-program-name"
                value={formData.name}
                onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                placeholder="Sub program name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sub-program-code">Sub Program Code</Label>
              <Input
                id="sub-program-code"
                value={formData.code}
                onChange={(event) => setFormData({ ...formData, code: event.target.value })}
                placeholder="SUB-001"
              />
            </div>
            <div className="space-y-2">
              <Label>Program</Label>
              <Select
                value={formData.program_relation}
                onValueChange={(value) => setFormData({ ...formData, program_relation: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.name || program.code || program.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingSubProgram ? 'Save Changes' : 'Create Sub Program'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
