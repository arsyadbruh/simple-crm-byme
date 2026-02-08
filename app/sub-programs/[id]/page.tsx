'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Navigation } from '@/components/navigation';
import pb, { Collections } from '@/lib/pocketbase';
import type {
  ForecastsExpanded,
  ForecastStatus,
  ProgramsRecord,
  SubProgramsExpanded,
  SubProgramsRecord,
} from '@/lib/pocketbase-types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2, FolderTree, Layers, Target } from 'lucide-react';

export default function SubProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [subProgram, setSubProgram] = useState<SubProgramsExpanded | null>(null);
  const [program, setProgram] = useState<ProgramsRecord | null>(null);
  const [siblings, setSiblings] = useState<SubProgramsRecord[]>([]);
  const [forecasts, setForecasts] = useState<ForecastsExpanded[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && params.id) {
      loadSubProgramData();
    }
  }, [user, params.id]);

  const loadSubProgramData = async () => {
    try {
      setLoading(true);
      const subProgramId = params.id as string;
      const subProgramRecord = await pb
        .collection(Collections.SubPrograms)
        .getOne<SubProgramsExpanded>(subProgramId, { expand: 'program_relation' });

      setSubProgram(subProgramRecord);
      setProgram(subProgramRecord.expand?.program_relation || null);

      if (subProgramRecord.program_relation) {
        const siblingRecords = await pb
          .collection(Collections.SubPrograms)
          .getFullList<SubProgramsRecord>({
            filter: `program_relation = '${subProgramRecord.program_relation}'`,
            sort: 'name',
          });
        setSiblings(siblingRecords);
      } else {
        setSiblings([]);
      }

      const forecastRecords = await pb
        .collection(Collections.Forecasts)
        .getFullList<ForecastsExpanded>({
          filter: `target_sub_program = '${subProgramId}'`,
          expand: 'institution,pic',
          sort: '-created',
        });
      setForecasts(forecastRecords);
    } catch (error) {
      console.error('Failed to load sub program data:', error);
    } finally {
      setLoading(false);
    }
  };

  const siblingList = useMemo(
    () => siblings.filter((item) => item.id !== subProgram?.id),
    [siblings, subProgram?.id]
  );

  const closingForecasts = useMemo(
    () => forecasts.filter((forecast) => forecast.status === 'Closing'),
    [forecasts]
  );

  const institutionStats = useMemo(() => {
    const stats = new Map<
      string,
      {
        id: string;
        name: string;
        count: number;
      }
    >();

    forecasts.forEach((forecast) => {
      const institution = forecast.expand?.institution;
      if (!institution) return;
      const current = stats.get(institution.id);
      if (current) {
        current.count += 1;
      } else {
        stats.set(institution.id, {
          id: institution.id,
          name: institution.name || 'Unnamed Institution',
          count: 1,
        });
      }
    });

    return Array.from(stats.values()).sort((a, b) => b.count - a.count);
  }, [forecasts]);

  if (isLoading || !user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!subProgram) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sub program not found</h3>
              <Button onClick={() => router.push('/sub-programs')}>Back to Sub Programs</Button>
            </CardContent>
          </Card>
        </main>
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

  const formatDate = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('id-ID');
  };

  const getStatusColor = (status?: ForecastStatus) => {
    const colors: Record<ForecastStatus, string> = {
      Cold: 'bg-gray-100 text-gray-800',
      Warm: 'bg-blue-100 text-blue-800',
      Hot: 'bg-yellow-100 text-yellow-800',
      Closing: 'bg-green-100 text-green-800',
      Cancel: 'bg-red-100 text-red-800',
    };
    if (!status) return 'bg-gray-100 text-gray-800';
    return colors[status];
  };

  const totalTarget = forecasts.reduce((sum, forecast) => sum + (forecast.target_omset || 0), 0);
  const totalClosed = closingForecasts.reduce(
    (sum, forecast) => sum + (forecast.fix_omset || forecast.target_omset || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                <FolderTree className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {subProgram.name || 'Untitled Sub Program'}
                </h1>
                <div className="flex items-center gap-2 mt-2">
                  {subProgram.code && <Badge variant="outline">{subProgram.code}</Badge>}
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={() => router.push('/sub-programs')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sub Programs
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-indigo-600" />
                <div>
                  <p className="text-sm text-gray-500">Forecasts</p>
                  <p className="text-xl font-semibold text-gray-900">{forecasts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-sm text-gray-500">Closed Deals</p>
                  <p className="text-xl font-semibold text-gray-900">{closingForecasts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-sm text-gray-500">Closed Revenue</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {formatCurrency(totalClosed)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-indigo-600" />
                <div>
                  <p className="text-sm text-gray-500">Total Target</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {formatCurrency(totalTarget)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Parent Program</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {program ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <Layers className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {program.name || 'Untitled Program'}
                        </p>
                        {program.code && <p className="text-sm text-gray-500">{program.code}</p>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {program.segments?.map((segment) => (
                        <Badge key={segment} variant="secondary">
                          {segment}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => router.push(`/programs/${program.id}`)}
                    >
                      View Program Report
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">No program linked to this sub program.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Other Sub Programs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {siblingList.length === 0 ? (
                  <p className="text-sm text-gray-500">No other sub programs in this program.</p>
                ) : (
                  siblingList.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">
                        {item.name || 'Untitled Sub Program'}
                      </span>
                      {item.code && <Badge variant="outline">{item.code}</Badge>}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Forecast Targets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {institutionStats.length === 0 ? (
                  <p className="text-sm text-gray-500">No forecasts recorded for this sub program.</p>
                ) : (
                  institutionStats.map((institution) => (
                    <div key={institution.id} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{institution.name}</span>
                      <Badge variant="secondary">{institution.count} forecast(s)</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Closing History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {closingForecasts.length === 0 ? (
                  <p className="text-sm text-gray-500">No closed forecasts yet.</p>
                ) : (
                  closingForecasts.map((forecast) => (
                    <div key={forecast.id} className="rounded-md border border-gray-200 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {forecast.target_proposal || '(No Title)'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {forecast.expand?.institution?.name || 'Unknown Institution'}
                          </p>
                        </div>
                        <Badge className={getStatusColor(forecast.status)}>
                          {forecast.status || 'Closing'}
                        </Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium text-gray-700">Closed Value:</span>{' '}
                          {formatCurrency(forecast.fix_omset || forecast.target_omset || 0)}
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Closing Date:</span>{' '}
                          {formatDate(forecast.closing_date)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>All Forecasts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {forecasts.length === 0 ? (
              <p className="text-sm text-gray-500">No forecasts available for this sub program.</p>
            ) : (
              forecasts.map((forecast) => (
                <div
                  key={forecast.id}
                  className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-none last:pb-0"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {forecast.target_proposal || '(No Title)'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {forecast.expand?.institution?.name || 'Unknown Institution'}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(forecast.status)}>
                      {forecast.status || 'Cold'}
                    </Badge>
                    <p className="mt-1 text-sm text-gray-600">
                      {formatCurrency(forecast.target_omset || 0)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
