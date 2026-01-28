import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { mockPMSchedules, mockAssets } from '@/lib/mockData';
import type { PreventiveMaintenance, PMStatus, PMFrequency, ChecklistItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Plus,
  Search,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Filter,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const statusColors: Record<PMStatus, string> = {
  scheduled: 'bg-info/20 text-info',
  in_progress: 'bg-warning/20 text-warning',
  completed: 'bg-success/20 text-success',
  overdue: 'bg-destructive/20 text-destructive',
};

const frequencyLabels: Record<PMFrequency, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

export default function PreventiveMaintenancePage() {
  const { hasPermission } = useAuth();
  const [schedules, setSchedules] = useState<PreventiveMaintenance[]>(mockPMSchedules);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPM, setSelectedPM] = useState<PreventiveMaintenance | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const filteredSchedules = schedules.filter(pm => {
    const matchesSearch =
      pm.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pm.assetName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || pm.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: schedules.length,
    scheduled: schedules.filter(p => p.status === 'scheduled').length,
    inProgress: schedules.filter(p => p.status === 'in_progress').length,
    overdue: schedules.filter(p => p.status === 'overdue').length,
  };

  const handleChecklistUpdate = (pmId: string, itemId: string, completed: boolean) => {
    setSchedules(prev =>
      prev.map(pm =>
        pm.id === pmId
          ? {
              ...pm,
              checklist: pm.checklist.map(item =>
                item.id === itemId ? { ...item, completed } : item
              ),
            }
          : pm
      )
    );
  };

  const handleCompletePM = (pmId: string) => {
    setSchedules(prev =>
      prev.map(pm =>
        pm.id === pmId
          ? {
              ...pm,
              status: 'completed' as PMStatus,
              completedDate: new Date().toISOString().split('T')[0],
            }
          : pm
      )
    );
    setViewDialogOpen(false);
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Preventive Maintenance</h1>
          <p className="page-description">
            Frequency-based scheduling with alerts and compliance tracking
          </p>
        </div>
        {hasPermission('create_pm') && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create PM Schedule</DialogTitle>
              </DialogHeader>
              <PMForm
                onSave={() => setIsDialogOpen(false)}
                onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Calendar} label="Total Scheduled" value={stats.total} />
        <StatCard icon={Clock} label="Pending" value={stats.scheduled} variant="info" />
        <StatCard icon={AlertTriangle} label="In Progress" value={stats.inProgress} variant="warning" />
        <StatCard icon={AlertTriangle} label="Overdue" value={stats.overdue} variant="destructive" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search schedules..."
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
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* PM Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredSchedules.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No maintenance schedules found.
          </div>
        ) : (
          filteredSchedules.map(pm => (
            <Card key={pm.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{pm.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{pm.assetName}</p>
                  </div>
                  <Badge className={cn('status-badge', statusColors[pm.status])}>
                    {pm.status.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Frequency</span>
                    <span>{frequencyLabels[pm.frequency]}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Due Date</span>
                    <span className={pm.status === 'overdue' ? 'text-destructive' : ''}>
                      {pm.scheduledDate}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Assigned To</span>
                    <span>{pm.assignedTo}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Checklist</span>
                    <span>
                      {pm.checklist.filter(c => c.completed).length}/{pm.checklist.length} complete
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => {
                      setSelectedPM(pm);
                      setViewDialogOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* View/Edit Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedPM?.title}</DialogTitle>
          </DialogHeader>
          {selectedPM && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Asset</Label>
                <p className="text-sm text-muted-foreground">{selectedPM.assetName}</p>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <p className="text-sm text-muted-foreground">{selectedPM.description}</p>
              </div>
              <div className="space-y-2">
                <Label>Checklist</Label>
                <div className="space-y-2 p-3 bg-secondary/50 rounded-lg">
                  {selectedPM.checklist.map(item => (
                    <div key={item.id} className="flex items-center gap-3">
                      <Checkbox
                        id={item.id}
                        checked={item.completed}
                        onCheckedChange={(checked) =>
                          handleChecklistUpdate(selectedPM.id, item.id, !!checked)
                        }
                        disabled={selectedPM.status === 'completed'}
                      />
                      <label
                        htmlFor={item.id}
                        className={cn(
                          'text-sm',
                          item.completed && 'line-through text-muted-foreground'
                        )}
                      >
                        {item.task}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              {selectedPM.status !== 'completed' && hasPermission('update_pm') && (
                <Button
                  className="w-full"
                  onClick={() => handleCompletePM(selectedPM.id)}
                  disabled={!selectedPM.checklist.every(c => c.completed)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Complete
                </Button>
              )}
            </div>
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
  variant = 'default',
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  variant?: 'default' | 'info' | 'warning' | 'destructive';
}) {
  const colors = {
    default: 'text-foreground',
    info: 'text-info',
    warning: 'text-warning',
    destructive: 'text-destructive',
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

function PMForm({
  onSave,
  onCancel,
}: {
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        onSave();
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="asset">Asset</Label>
        <Select>
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
        <Label htmlFor="title">Title</Label>
        <Input id="title" placeholder="e.g., Monthly Lubrication" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" placeholder="Describe the maintenance task..." />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="frequency">Frequency</Label>
          <Select defaultValue="monthly">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="scheduledDate">Start Date</Label>
          <Input id="scheduledDate" type="date" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="assignedTo">Assigned To</Label>
        <Input id="assignedTo" placeholder="Engineer name" />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" className="flex-1">
          Create Schedule
        </Button>
      </div>
    </form>
  );
}
