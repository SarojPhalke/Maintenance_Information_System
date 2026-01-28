import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { mockBreakdowns, mockAssets } from '@/lib/mockData';
import type { Breakdown, BreakdownStatus, BreakdownPriority } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  Filter,
  Download,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const statusColors: Record<BreakdownStatus, string> = {
  open: 'bg-destructive/20 text-destructive',
  acknowledged: 'bg-warning/20 text-warning',
  in_progress: 'bg-info/20 text-info',
  resolved: 'bg-success/20 text-success',
  closed: 'bg-muted text-muted-foreground',
};

const priorityColors: Record<BreakdownPriority, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-warning/20 text-warning',
  high: 'bg-destructive/20 text-destructive',
  critical: 'bg-destructive text-destructive-foreground',
};

export default function BreakdownsPage() {
  const { user, hasPermission, hasRole } = useAuth();
  const [breakdowns, setBreakdowns] = useState<Breakdown[]>(mockBreakdowns);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBreakdown, setSelectedBreakdown] = useState<Breakdown | null>(null);
  const [engineerDialogOpen, setEngineerDialogOpen] = useState(false);

  const filteredBreakdowns = breakdowns.filter(bd => {
    const matchesSearch =
      bd.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bd.issue.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || bd.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    open: breakdowns.filter(b => b.status === 'open').length,
    inProgress: breakdowns.filter(b => ['acknowledged', 'in_progress'].includes(b.status)).length,
    critical: breakdowns.filter(b => b.priority === 'critical' && b.status !== 'closed').length,
    resolved: breakdowns.filter(b => ['resolved', 'closed'].includes(b.status)).length,
  };

  const handleCreateBreakdown = (data: Partial<Breakdown>) => {
    const newBreakdown: Breakdown = {
      id: Date.now().toString(),
      assetId: data.assetId || '',
      assetName: mockAssets.find(a => a.id === data.assetId)?.assetName || '',
      entryDate: new Date().toISOString().split('T')[0],
      entryTime: new Date().toTimeString().slice(0, 5),
      businessUnit: data.businessUnit || '',
      operatorId: user?.id || '',
      operatorName: user?.name || '',
      issue: data.issue || '',
      status: 'open',
      priority: data.priority || 'medium',
    };
    setBreakdowns(prev => [newBreakdown, ...prev]);
    setIsDialogOpen(false);
  };

  const handleEngineerUpdate = (data: Partial<Breakdown>) => {
    if (!selectedBreakdown) return;
    setBreakdowns(prev =>
      prev.map(bd =>
        bd.id === selectedBreakdown.id
          ? {
              ...bd,
              ...data,
              status: data.status || bd.status,
            }
          : bd
      )
    );
    setEngineerDialogOpen(false);
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Breakdown Maintenance</h1>
          <p className="page-description">
            Track and resolve unplanned downtime quickly
          </p>
        </div>
        <div className="flex gap-2">
          {hasPermission('create_breakdown') && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Log Breakdown
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Log New Breakdown</DialogTitle>
                </DialogHeader>
                <BreakdownForm
                  onSave={handleCreateBreakdown}
                  onCancel={() => setIsDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={AlertCircle} label="Open" value={stats.open} variant="destructive" />
        <StatCard icon={Clock} label="In Progress" value={stats.inProgress} variant="warning" />
        <StatCard icon={XCircle} label="Critical" value={stats.critical} variant="critical" />
        <StatCard icon={CheckCircle} label="Resolved" value={stats.resolved} variant="success" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search breakdowns..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="acknowledged">Acknowledged</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead className="bg-secondary/50">
              <tr>
                <th>ID</th>
                <th>Date/Time</th>
                <th>Asset</th>
                <th className="hidden md:table-cell">Issue</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBreakdowns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    No breakdowns found.
                  </td>
                </tr>
              ) : (
                filteredBreakdowns.map(bd => (
                  <tr key={bd.id}>
                    <td className="font-mono text-xs">{bd.id}</td>
                    <td className="whitespace-nowrap">
                      <div>{bd.entryDate}</div>
                      <div className="text-xs text-muted-foreground">{bd.entryTime}</div>
                    </td>
                    <td>
                      <div className="font-medium">{bd.assetName}</div>
                      <div className="text-xs text-muted-foreground">{bd.businessUnit}</div>
                    </td>
                    <td className="hidden md:table-cell max-w-xs truncate">
                      {bd.issue}
                    </td>
                    <td>
                      <Badge className={cn('status-badge', priorityColors[bd.priority])}>
                        {bd.priority}
                      </Badge>
                    </td>
                    <td>
                      <Badge className={cn('status-badge', statusColors[bd.status])}>
                        {bd.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td>
                      {hasRole(['engineer', 'admin']) && bd.status !== 'closed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBreakdown(bd);
                            setEngineerDialogOpen(true);
                          }}
                        >
                          Update
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Engineer Update Dialog */}
      <Dialog open={engineerDialogOpen} onOpenChange={setEngineerDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Engineer Update</DialogTitle>
          </DialogHeader>
          {selectedBreakdown && (
            <EngineerUpdateForm
              breakdown={selectedBreakdown}
              onSave={handleEngineerUpdate}
              onCancel={() => setEngineerDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  variant,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  variant: 'destructive' | 'warning' | 'critical' | 'success';
}) {
  const colors = {
    destructive: 'text-destructive',
    warning: 'text-warning',
    critical: 'text-destructive',
    success: 'text-success',
  };

  return (
    <div className="stat-card">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
      </div>
      <span className={cn('text-2xl font-bold', colors[variant])}>{value}</span>
    </div>
  );
}

function BreakdownForm({
  onSave,
  onCancel,
}: {
  onSave: (data: Partial<Breakdown>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    assetId: '',
    businessUnit: '',
    issue: '',
    priority: 'medium' as BreakdownPriority,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="asset">Asset *</Label>
        <Select
          value={formData.assetId}
          onValueChange={value => setFormData({ ...formData, assetId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select asset" />
          </SelectTrigger>
          <SelectContent>
            {mockAssets.map(asset => (
              <SelectItem key={asset.id} value={asset.id}>
                {asset.assetCode} - {asset.assetName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessUnit">Business Unit</Label>
        <Input
          id="businessUnit"
          value={formData.businessUnit}
          onChange={e => setFormData({ ...formData, businessUnit: e.target.value })}
          placeholder="e.g., Machining, Press Shop"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="issue">Issue Description *</Label>
        <Textarea
          id="issue"
          value={formData.issue}
          onChange={e => setFormData({ ...formData, issue: e.target.value })}
          placeholder="Describe the breakdown issue..."
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="priority">Priority</Label>
        <Select
          value={formData.priority}
          onValueChange={value => setFormData({ ...formData, priority: value as BreakdownPriority })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" className="flex-1">
          Submit
        </Button>
      </div>
    </form>
  );
}

function EngineerUpdateForm({
  breakdown,
  onSave,
  onCancel,
}: {
  breakdown: Breakdown;
  onSave: (data: Partial<Breakdown>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    status: breakdown.status,
    engineerNotes: breakdown.engineerNotes || '',
    rootCause: breakdown.rootCause || '',
    actionTaken: breakdown.actionTaken || '',
    downtime: breakdown.downtime || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      resolvedDate: formData.status === 'resolved' ? new Date().toISOString().split('T')[0] : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 bg-secondary/50 rounded-lg space-y-1">
        <div className="text-sm font-medium">{breakdown.assetName}</div>
        <div className="text-sm text-muted-foreground">{breakdown.issue}</div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={formData.status}
          onValueChange={value => setFormData({ ...formData, status: value as BreakdownStatus })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="acknowledged">Acknowledged</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="engineerNotes">Engineer Notes</Label>
        <Textarea
          id="engineerNotes"
          value={formData.engineerNotes}
          onChange={e => setFormData({ ...formData, engineerNotes: e.target.value })}
          placeholder="Investigation findings..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="rootCause">Root Cause</Label>
        <Input
          id="rootCause"
          value={formData.rootCause}
          onChange={e => setFormData({ ...formData, rootCause: e.target.value })}
          placeholder="Identified root cause"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="actionTaken">Action Taken</Label>
        <Textarea
          id="actionTaken"
          value={formData.actionTaken}
          onChange={e => setFormData({ ...formData, actionTaken: e.target.value })}
          placeholder="Corrective actions performed..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="downtime">Downtime (minutes)</Label>
        <Input
          id="downtime"
          type="number"
          value={formData.downtime}
          onChange={e => setFormData({ ...formData, downtime: parseInt(e.target.value) || 0 })}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" className="flex-1">
          Update
        </Button>
      </div>
    </form>
  );
}
