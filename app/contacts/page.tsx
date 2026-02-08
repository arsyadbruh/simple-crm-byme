'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Navigation } from '@/components/navigation';
import pb, { Collections } from '@/lib/pocketbase';
import type { ContactsExpanded } from '@/lib/pocketbase-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Users, Search, Phone, Mail, Building2, Pencil, Trash2 } from 'lucide-react';
import { ContactFormDialog } from '@/components/contact-form-dialog';

export default function ContactsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [contacts, setContacts] = useState<ContactsExpanded[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactsExpanded | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      loadContacts();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem(`crm:view:contacts:${user.id}`);
    if (stored === 'card' || stored === 'table') {
      setViewMode(stored);
    }
  }, [user]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const records = await pb.collection(Collections.Contacts).getFullList<ContactsExpanded>({
        expand: 'institution_relation',
        sort: '-created',
      });
      setContacts(records);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (contact: ContactsExpanded) => {
    setEditingContact(contact);
    setIsFormOpen(true);
  };

  const handleDelete = async (contact: ContactsExpanded) => {
    const confirmed = window.confirm(`Delete contact "${contact.name || 'Untitled'}"?`);
    if (!confirmed) return;

    try {
      await pb.collection(Collections.Contacts).delete(contact.id);
      loadContacts();
    } catch (error) {
      console.error('Failed to delete contact:', error);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingContact(null);
    loadContacts();
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

  const filteredContacts = contacts.filter((contact) =>
    contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.expand?.institution_relation?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewModeChange = (mode: 'card' | 'table') => {
    setViewMode(mode);
    if (user) {
      localStorage.setItem(`crm:view:contacts:${user.id}`, mode);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
            <p className="text-gray-600 mt-2">Manage your contacts and decision makers</p>
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
              New Contact
            </Button>
          </div>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name, email, job title, or institution..."
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
        ) : filteredContacts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'No contacts found' : 'No contacts yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery ? 'Try adjusting your search' : 'Get started by adding your first contact'}
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Contact</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Institution</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Job Title</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Phone</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Primary</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{contact.name}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {contact.expand?.institution_relation?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{contact.position || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">{contact.email || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">{contact.phone || '-'}</td>
                    <td className="px-4 py-3">
                      {contact.is_primary ? (
                        <Badge variant="outline" className="text-xs">Yes</Badge>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(contact)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(contact)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContacts.map((contact) => (
              <Card key={contact.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{contact.name}</CardTitle>
                      {contact.is_primary && (
                        <Badge variant="outline" className="text-xs mb-2">Primary Contact</Badge>
                      )}
                      {contact.position && (
                        <p className="text-sm text-gray-600 mt-1">{contact.position}</p>
                      )}
                    </div>
                    <Users className="h-6 w-6 text-indigo-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    {contact.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        {contact.phone}
                      </div>
                    )}
                    {contact.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        {contact.email}
                      </div>
                    )}
                  </div>
                  {contact.expand?.institution_relation && (
                    <div className="pt-3 border-t">
                      <div className="flex items-center text-sm">
                        <Building2 className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-gray-700 font-medium">
                          {contact.expand.institution_relation.name}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(contact)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(contact)}>
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

      <ContactFormDialog
        open={isFormOpen}
        onClose={handleFormClose}
        contact={editingContact}
      />
    </div>
  );
}
