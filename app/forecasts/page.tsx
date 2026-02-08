'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Navigation } from '@/components/navigation';
import pb, { Collections } from '@/lib/pocketbase';
import type {
  ForecastsExpanded,
  ForecastStatus,
  ProgramsRecord,
  SubProgramsRecord,
  ProductsRecord,
  InstitutionsRecord,
} from '@/lib/pocketbase-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Target, Filter } from 'lucide-react';
import { ForecastFormDialog } from '@/components/forecast-form-dialog';
import { CloseForecastDialog } from '@/components/close-forecast-dialog';

export default function ForecastsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [forecasts, setForecasts] = useState<ForecastsExpanded[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [editingForecast, setEditingForecast] = useState<ForecastsExpanded | null>(null);
  const [closingForecast, setClosingForecast] = useState<ForecastsExpanded | null>(null);
  const [statusFilter, setStatusFilter] = useState<ForecastStatus | 'All'>('All');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      loadForecasts();
    }
  }, [user, statusFilter]);

  const loadForecasts = async () => {
    try {
      setLoading(true);
      
      const filter = statusFilter !== 'All' ? `status = '${statusFilter}'` : '';
      
      const records = await pb.collection(Collections.Forecasts).getFullList<ForecastsExpanded>({
        filter,
        expand: 'user_id,institution_id,program_id,sub_program_id,product_id',
        sort: '-created',
      });

      setForecasts(records);
    } catch (error) {
      console.error('Failed to load forecasts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (forecast: ForecastsExpanded) => {
    setEditingForecast(forecast);
    setIsFormOpen(true);
  };

  const handleClose = (forecast: ForecastsExpanded) => {
    setClosingForecast(forecast);
    setIsCloseDialogOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingForecast(null);
    loadForecasts();
  };

  const handleCloseDialogClose = () => {
    setIsCloseDialogOpen(false);
    setClosingForecast(null);
    loadForecasts();
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

  const getStatusColor = (status: ForecastStatus) => {
    const colors: Record<ForecastStatus, string> = {
      Cold: 'bg-gray-100 text-gray-800',
      Warm: 'bg-blue-100 text-blue-800',
      Hot: 'bg-yellow-100 text-yellow-800',
      Closing: 'bg-green-100 text-green-800',
      Cancel: 'bg-red-100 text-red-800',
    };
    return colors[status];
  };

  const statuses: (ForecastStatus | 'All')[] = ['All', 'Cold', 'Warm', 'Hot', 'Closing', 'Cancel'];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Forecasts</h1>
            <p className="text-gray-600 mt-2">Manage your sales forecasts and deals</p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Forecast
          </Button>
        </div>

        {/* Status Filter */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter by Status:</span>
              {statuses.map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {status}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : forecasts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No forecasts found</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first forecast</p>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Forecast
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {forecasts.map((forecast) => (
              <Card key={forecast.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {forecast.target_proposal || '(No Title)'}
                        </h3>
                        <Badge className={getStatusColor(forecast.status || 'Cold')}>
                          {forecast.status || 'Cold'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-gray-500">Institution</p>
                          <p className="font-medium">
                            {forecast.expand?.institution?.name || '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Program</p>
                          <p className="font-medium">
                            {forecast.expand?.target_program?.name || '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Target Month</p>
                          <p className="font-medium">{forecast.target_month}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Target Amount</p>
                          <p className="font-medium text-blue-600">
                            {formatCurrency(forecast.target_omset || 0)}
                          </p>
                        </div>
                      </div>

                      {forecast.fix_omset && (
                        <div className="mt-3 bg-green-50 p-3 rounded-md">
                          <p className="text-sm text-green-700">
                            <span className="font-semibold">Actual Revenue:</span>{' '}
                            {formatCurrency(forecast.fix_omset)}
                          </p>
                          {forecast.closing_date && (
                            <p className="text-sm text-green-600 mt-1">
                              Closed on {new Date(forecast.closing_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(forecast)}
                      >
                        Edit
                      </Button>
                      {forecast.status && !['Closing', 'Cancel'].includes(forecast.status) && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleClose(forecast)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Close Deal
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <ForecastFormDialog
        open={isFormOpen}
        onClose={handleFormClose}
        forecast={editingForecast}
      />
      
      <CloseForecastDialog
        open={isCloseDialogOpen}
        onClose={handleCloseDialogClose}
        forecast={closingForecast}
      />
    </div>
  );
}
