'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import pb, { Collections } from '@/lib/pocketbase';
import type {
  ForecastsExpanded,
  ForecastStatus,
  TargetMonth,
  TargetWeek,
  ProgramsRecord,
  InstitutionsRecord,
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

interface ForecastFormDialogProps {
  open: boolean;
  onClose: () => void;
  forecast?: ForecastsExpanded | null;
}

const MONTHS: TargetMonth[] = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const WEEKS: TargetWeek[] = ['Pekan 1', 'Pekan 2', 'Pekan 3', 'Pekan 4', 'Pekan5'];

const STATUSES: ForecastStatus[] = ['Cold', 'Warm', 'Hot', 'Closing', 'Cancel'];


export function ForecastFormDialog({ open, onClose, forecast }: ForecastFormDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [institutions, setInstitutions] = useState<InstitutionsRecord[]>([]);
  const [programs, setPrograms] = useState<ProgramsRecord[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    institution: '',
    target_program: '',
    target_year: new Date().getFullYear().toString(),
    target_month: '' as TargetMonth | '',
    target_week: '' as TargetWeek | '',
    target_proposal: '',
    target_omset: '',
    status: 'Cold' as ForecastStatus,
    notes: '',
  });

  useEffect(() => {
    if (open) {
      loadInitialData();
      if (forecast) {
        setFormData({
          institution: forecast.institution,
          target_program: forecast.target_program,
          target_year: forecast.target_year || new Date().getFullYear().toString(),
          target_month: forecast.target_month || '',
          target_week: forecast.target_week || '',
          target_proposal: forecast.target_proposal || '',
          target_omset: forecast.target_omset?.toString() || '',
          status: forecast.status || 'Cold',
          notes: forecast.notes || '',
        });
      } else {
        resetForm();
      }
    }
  }, [open, forecast]);


  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load institutions and programs in parallel
      const [institutionsData, programsData] = await Promise.all([
        pb.collection(Collections.Institutions).getFullList<InstitutionsRecord>({
          sort: 'name',
        }),
        pb.collection(Collections.Programs).getFullList<ProgramsRecord>({
          sort: 'name',
        }),
      ]);

      setInstitutions(institutionsData);
      setPrograms(programsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('Gagal memuat data. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      institution: '',
      target_program: '',
      target_year: new Date().getFullYear().toString(),
      target_month: '',
      target_week: '',
      target_proposal: '',
      target_omset: '',
      status: 'Cold',
      notes: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('Anda harus login terlebih dahulu');
      return;
    }

    if (!formData.institution || !formData.target_program) {
      alert('Institution dan Program wajib diisi');
      return;
    }

    try {
      setLoading(true);

      const data = {
        institution: formData.institution,
        target_program: formData.target_program,
        target_year: formData.target_year,
        target_month: formData.target_month || undefined,
        target_week: formData.target_week || undefined,
        target_proposal: formData.target_proposal || undefined,
        target_omset: formData.target_omset ? parseFloat(formData.target_omset) : undefined,
        status: formData.status,
        notes: formData.notes || undefined,
        pic: user.id,
      };

      if (forecast) {
        await pb.collection(Collections.Forecasts).update(forecast.id, data);
      } else {
        await pb.collection(Collections.Forecasts).create(data);
      }

      alert(forecast ? 'Forecast berhasil diupdate!' : 'Forecast berhasil dibuat!');
      onClose();
    } catch (error: any) {
      console.error('Failed to save forecast:', error);
      alert(`Gagal menyimpan forecast: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{forecast ? 'Edit Forecast' : 'Buat Forecast Baru'}</DialogTitle>
          <DialogDescription>
            {forecast 
              ? 'Update informasi forecast yang sudah ada' 
              : 'Tambahkan forecast baru untuk institution target'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Institution */}
          <div className="space-y-2">
            <Label htmlFor="institution">
              Institution <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.institution}
              onValueChange={(value) => setFormData({ ...formData, institution: value })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Institution" />
              </SelectTrigger>
              <SelectContent>
                {institutions.map((inst) => (
                  <SelectItem key={inst.id} value={inst.id}>
                    {inst.name} {inst.type && `(${inst.type})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Program */}
          <div className="space-y-2">
            <Label htmlFor="target_program">
              Program <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.target_program}
              onValueChange={(value) => setFormData({ ...formData, target_program: value })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Program" />
              </SelectTrigger>
              <SelectContent>
                {programs.map((prog) => (
                  <SelectItem key={prog.id} value={prog.id}>
                    {prog.name} {prog.code && `(${prog.code})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>


          {/* Target Period */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target_year">Tahun Target</Label>
              <Input
                id="target_year"
                type="text"
                value={formData.target_year}
                onChange={(e) => setFormData({ ...formData, target_year: e.target.value })}
                placeholder="2024"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_month">Bulan Target</Label>
              <Select
                value={formData.target_month}
                onValueChange={(value) => setFormData({ ...formData, target_month: value as TargetMonth })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Bulan" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_week">Pekan Target</Label>
              <Select
                value={formData.target_week}
                onValueChange={(value) => setFormData({ ...formData, target_week: value as TargetWeek })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Pekan" />
                </SelectTrigger>
                <SelectContent>
                  {WEEKS.map((week) => (
                    <SelectItem key={week} value={week}>
                      {week}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Target Proposal */}
          <div className="space-y-2">
            <Label htmlFor="target_proposal">Target Proposal</Label>
            <Input
              id="target_proposal"
              type="text"
              value={formData.target_proposal}
              onChange={(e) => setFormData({ ...formData, target_proposal: e.target.value })}
              placeholder="Nama proposal atau judul project"
              disabled={loading}
            />
          </div>

          {/* Target Omset */}
          <div className="space-y-2">
            <Label htmlFor="target_omset">Target Omset (Rp)</Label>
            <Input
              id="target_omset"
              type="number"
              value={formData.target_omset}
              onChange={(e) => setFormData({ ...formData, target_omset: e.target.value })}
              placeholder="0"
              disabled={loading}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as ForecastStatus })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Catatan</Label>
            <textarea
              id="notes"
              rows={3}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Tambahkan catatan tentang forecast ini..."
              disabled={loading}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : forecast ? 'Update' : 'Buat Forecast'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
