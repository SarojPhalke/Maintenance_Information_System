import { mockKPIMetrics } from '@/lib/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function KPIPage() {
  const metrics = mockKPIMetrics;

  const kpiCards: Array<{
    title: string;
    subtitle: string;
    value: string;
    target: string;
    status: 'good' | 'warning' | 'critical';
    icon: React.ElementType;
    trend: string;
    trendUp: boolean;
  }> = [
    {
      title: 'MTTR',
      subtitle: 'Mean Time To Repair',
      value: `${metrics.mttr} hrs`,
      target: '< 3 hrs',
      status: metrics.mttr < 3 ? 'good' : metrics.mttr < 4 ? 'warning' : 'critical',
      icon: Clock,
      trend: '-0.5h',
      trendUp: true,
    },
    {
      title: 'MTBF',
      subtitle: 'Mean Time Between Failures',
      value: `${metrics.mtbf} hrs`,
      target: '> 150 hrs',
      status: metrics.mtbf > 150 ? 'good' : metrics.mtbf > 100 ? 'warning' : 'critical',
      icon: Activity,
      trend: '+12h',
      trendUp: true,
    },
    {
      title: 'Uptime',
      subtitle: 'System Availability',
      value: `${metrics.uptime}%`,
      target: '> 95%',
      status: metrics.uptime > 95 ? 'good' : metrics.uptime > 90 ? 'warning' : 'critical',
      icon: TrendingUp,
      trend: '+2.3%',
      trendUp: true,
    },
    {
      title: 'OEE',
      subtitle: 'Overall Equipment Effectiveness',
      value: `${metrics.oee}%`,
      target: '> 85%',
      status: metrics.oee > 85 ? 'good' : metrics.oee > 75 ? 'warning' : 'critical',
      icon: Target,
      trend: '+1.8%',
      trendUp: true,
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">KPI Monitoring</h1>
        <p className="page-description">
          Track MTTR, MTBF, uptime, and equipment effectiveness metrics
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpiCards.map(kpi => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* Downtime Analysis */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Downtime Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Planned Downtime</span>
                <span className="font-medium">{metrics.plannedDowntime} hrs</span>
              </div>
              <Progress value={(metrics.plannedDowntime / 24) * 100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Unplanned Downtime</span>
                <span className="font-medium text-destructive">{metrics.unplannedDowntime} hrs</span>
              </div>
              <Progress
                value={(metrics.unplannedDowntime / 24) * 100}
                className="h-2 [&>div]:bg-destructive"
              />
            </div>
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Downtime</span>
                <span className="font-bold">
                  {metrics.plannedDowntime + metrics.unplannedDowntime} hrs
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <SummaryItem
                icon={CheckCircle}
                label="Availability"
                value={`${((168 - metrics.plannedDowntime - metrics.unplannedDowntime) / 168 * 100).toFixed(1)}%`}
                status="good"
              />
              <SummaryItem
                icon={Activity}
                label="Performance Rate"
                value="92.5%"
                status="good"
              />
              <SummaryItem
                icon={Target}
                label="Quality Rate"
                value="98.2%"
                status="good"
              />
              <SummaryItem
                icon={AlertTriangle}
                label="Breakdown Incidents"
                value="3 this week"
                status="warning"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Status */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">IATF 16949 / VDA 6.3 Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ComplianceItem title="PM Completion Rate" value="94%" target="100%" status="warning" />
            <ComplianceItem title="Calibration Status" value="100%" target="100%" status="good" />
            <ComplianceItem title="Documentation" value="98%" target="100%" status="good" />
            <ComplianceItem title="Audit Findings" value="2 open" target="0" status="warning" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KPICard({
  title,
  subtitle,
  value,
  target,
  status,
  icon: Icon,
  trend,
  trendUp,
}: {
  title: string;
  subtitle: string;
  value: string;
  target: string;
  status: 'good' | 'warning' | 'critical';
  icon: React.ElementType;
  trend: string;
  trendUp: boolean;
}) {
  const statusColors = {
    good: 'text-success',
    warning: 'text-warning',
    critical: 'text-destructive',
  };

  const bgColors = {
    good: 'bg-success/10',
    warning: 'bg-warning/10',
    critical: 'bg-destructive/10',
  };

  return (
    <Card className={cn('border-l-4', {
      'border-l-success': status === 'good',
      'border-l-warning': status === 'warning',
      'border-l-destructive': status === 'critical',
    })}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-2">
          <div className={cn('p-2 rounded-lg', bgColors[status])}>
            <Icon className={cn('h-4 w-4', statusColors[status])} />
          </div>
          <div className={cn('flex items-center gap-1 text-xs', trendUp ? 'text-success' : 'text-destructive')}>
            {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend}
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-2xl">{value}</h3>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Target</span>
            <span>{target}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryItem({
  icon: Icon,
  label,
  value,
  status,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  status: 'good' | 'warning' | 'critical';
}) {
  const colors = {
    good: 'text-success',
    warning: 'text-warning',
    critical: 'text-destructive',
  };

  return (
    <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
      <div className="flex items-center gap-3">
        <Icon className={cn('h-4 w-4', colors[status])} />
        <span className="text-sm">{label}</span>
      </div>
      <span className={cn('font-medium', colors[status])}>{value}</span>
    </div>
  );
}

function ComplianceItem({
  title,
  value,
  target,
  status,
}: {
  title: string;
  value: string;
  target: string;
  status: 'good' | 'warning';
}) {
  return (
    <div className={cn(
      'p-4 rounded-lg border',
      status === 'good' ? 'bg-success/5 border-success/20' : 'bg-warning/5 border-warning/20'
    )}>
      <div className="text-sm text-muted-foreground mb-1">{title}</div>
      <div className={cn('text-xl font-bold', status === 'good' ? 'text-success' : 'text-warning')}>
        {value}
      </div>
      <div className="text-xs text-muted-foreground mt-1">Target: {target}</div>
    </div>
  );
}
