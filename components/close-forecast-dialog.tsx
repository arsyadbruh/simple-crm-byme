'use client';

import { useState, useEffect } from 'react';
import pb, { Collections } from '@/lib/pocketbase';
import type { ForecastsExpanded } from '@/lib/pocketbase-types';
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

interface CloseForecastDialogProps {
  open: boolean;
  onClose: () => void;
  forecast: ForecastsExpanded | null;
}

export function CloseForecastDialog({ open, onClose, forecast }: CloseForecastDialogProps) {
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    status: 'Closing' as 'Closing' | 'Cancel',
    fix_omset: '',
    closing_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    if (open && forecast) {
      setFormData({
        status: 'Closing',
        fix_omset: forecast.target_omset?.toString() || '',
        closing_date: new Date().toISOString().split('T')[0],
        notes: forecast.notes || '',
      });
    }
  }, [open, forecast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!forecast) return;

    if (formData.status === 'Closing' && !formData.fix_omset) {
      alert('Actual revenue is required for Closing status');
      return;
    }
    
    setLoading(true);
    
    try {
      const updateData: any = {
        status: formData.status,
        closing_date: formData.closing_date,
        notes: formData.notes || null,
      };

      if (formData.status === 'Closing') {
        updateData.fix_omset = parseFloat(formData.fix_omset);
      }

      await pb.collection(Collections.Forecasts).update(forecast.id, updateData);
      alert(`Forecast berhasil ditutup dengan status: ${formData.status}`);
      onClose();
    } catch (error) {
      console.error('Failed to close forecast:', error);
      alert('Gagal menutup forecast. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (!forecast) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tutup Deal</DialogTitle>
          <DialogDescription>
            Tandai forecast ini sebagai Closing (berhasil) atau Cancel (batal)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status">
              Status <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'Closing' | 'Cancel') => 
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Closing">Closing (Deal Won)</SelectItem>
                <SelectItem value="Cancel">Cancel (Deal Lost)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.status === 'Closing' && (
            <div className="space-y-2">
              <Label htmlFor="fix_omset">
                Actual Revenue (Rp) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fix_omset"
                type="number"
                value={formData.fix_omset}
                onChange={(e) => setFormData({ ...formData, fix_omset: e.target.value })}
                placeholder="Masukkan pendapatan aktual"
                required
                min="0"
                step="1000"
              />
              <p className="text-xs text-gray-500">
                Target: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(forecast?.target_omset || 0)}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="closing_date">
              Closing Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="closing_date"
              type="date"
              value={formData.closing_date}
              onChange={(e) => setFormData({ ...formData, closing_date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Catatan Penutupan</Label>
            <textarea
              id="notes"
              rows={3}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Catatan tambahan tentang penutupan deal..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Batal
            </Button>
            <Button 
              type="submit"
              disabled={loading}
              className={formData.status === 'Closing' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {loading ? 'Menyimpan...' : `Tandai sebagai ${formData.status}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
