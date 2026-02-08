'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import pb, { Collections } from '@/lib/pocketbase';
import type {
  ActivitiesExpanded,
  ActivitiesRecord,
  ActivityType,
  ContactsRecord,
  ForecastsRecord,
} from '@/lib/pocketbase-types';
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

interface ActivityFormDialogProps {
  open: boolean;
  onClose: () => void;
  activity?: ActivitiesExpanded | null;
}

const ACTIVITY_TYPES: ActivityType[] = ['Call', 'Visit', 'Meeting', 'Demo', 'WhatsApp'];

export function ActivityFormDialog({ open, onClose, activity }: ActivityFormDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<ContactsRecord[]>([]);
  const [forecasts, setForecasts] = useState<ForecastsRecord[]>([]);
  const [formData, setFormData] = useState({
    type: '' as ActivityType | '',
    contact: '',
    date_contacted: new Date().toISOString().split('T')[0],
    summary: '',
    details: '',
    outcome: '',
    next_action: '',
    next_action_date: '',
    is_responded: false,
    target_forecast: '',
  });

  useEffect(() => {
    if (!open) return;
    loadInitialData();

    if (activity) {
      setFormData({
        type: activity.type || '',
        contact: activity.contact || '',
        date_contacted: activity.date_contacted
          ? new Date(activity.date_contacted).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        summary: activity.summary || '',
        details: activity.details || '',
        outcome: activity.outcome || '',
        next_action: activity.next_action || '',
        next_action_date: activity.next_action_date
          ? new Date(activity.next_action_date).toISOString().split('T')[0]
          : '',
        is_responded: Boolean(activity.is_responded),
        target_forecast: activity.target_forecast || '',
      });
    } else {
      setFormData({
        type: '',
        contact: '',
        date_contacted: new Date().toISOString().split('T')[0],
        summary: '',
        details: '',
        outcome: '',
        next_action: '',
        next_action_date: '',
        is_responded: false,
        target_forecast: '',
      });
    }
  }, [open, activity]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [contactsData, forecastsData] = await Promise.all([
        pb.collection(Collections.Contacts).getFullList<ContactsRecord>({
          sort: 'name',
        }),
        pb.collection(Collections.Forecasts).getFullList<ForecastsRecord>({
          sort: '-created',
        }),
      ]);
      setContacts(contactsData);
      setForecasts(forecastsData);
    } catch (error) {
      console.error('Failed to load activity data:', error);
      alert('Gagal memuat data. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!user) {
      alert('Anda harus login terlebih dahulu');
      return;
    }

    if (!formData.type || !formData.contact) {
      alert('Type dan Contact wajib diisi');
      return;
    }

    try {
      setLoading(true);
      const payload: Partial<ActivitiesRecord> = {
        type: formData.type || undefined,
        contact: formData.contact || undefined,
        date_contacted: formData.date_contacted || undefined,
        summary: formData.summary.trim() || undefined,
        details: formData.details.trim() || undefined,
        outcome: formData.outcome.trim() || undefined,
        next_action: formData.next_action.trim() || undefined,
        next_action_date: formData.next_action_date || undefined,
        is_responded: formData.is_responded,
        target_forecast: formData.target_forecast || undefined,
        pic: user.id,
      };

      if (activity) {
        await pb.collection(Collections.Activities).update(activity.id, payload);
      } else {
        await pb.collection(Collections.Activities).create(payload);
      }

      alert(activity ? 'Activity berhasil diupdate!' : 'Activity berhasil dibuat!');
      onClose();
    } catch (error: any) {
      console.error('Failed to save activity:', error);
      alert(`Gagal menyimpan activity: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{activity ? 'Edit Activity' : 'Log Activity'}</DialogTitle>
          <DialogDescription>
            {activity ? 'Perbarui aktivitas yang sudah ada.' : 'Catat aktivitas baru ke CRM.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type <span className="text-red-500">*</span></Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as ActivityType })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih type" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Contact <span className="text-red-500">*</span></Label>
              <Select
                value={formData.contact}
                onValueChange={(value) => setFormData({ ...formData, contact: value })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih contact" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name || '(Untitled)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activity-date">Tanggal Aktivitas</Label>
              <Input
                id="activity-date"
                type="date"
                value={formData.date_contacted}
                onChange={(event) => setFormData({ ...formData, date_contacted: event.target.value })}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label>Responded</Label>
              <Select
                value={formData.is_responded ? 'yes' : 'no'}
                onValueChange={(value) =>
                  setFormData({ ...formData, is_responded: value === 'yes' })
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

          <div className="space-y-2">
            <Label htmlFor="activity-summary">Summary</Label>
            <Input
              id="activity-summary"
              value={formData.summary}
              onChange={(event) => setFormData({ ...formData, summary: event.target.value })}
              placeholder="Ringkasan aktivitas"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity-details">Details</Label>
            <textarea
              id="activity-details"
              rows={3}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.details}
              onChange={(event) => setFormData({ ...formData, details: event.target.value })}
              placeholder="Catatan detail aktivitas"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="activity-outcome">Outcome</Label>
              <Input
                id="activity-outcome"
                value={formData.outcome}
                onChange={(event) => setFormData({ ...formData, outcome: event.target.value })}
                placeholder="Hasil aktivitas"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="activity-next-action">Next Action</Label>
              <Input
                id="activity-next-action"
                value={formData.next_action}
                onChange={(event) => setFormData({ ...formData, next_action: event.target.value })}
                placeholder="Tindak lanjut"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="activity-next-date">Next Action Date</Label>
              <Input
                id="activity-next-date"
                type="date"
                value={formData.next_action_date}
                onChange={(event) => setFormData({ ...formData, next_action_date: event.target.value })}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label>Target Forecast</Label>
              <Select
                value={formData.target_forecast}
                onValueChange={(value) => setFormData({ ...formData, target_forecast: value })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih forecast" />
                </SelectTrigger>
                <SelectContent>
                  {forecasts.map((forecast) => (
                    <SelectItem key={forecast.id} value={forecast.id}>
                      {forecast.target_proposal || '(No Title)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : activity ? 'Update Activity' : 'Simpan Activity'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
