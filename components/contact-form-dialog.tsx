'use client';

import { useEffect, useState } from 'react';
import pb, { Collections } from '@/lib/pocketbase';
import type { ContactsExpanded, ContactsRecord, InstitutionsRecord } from '@/lib/pocketbase-types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ContactFormDialogProps {
  open: boolean;
  onClose: () => void;
  contact?: ContactsExpanded | null;
}

const STATUS_OPTIONS: NonNullable<ContactsRecord['status']>[] = ['Active', 'Non Active'];

export function ContactFormDialog({ open, onClose, contact }: ContactFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [institutions, setInstitutions] = useState<InstitutionsRecord[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    email: '',
    phone: '',
    status: '' as ContactsRecord['status'] | '',
    institution_relation: '',
    is_primary: false,
  });

  useEffect(() => {
    if (!open) return;
    loadInstitutions();
    if (contact) {
      setFormData({
        name: contact.name || '',
        position: contact.position || '',
        email: contact.email || '',
        phone: contact.phone || '',
        status: contact.status || '',
        institution_relation: contact.institution_relation || '',
        is_primary: Boolean(contact.is_primary),
      });
    } else {
      setFormData({
        name: '',
        position: '',
        email: '',
        phone: '',
        status: '',
        institution_relation: '',
        is_primary: false,
      });
    }
  }, [open, contact]);

  const loadInstitutions = async () => {
    try {
      setLoading(true);
      const records = await pb.collection(Collections.Institutions).getFullList<InstitutionsRecord>({
        sort: 'name',
      });
      setInstitutions(records);
    } catch (error) {
      console.error('Failed to load institutions:', error);
      alert('Gagal memuat data institution. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      alert('Nama kontak wajib diisi');
      return;
    }

    try {
      setLoading(true);
      const payload: Partial<ContactsRecord> = {
        name: formData.name.trim(),
        position: formData.position.trim() || undefined,
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        status: formData.status || undefined,
        institution_relation: formData.institution_relation || undefined,
        is_primary: formData.is_primary,
      };

      if (contact) {
        await pb.collection(Collections.Contacts).update(contact.id, payload);
      } else {
        await pb.collection(Collections.Contacts).create(payload);
      }

      alert(contact ? 'Kontak berhasil diupdate!' : 'Kontak berhasil dibuat!');
      onClose();
    } catch (error: any) {
      console.error('Failed to save contact:', error);
      alert(`Gagal menyimpan kontak: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{contact ? 'Edit Contact' : 'Tambah Contact'}</DialogTitle>
          <DialogDescription>
            {contact ? 'Perbarui informasi contact yang sudah ada.' : 'Tambahkan contact baru ke CRM.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contact-name">
              Nama <span className="text-red-500">*</span>
            </Label>
            <Input
              id="contact-name"
              value={formData.name}
              onChange={(event) => setFormData({ ...formData, name: event.target.value })}
              placeholder="Nama lengkap"
              disabled={loading}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact-position">Jabatan</Label>
              <Input
                id="contact-position"
                value={formData.position}
                onChange={(event) => setFormData({ ...formData, position: event.target.value })}
                placeholder="Job title"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-phone">Telepon</Label>
              <Input
                id="contact-phone"
                value={formData.phone}
                onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                placeholder="08xxxxxxxxxx"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                type="email"
                value={formData.email}
                onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                placeholder="nama@email.com"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as ContactsRecord['status'] })
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Institution</Label>
              <Select
                value={formData.institution_relation}
                onValueChange={(value) => setFormData({ ...formData, institution_relation: value })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih institution" />
                </SelectTrigger>
                <SelectContent>
                  {institutions.map((inst) => (
                    <SelectItem key={inst.id} value={inst.id}>
                      {inst.name || '(Untitled)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Primary Contact</Label>
              <Select
                value={formData.is_primary ? 'yes' : 'no'}
                onValueChange={(value) =>
                  setFormData({ ...formData, is_primary: value === 'yes' })
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : contact ? 'Update Contact' : 'Buat Contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
