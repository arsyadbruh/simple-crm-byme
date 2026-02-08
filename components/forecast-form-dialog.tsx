'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import pb, { Collections } from '@/lib/pocketbase';
import type {
  ForecastsExpanded,
  ForecastsRecord,
  ForecastStatus,
  ProgramsRecord,
  SubProgramsRecord,
  ProductsRecord,
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

export function ForecastFormDialog({ open, onClose, forecast }: ForecastFormDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [institutions, setInstitutions] = useState<InstitutionsRecord[]>([]);
  const [programs, setPrograms] = useState<ProgramsRecord[]>([]);
  const [subPrograms, setSubPrograms] = useState<SubProgramsRecord[]>([]);
  const [products, setProducts] = useState<ProductsRecord[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    institution_id: '',
    program_id: '',
    sub_program_id: '',
    product_id: '',
    project_title: '',
    target_month: '',
    target_week: '',
    target_amount: '',
    status: 'Planning' as ForecastStatus,
    notes: '',
  });

  useEffect(() => {
    if (open) {
      loadInitialData();
      if (forecast) {
        setFormData({
          institution_id: forecast.institution_id,
          program_id: forecast.program_id,
          sub_program_id: forecast.sub_program_id || '',
          product_id: forecast.product_id || '',
          project_title: forecast.project_title,
          target_month: forecast.target_month,
          target_week: forecast.target_week?.toString() || '',
          target_amount: forecast.target_amount.toString(),
          status: forecast.status,
          notes: forecast.notes || '',
        });
      } else {
        resetForm();
      }
    }
  }, [open, forecast]);

  // Load sub-programs when program changes
  useEffect(() => {
    if (formData.program_id) {
      loadSubPrograms(formData.program_id);
    } else {
      setSubPrograms([]);
      setProducts([]);
    }
  }, [formData.program_id]);

  // Load products when sub-program changes
  useEffect(() => {
    if (formData.sub_program_id) {
      loadProducts(formData.sub_program_id);
    } else {
      setProducts([]);
    }
  }, [formData.sub_program_id]);

  const loadInitialData = async () => {
    try {
      const [institutionsData, programsData] = await Promise.all([
        pb.collection(Collections.Institutions).getFullList<InstitutionsRecord>({ sort: 'name' }),
        pb.collection(Collections.Programs).getFullList<ProgramsRecord>({
          filter: 'is_active = true',
          sort: 'name',
        }),
      ]);

      setInstitutions(institutionsData);
      setPrograms(programsData);

      // If editing, load the nested data
      if (forecast) {
        if (forecast.program_id) {
          const subProgsData = await pb
            .collection(Collections.SubPrograms)
            .getFullList<SubProgramsRecord>({
              filter: `program_id = '${forecast.program_id}' && is_active = true`,
              sort: 'name',
            });
          setSubPrograms(subProgsData);
        }

        if (forecast.sub_program_id) {
          const productsData = await pb
            .collection(Collections.Products)
            .getFullList<ProductsRecord>({
              filter: `sub_program_id = '${forecast.sub_program_id}' && is_active = true`,
              sort: 'name',
            });
          setProducts(productsData);
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const loadSubPrograms = async (programId: string) => {
    try {
      const data = await pb.collection(Collections.SubPrograms).getFullList<SubProgramsRecord>({
        filter: `program_id = '${programId}' && is_active = true`,
        sort: 'name',
      });
      setSubPrograms(data);
      
      // Reset dependent fields if program changes
      if (!forecast || forecast.program_id !== programId) {
        setFormData(prev => ({ ...prev, sub_program_id: '', product_id: '' }));
      }
    } catch (error) {
      console.error('Failed to load sub-programs:', error);
    }
  };

  const loadProducts = async (subProgramId: string) => {
    try {
      const data = await pb.collection(Collections.Products).getFullList<ProductsRecord>({
        filter: `sub_program_id = '${subProgramId}' && is_active = true`,
        sort: 'name',
      });
      setProducts(data);
      
      // Reset product if sub-program changes
      if (!forecast || forecast.sub_program_id !== subProgramId) {
        setFormData(prev => ({ ...prev, product_id: '' }));
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const resetForm = () => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    setFormData({
      institution_id: '',
      program_id: '',
      sub_program_id: '',
      product_id: '',
      project_title: '',
      target_month: currentMonth,
      target_week: '',
      target_amount: '',
      status: 'Planning',
      notes: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setLoading(true);
    
    try {
      const data: any = {
        user_id: user.id,
        institution_id: formData.institution_id,
        program_id: formData.program_id,
        sub_program_id: formData.sub_program_id || null,
        product_id: formData.product_id || null,
        project_title: formData.project_title,
        target_month: formData.target_month,
        target_week: formData.target_week ? parseInt(formData.target_week) : null,
        target_amount: parseFloat(formData.target_amount),
        status: formData.status,
        notes: formData.notes || null,
      };

      if (forecast) {
        await pb.collection(Collections.Forecasts).update(forecast.id, data);
      } else {
        await pb.collection(Collections.Forecasts).create(data);
      }

      onClose();
    } catch (error) {
      console.error('Failed to save forecast:', error);
      alert('Failed to save forecast. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const statuses: ForecastStatus[] = ['Planning', 'Approaching', 'Negotiation', 'Closed Won', 'Closed Lost'];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{forecast ? 'Edit Forecast' : 'Create New Forecast'}</DialogTitle>
          <DialogDescription>
            Enter forecast details. Program is required, but Sub Program and Product can be specified later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Institution */}
            <div className="space-y-2">
              <Label htmlFor="institution_id">
                Institution <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.institution_id}
                onValueChange={(value) => setFormData({ ...formData, institution_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select institution" />
                </SelectTrigger>
                <SelectContent>
                  {institutions.map((inst) => (
                    <SelectItem key={inst.id} value={inst.id}>
                      {inst.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as ForecastStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Project Title */}
          <div className="space-y-2">
            <Label htmlFor="project_title">
              Project Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="project_title"
              value={formData.project_title}
              onChange={(e) => setFormData({ ...formData, project_title: e.target.value })}
              placeholder="e.g., LMS Implementation for School X"
              required
            />
          </div>

          {/* Cascading Dropdowns: Program -> Sub Program -> Product */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-semibold text-sm text-gray-700">Program Hierarchy (Cascading Selection)</h4>
            
            {/* Program (Level 1) - Required */}
            <div className="space-y-2">
              <Label htmlFor="program_id">
                Program <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.program_id}
                onValueChange={(value) => setFormData({ ...formData, program_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sub Program (Level 2) - Optional */}
            <div className="space-y-2">
              <Label htmlFor="sub_program_id">
                Sub Program <span className="text-gray-500">(Optional)</span>
              </Label>
              <Select
                value={formData.sub_program_id}
                onValueChange={(value) => setFormData({ ...formData, sub_program_id: value })}
                disabled={!formData.program_id || subPrograms.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !formData.program_id 
                      ? 'Select program first' 
                      : subPrograms.length === 0 
                      ? 'No sub-programs available' 
                      : 'Select sub program'
                  } />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {subPrograms.map((subProgram) => (
                    <SelectItem key={subProgram.id} value={subProgram.id}>
                      {subProgram.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Product (Level 3) - Optional */}
            <div className="space-y-2">
              <Label htmlFor="product_id">
                Product <span className="text-gray-500">(Optional)</span>
              </Label>
              <Select
                value={formData.product_id}
                onValueChange={(value) => setFormData({ ...formData, product_id: value })}
                disabled={!formData.sub_program_id || products.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !formData.sub_program_id 
                      ? 'Select sub program first' 
                      : products.length === 0 
                      ? 'No products available' 
                      : 'Select product'
                  } />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Target Month & Week */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target_month">
                Target Month <span className="text-red-500">*</span>
              </Label>
              <Input
                id="target_month"
                type="month"
                value={formData.target_month}
                onChange={(e) => setFormData({ ...formData, target_month: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_week">Target Week (1-4)</Label>
              <Select
                value={formData.target_week}
                onValueChange={(value) => setFormData({ ...formData, target_week: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  <SelectItem value="1">Week 1</SelectItem>
                  <SelectItem value="2">Week 2</SelectItem>
                  <SelectItem value="3">Week 3</SelectItem>
                  <SelectItem value="4">Week 4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Target Amount */}
          <div className="space-y-2">
            <Label htmlFor="target_amount">
              Target Amount (IDR) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="target_amount"
              type="number"
              value={formData.target_amount}
              onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
              placeholder="e.g., 50000000"
              required
              min="0"
              step="1000"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes or context..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : forecast ? 'Update Forecast' : 'Create Forecast'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
