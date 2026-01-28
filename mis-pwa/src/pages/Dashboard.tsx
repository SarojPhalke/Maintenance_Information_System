import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { mockDashboardStats } from '@/lib/mockData';
import {
  Server,
  Calendar,
  Wrench,
  Package,
  Gauge,
  BarChart3,
  PieChart,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModuleCard {
  title: string;
  path: string;
  icon: React.ElementType;
  value: number | string;
  subtitle: string;
  color: string;
  iconBg: string;
  permission?: string;
}

export default function Dashboard() {
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();
  const stats = mockDashboardStats;

  const moduleCards: ModuleCard[] = [
    {
      title: 'Assets Register',
      path: '/assets',
      icon: Server,
      value: stats.totalAssets,
      subtitle: `${stats.activeAssets} active`,
      color: 'text-module-assets',
      iconBg: 'bg-module-assets/20',
      permission: 'view_assets',
    },
    {
      title: 'Preventive Maintenance',
      path: '/pm',
      icon: Calendar,
      value: stats.pendingPM,
      subtitle: stats.overduePM > 0 ? `${stats.overduePM} overdue` : 'All on schedule',
      color: 'text-module-pm',
      iconBg: 'bg-module-pm/20',
      permission: 'view_pm',
    },
    {
      title: 'Breakdown Maintenance',
      path: '/breakdowns',
      icon: Wrench,
      value: stats.openBreakdowns,
      subtitle: stats.criticalBreakdowns > 0 ? `${stats.criticalBreakdowns} critical` : 'No critical issues',
      color: 'text-module-breakdown',
      iconBg: 'bg-module-breakdown/20',
      permission: 'view_breakdowns',
    },
    {
      title: 'Spare Inventory',
      path: '/spares',
      icon: Package,
      value: stats.totalSpares,
      subtitle: stats.lowStockItems > 0 ? `${stats.lowStockItems} low stock` : 'Stock levels OK',
      color: 'text-module-spares',
      iconBg: 'bg-module-spares/20',
      permission: 'view_spares',
    },
    {
      title: 'Utilities Monitoring',
      path: '/utilities',
      icon: Gauge,
      value: stats.activeMeters,
      subtitle: 'Active meters',
      color: 'text-module-utilities',
      iconBg: 'bg-module-utilities/20',
      permission: 'view_utilities',
    },
    {
      title: 'KPI Monitoring',
      path: '/kpi',
      icon: BarChart3,
      value: stats.kpiAlerts,
      subtitle: 'This quarter',
      color: 'text-module-kpi',
      iconBg: 'bg-module-kpi/20',
      permission: 'view_kpi',
    },
    {
      title: 'Analytics',
      path: '/analytics',
      icon: PieChart,
      value: '—',
      subtitle: 'Coming soon',
      color: 'text-module-analytics',
      iconBg: 'bg-module-analytics/20',
      permission: 'view_analytics',
    },
  ];

  const filteredModules = moduleCards.filter(
    card => !card.permission || hasPermission(card.permission)
  );

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">
          Welcome back, {user?.name}! Here's an overview of your maintenance operations.
        </p>
      </div>

      {/* Quick Stats for Manager/Admin */}
      {hasPermission('view_kpi') && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <QuickStat
            icon={CheckCircle}
            label="System Uptime"
            value="94.5%"
            trend="+2.3%"
            trendUp
          />
          <QuickStat
            icon={TrendingUp}
            label="MTBF"
            value="168h"
            trend="+12h"
            trendUp
          />
          <QuickStat
            icon={Wrench}
            label="MTTR"
            value="2.5h"
            trend="-0.5h"
            trendUp
          />
          <QuickStat
            icon={AlertTriangle}
            label="Open Issues"
            value={stats.openBreakdowns.toString()}
            trend={stats.criticalBreakdowns > 0 ? `${stats.criticalBreakdowns} critical` : 'None critical'}
            trendUp={stats.criticalBreakdowns === 0}
          />
        </div>
      )}

      {/* Module Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredModules.map(card => (
          <ModuleCardComponent key={card.path} {...card} onClick={() => navigate(card.path)} />
        ))}
      </div>

      {/* Alerts Section */}
      {(stats.overduePM > 0 || stats.criticalBreakdowns > 0 || stats.lowStockItems > 0) && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-3">Alerts</h2>
          <div className="space-y-2">
            {stats.overduePM > 0 && (
              <AlertBanner
                type="warning"
                message={`${stats.overduePM} preventive maintenance tasks are overdue`}
                action="View PM"
                onAction={() => navigate('/pm')}
              />
            )}
            {stats.criticalBreakdowns > 0 && (
              <AlertBanner
                type="critical"
                message={`${stats.criticalBreakdowns} critical breakdowns require immediate attention`}
                action="View Breakdowns"
                onAction={() => navigate('/breakdowns')}
              />
            )}
            {stats.lowStockItems > 0 && (
              <AlertBanner
                type="info"
                message={`${stats.lowStockItems} spare parts are below reorder level`}
                action="View Inventory"
                onAction={() => navigate('/spares')}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ModuleCardComponent({
  title,
  icon: Icon,
  value,
  subtitle,
  color,
  iconBg,
  onClick,
}: ModuleCard & { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="module-card text-left w-full group"
    >
      <div className="flex items-start justify-between">
        <div className={cn('p-2.5 rounded-lg', iconBg)}>
          <Icon className={cn('h-5 w-5', color)} />
        </div>
        <span className={cn('text-2xl lg:text-3xl font-bold', color)}>
          {value}
        </span>
      </div>
      <div className="mt-3">
        <h3 className="font-medium text-sm group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
    </button>
  );
}

function QuickStat({
  icon: Icon,
  label,
  value,
  trend,
  trendUp,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
}) {
  return (
    <div className="stat-card">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-xl font-bold">{value}</div>
      <div
        className={cn(
          'text-xs mt-1',
          trendUp ? 'text-success' : 'text-destructive'
        )}
      >
        {trend}
      </div>
    </div>
  );
}

function AlertBanner({
  type,
  message,
  action,
  onAction,
}: {
  type: 'warning' | 'critical' | 'info';
  message: string;
  action: string;
  onAction: () => void;
}) {
  const colors = {
    warning: 'bg-warning/10 border-warning/30 text-warning',
    critical: 'bg-destructive/10 border-destructive/30 text-destructive',
    info: 'bg-info/10 border-info/30 text-info',
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 rounded-lg border',
        colors[type]
      )}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        <span className="text-sm">{message}</span>
      </div>
      <button
        onClick={onAction}
        className="text-xs font-medium underline-offset-2 hover:underline"
      >
        {action}
      </button>
    </div>
  );
}
