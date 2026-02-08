'use client';

import { useState, useEffect } from 'react';
import pb, { Collections } from '@/lib/pocketbase';
import type {
  ForecastsExpanded,
  ProductsRecord,
  SubProgramsRecord,
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

interface CloseForecastDialogProps {
  open: boolean;
  onClose: () => void;
  forecast: ForecastsExpanded | null;
}

export function CloseForecastDialog({ open, onClose, forecast }: CloseForecastDialogProps) {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ProductsRecord[]>([]);
  const [subPrograms, setSubPrograms] = useState<SubProgramsRecord[]>([]);
  
  const [formData, setFormData] = useState({
    status: 'Closed Won' as 'Closed Won' | 'Closed Lost',
    fix_omset: '',
    product_id: '',
    sub_program_id: '',
    closing_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    if (open && forecast) {
      // Initialize form data
      setFormData({
        status: 'Closed Won',
        fix_omset: forecast.target_amount.toString(),
        product_id: forecast.product_id || '',
        sub_program_id: forecast.sub_program_id || '',
        closing_date: new Date().toISOString().split('T')[0],
        notes: forecast.notes || '',
      });

      // Load products if needed
      loadHierarchy();
    }
  }, [open, forecast]);

  // Load sub-programs when this changes
  useEffect(() => {
    if (formData.sub_program_id) {
      loadProducts(formData.sub_program_id);
    }
  }, [formData.sub_program_id]);

  const loadHierarchy = async () => {
    if (!forecast) return;

    try {
      // Load sub-programs for the selected program
      if (forecast.program_id) {
        const subProgsData = await pb
          .collection(Collections.SubPrograms)
          .getFullList<SubProgramsRecord>({
            filter: `program_id = '${forecast.program_id}' && is_active = true`,
            sort: 'name',
          });
        setSubPrograms(subProgsData);
      }

      // Load products if sub-program exists
      if (forecast.sub_program_id) {
        await loadProducts(forecast.sub_program_id);
      }
    } catch (error) {
      console.error('Failed to load hierarchy:', error);
    }
  };

  const loadProducts = async (subProgramId: string) => {
    try {
      const productsData = await pb
        .collection(Collections.Products)
        .getFullList<ProductsRecord>({
          filter: `sub_program_id = '${subProgramId}' && is_active = true`,
          sort: 'name',
        });
      setProducts(productsData);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!forecast) return;

    // Validation: If Closed Won, fix_omset and product_id are required
    if (formData.status === 'Closed Won') {
      if (!formData.fix_omset || parseFloat(formData.fix_omset) <= 0) {
        alert('Please enter a valid actual revenue amount.');
        return;
      }
      
      if (!formData.product_id) {
        alert('Please select a product before closing as Won.');
        return;
      }
    }
    
    setLoading(true);
    
    try {
      const updateData: any = {
        status: formData.status,
        closing_date: formData.closing_date,
        notes: formData.notes,
      };

      if (formData.status === 'Closed Won') {
        updateData.fix_omset = parseFloat(formData.fix_omset);
        updateData.product_id = formData.product_id;
        
        // Also update sub_program_id if it was changed
        if (formData.sub_program_id) {
          updateData.sub_program_id = formData.sub_program_id;
        }
      }

      await pb.collection(Collections.Forecasts).update(forecast.id, updateData);
      onClose();
    } catch (error) {
      console.error('Failed to close forecast:', error);
      alert('Failed to close forecast. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!forecast) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Close Deal</DialogTitle>
          <DialogDescription>
            Mark this forecast as Closed Won or Closed Lost
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">
              Status <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'Closed Won' | 'Closed Lost') => 
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Closed Won">Closed Won</SelectItem>
                <SelectItem value="Closed Lost">Closed Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.status === 'Closed Won' && (
            <>
              {/* Actual Revenue */}
              <div className="space-y-2">
                <Label htmlFor="fix_omset">
                  Actual Revenue (IDR) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fix_omset"
                  type="number"
                  value={formData.fix_omset}
                  onChange={(e) => setFormData({ ...formData, fix_omset: e.target.value })}
                  placeholder="Enter actual revenue"
                  required
                  min="0"
                  step="1000"
                />
                <p className="text-xs text-gray-500">
                  Target was: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(forecast.target_amount)}
                </p>
              </div>

              {/* Sub Program - if not set */}
              {!forecast.sub_program_id && subPrograms.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="sub_program_id">
                    Sub Program <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.sub_program_id}
                    onValueChange={(value) => setFormData({ ...formData, sub_program_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sub program" />
                    </SelectTrigger>
                    <SelectContent>
                      {subPrograms.map((subProgram) => (
                        <SelectItem key={subProgram.id} value={subProgram.id}>
                          {subProgram.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Product - Required for Closed Won */}
              <div className="space-y-2">
                <Label htmlFor="product_id">
                  Product <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.product_id}
                  onValueChange={(value) => setFormData({ ...formData, product_id: value })}
                  required
                  disabled={!forecast.sub_program_id && !formData.sub_program_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !forecast.sub_program_id && !formData.sub_program_id
                        ? 'Select sub program first'
                        : 'Select product'
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Closing Date */}
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

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Closing Notes</Label>
            <textarea
              id="notes"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about the deal closure..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={loading}
              className={formData.status === 'Closed Won' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {loading ? 'Saving...' : `Mark as ${formData.status}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
