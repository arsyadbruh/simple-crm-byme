'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Navigation } from '@/components/navigation';
import pb, { Collections } from '@/lib/pocketbase';
import type { ForecastsExpanded, GlobalTargetsRecord } from '@/lib/pocketbase-types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, TrendingUp, TrendingDown, DollarSign, Building2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface DashboardMetrics {
  globalTarget: number;
  totalForecast: number;
  realizedRevenue: number;
  forecastCount: number;
  institutionCount: number;
}

interface MonthlyData {
  month: string;
  target: number;
  actual: number;
}

interface ProgramSegment {
  name: string;
  revenue: number;
  color: string;
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    globalTarget: 0,
    totalForecast: 0,
    realizedRevenue: 0,
    forecastCount: 0,
    institutionCount: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [programSegments, setProgramSegments] = useState<ProgramSegment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Get current month/year
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      // Fetch global target for current month
      const globalTargetFilter = `year = ${currentYear} && month = ${currentMonth}`;
      const globalTargets = await pb.collection(Collections.GlobalTargets).getList<GlobalTargetsRecord>(1, 1, {
        filter: globalTargetFilter,
      });
      const globalTarget = globalTargets.items[0]?.target_revenue || 0;

      // Fetch all forecasts with expand
      const forecasts = await pb.collection(Collections.Forecasts).getFullList<ForecastsExpanded>({
        expand: 'target_program',
      });

      // Calculate total forecast (Cold + Warm + Hot + Closing)
      const totalForecast = forecasts
        .filter(f => f.status && ['Cold', 'Warm', 'Hot', 'Closing'].includes(f.status))
        .reduce((sum, f) => sum + (f.target_omset || 0), 0);

      // Calculate realized revenue (Closing status with fix_omset)
      const realizedRevenue = forecasts
        .filter(f => f.status === 'Closing' && f.fix_omset)
        .reduce((sum, f) => sum + (f.fix_omset || 0), 0);

      // Count active forecasts (exclude Cancelled)
      const forecastCount = forecasts.filter(f => f.status !== 'Cancel').length;

      // Count institutions
      const institutions = await pb.collection(Collections.Institutions).getList(1, 1);
      const institutionCount = institutions.totalItems;

      setMetrics({
        globalTarget,
        totalForecast,
        realizedRevenue,
        forecastCount,
        institutionCount,
      });

      // Prepare monthly data (last 6 months)
      const monthlyChartData: MonthlyData[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(currentYear, currentMonth - 1 - i, 1);
        const month = d.getMonth() + 1;
        const year = d.getFullYear();
        const monthStr = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

        // Get target for this month
        const targetFilter = `year = ${year} && month = ${month}`;
        const targets = await pb.collection(Collections.GlobalTargets).getList<GlobalTargetsRecord>(1, 1, {
          filter: targetFilter,
        });
        const target = targets.items[0]?.target_revenue || 0;

        // Get actual revenue for this month
        const monthForecasts = forecasts.filter(f => {
          if (f.status !== 'Closing' || !f.closing_date || !f.fix_omset) return false;
          const closingDate = new Date(f.closing_date);
          return closingDate.getMonth() + 1 === month && closingDate.getFullYear() === year;
        });
        const actual = monthForecasts.reduce((sum, f) => sum + (f.fix_omset || 0), 0);

        monthlyChartData.push({ month: monthStr, target, actual });
      }
      setMonthlyData(monthlyChartData);

      // Prepare program segments (revenue distribution)
      const programMap = new Map<string, number>();
      forecasts
        .filter(f => f.status === 'Closing' && f.fix_omset)
        .forEach(f => {
          const programName = f.expand?.target_program?.name || 'Unknown';
          const revenue = f.fix_omset || 0;
          programMap.set(programName, (programMap.get(programName) || 0) + revenue);
        });

      const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
      const segments: ProgramSegment[] = Array.from(programMap.entries())
        .map(([name, revenue], index) => ({
          name,
          revenue,
          color: colors[index % colors.length],
        }))
        .sort((a, b) => b.revenue - a.revenue);

      setProgramSegments(segments);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
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

  const achievementRate = metrics.globalTarget > 0
    ? (metrics.realizedRevenue / metrics.globalTarget) * 100
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Command Center - Account-Based Forecasting Overview</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Global Target</CardTitle>
                  <Target className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(metrics.globalTarget)}</div>
                  <p className="text-xs text-gray-500 mt-1">This Month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Forecast</CardTitle>
                  <TrendingUp className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(metrics.totalForecast)}</div>
                  <p className="text-xs text-gray-500 mt-1">{metrics.forecastCount} Active Deals</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Realized Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(metrics.realizedRevenue)}</div>
                  <p className="text-xs text-gray-500 mt-1">Closed Won</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Achievement</CardTitle>
                  {achievementRate >= 100 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {achievementRate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {achievementRate >= 100 ? 'Target Met! 🎉' : 'vs Global Target'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Monthly Target vs Actual Chart */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Monthly Target vs Actual</CardTitle>
                  <CardDescription>Performance over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => formatCurrency(value as number)}
                      />
                      <Legend />
                      <Bar dataKey="target" fill="#6366f1" name="Target" />
                      <Bar dataKey="actual" fill="#10b981" name="Actual" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Program Segments */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Program</CardTitle>
                  <CardDescription>Distribution of closed deals</CardDescription>
                </CardHeader>
                <CardContent>
                  {programSegments.length > 0 ? (
                    <div className="space-y-4">
                      {programSegments.map((segment) => (
                        <div key={segment.name}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{segment.name}</span>
                            <span className="text-sm text-gray-600">
                              {formatCurrency(segment.revenue)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all"
                              style={{
                                width: `${(segment.revenue / metrics.realizedRevenue) * 100}%`,
                                backgroundColor: segment.color,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      No closed deals yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <Building2 className="h-8 w-8 mx-auto text-indigo-600 mb-2" />
                    <div className="text-2xl font-bold">{metrics.institutionCount}</div>
                    <div className="text-sm text-gray-600">Institutions</div>
                  </div>
                  <div className="text-center">
                    <Target className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
                    <div className="text-2xl font-bold">{metrics.forecastCount}</div>
                    <div className="text-sm text-gray-600">Active Forecasts</div>
                  </div>
                  <div className="text-center">
                    <DollarSign className="h-8 w-8 mx-auto text-green-600 mb-2" />
                    <div className="text-2xl font-bold">
                      {formatCurrency(metrics.totalForecast + metrics.realizedRevenue)}
                    </div>
                    <div className="text-sm text-gray-600">Total Pipeline</div>
                  </div>
                  <div className="text-center">
                    <TrendingUp className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                    <div className="text-2xl font-bold">
                      {metrics.forecastCount > 0
                        ? formatCurrency(metrics.totalForecast / metrics.forecastCount)
                        : formatCurrency(0)}
                    </div>
                    <div className="text-sm text-gray-600">Avg Deal Size</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
