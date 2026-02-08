'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Navigation } from '@/components/navigation';
import pb, { Collections } from '@/lib/pocketbase';
import type { ProductsExpanded, ProductsRecord, ProgramsRecord } from '@/lib/pocketbase-types';
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
import { Package, Pencil, Plus, Search, Trash2 } from 'lucide-react';

const emptyForm = {
  name: '',
  code: '',
  description: '',
  program_relation: '',
  base_price: '',
};

export default function ProductsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<ProductsExpanded[]>([]);
  const [programs, setPrograms] = useState<ProgramsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductsRecord | null>(null);
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
      const [productRecords, programRecords] = await Promise.all([
        pb.collection(Collections.Products).getFullList<ProductsExpanded>({
          expand: 'program_relation',
          sort: '-created',
        }),
        pb.collection(Collections.Programs).getFullList<ProgramsRecord>({
          sort: 'name',
        }),
      ]);
      setProducts(productRecords);
      setPrograms(programRecords);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return products.filter((product) => {
      const programName = product.expand?.program_relation?.name?.toLowerCase() || '';
      return (
        product.name?.toLowerCase().includes(query) ||
        product.code?.toLowerCase().includes(query) ||
        programName.includes(query)
      );
    });
  }, [products, searchQuery]);

  const openCreateDialog = () => {
    setEditingProduct(null);
    setFormData(emptyForm);
    setIsDialogOpen(true);
  };

  const openEditDialog = (product: ProductsExpanded) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      code: product.code || '',
      description: product.description || '',
      program_relation: product.program_relation || '',
      base_price: product.base_price ? String(product.base_price) : '',
    });
    setIsDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingProduct(null);
      setFormData(emptyForm);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      name: formData.name,
      code: formData.code,
      description: formData.description,
      program_relation: formData.program_relation,
      base_price: formData.base_price ? Number(formData.base_price) : undefined,
    };

    try {
      if (editingProduct) {
        await pb.collection(Collections.Products).update(editingProduct.id, payload);
      } else {
        await pb.collection(Collections.Products).create(payload);
      }
      handleDialogClose(false);
      loadData();
    } catch (error) {
      console.error('Failed to save product:', error);
    }
  };

  const handleDelete = async (product: ProductsRecord) => {
    const confirmed = window.confirm(`Delete product "${product.name || 'Untitled'}"?`);
    if (!confirmed) return;

    try {
      await pb.collection(Collections.Products).delete(product.id);
      loadData();
    } catch (error) {
      console.error('Failed to delete product:', error);
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-600 mt-2">Manage catalog items and pricing</p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            New Product
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
        ) : filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'No products found' : 'No products yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery ? 'Try adjusting your search' : 'Create your first product to get started'}
              </p>
              {!searchQuery && (
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{product.name || 'Untitled Product'}</CardTitle>
                      {product.code && (
                        <p className="text-sm text-gray-500 mt-1">Code: {product.code}</p>
                      )}
                    </div>
                    <Package className="h-6 w-6 text-indigo-600" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {product.description && (
                    <p className="text-sm text-gray-600">{product.description}</p>
                  )}
                  <div className="text-sm text-gray-600">
                    <span className="font-medium text-gray-700">Program:</span>{' '}
                    {product.expand?.program_relation?.name || '-'}
                  </div>
                  {typeof product.base_price === 'number' && (
                    <div className="text-sm text-gray-700">
                      <span className="font-medium text-gray-700">Base Price:</span>{' '}
                      {formatCurrency(product.base_price)}
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(product)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(product)}>
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
            <DialogTitle>{editingProduct ? 'Edit Product' : 'New Product'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">Product Name</Label>
              <Input
                id="product-name"
                value={formData.name}
                onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                placeholder="Product name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-code">Product Code</Label>
              <Input
                id="product-code"
                value={formData.code}
                onChange={(event) => setFormData({ ...formData, code: event.target.value })}
                placeholder="PRD-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-description">Description</Label>
              <textarea
                id="product-description"
                value={formData.description}
                onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                placeholder="Short description"
                className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            <div className="space-y-2">
              <Label htmlFor="product-price">Base Price</Label>
              <Input
                id="product-price"
                type="number"
                min="0"
                step="1"
                value={formData.base_price}
                onChange={(event) => setFormData({ ...formData, base_price: event.target.value })}
                placeholder="1000000"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingProduct ? 'Save Changes' : 'Create Product'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
