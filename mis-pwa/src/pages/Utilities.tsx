import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { mockUtilityLogs } from '@/lib/mockData';
import type { UtilityLog, UtilityType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Plus,
  Zap,
  Flame,
  Droplets,
  Wind,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const utilityConfig: Record<UtilityType, { icon: React.ElementType; label: string; color: string }> = {
  power: { icon: Zap, label: 'Power', color: 'text-yellow-500' },
  gas: { icon: Flame, label: 'Gas', color: 'text-orange-500' },
  water: { icon: Droplets, label: 'Water', color: 'text-blue-500' },
  compressed_air: { icon: Wind, label: 'Compressed Air', color: 'text-cyan-500' },
};

export default function UtilitiesPage() {
  const { hasPermission, user } = useAuth();
  const [logs, setLogs] = useState<UtilityLog[]>(mockUtilityLogs);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const latestReadings = Object.keys(utilityConfig).map(type => {
    const latestLog = logs
      .filter(l => l.utilityType === type)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0];
    return {
      type: type as UtilityType,
      ...utilityConfig[type as UtilityType],
      reading: latestLog?.readingValue || 0,
      unit: latestLog?.unit || '',
      samplePoint: latestLog?.samplePoint || '',
      recordedAt: latestLog?.recordedAt || '',
    };
  });

  const handleCreateLog = (data: Partial<UtilityLog>) => {
    const newLog: UtilityLog = {
      id: Date.now().toString(),
      utilityType: data.utilityType || 'power',
      readingValue: data.readingValue || 0,
      unit: data.unit || '',
      samplePoint: data.samplePoint || '',
      recordedAt: new Date().toISOString(),
      recordedBy: user?.name || '',
    };
    setLogs(prev => [newLog, ...prev]);
    setIsDialogOpen(false);
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Utilities Monitoring</h1>
          <p className="page-description">
            Monitor power, gas, and water usage across major systems
          </p>
        </div>
        {hasPermission('create_utilities') && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Log Reading
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log Utility Reading</DialogTitle>
              </DialogHeader>
              <UtilityForm
                onSave={handleCreateLog}
                onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Utility Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {latestReadings.map(utility => {
          const Icon = utility.icon;
          return (
            <Card key={utility.type} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className={cn('p-2 rounded-lg bg-secondary', utility.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <TrendingUp className="h-4 w-4 text-success" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <h3 className="font-medium text-sm">{utility.label}</h3>
                  <div className="text-2xl font-bold">
                    {utility.reading.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">{utility.unit}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{utility.samplePoint}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Readings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead className="bg-secondary/50">
                  <tr>
                    <th>Type</th>
                    <th>Reading</th>
                    <th>Sample Point</th>
                    <th className="hidden md:table-cell">Recorded At</th>
                    <th className="hidden md:table-cell">Recorded By</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.slice(0, 10).map(log => {
                    const config = utilityConfig[log.utilityType];
                    const Icon = config.icon;
                    return (
                      <tr key={log.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <Icon className={cn('h-4 w-4', config.color)} />
                            <span>{config.label}</span>
                          </div>
                        </td>
                        <td className="font-medium">
                          {log.readingValue.toLocaleString()} {log.unit}
                        </td>
                        <td>{log.samplePoint}</td>
                        <td className="hidden md:table-cell text-muted-foreground">
                          {new Date(log.recordedAt).toLocaleString()}
                        </td>
                        <td className="hidden md:table-cell text-muted-foreground">
                          {log.recordedBy}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function UtilityForm({
  onSave,
  onCancel,
}: {
  onSave: (data: Partial<UtilityLog>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Partial<UtilityLog>>({
    utilityType: 'power',
    readingValue: 0,
    unit: 'kWh',
    samplePoint: '',
  });

  const unitOptions: Record<UtilityType, string[]> = {
    power: ['kWh', 'kW', 'A'],
    gas: ['m³', 'L'],
    water: ['m³', 'L'],
    compressed_air: ['bar', 'psi', 'm³/min'],
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="utilityType">Utility Type</Label>
        <Select
          value={formData.utilityType}
          onValueChange={value => setFormData({
            ...formData,
            utilityType: value as UtilityType,
            unit: unitOptions[value as UtilityType][0],
          })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="power">Power</SelectItem>
            <SelectItem value="gas">Gas</SelectItem>
            <SelectItem value="water">Water</SelectItem>
            <SelectItem value="compressed_air">Compressed Air</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="readingValue">Reading Value</Label>
          <Input
            id="readingValue"
            type="number"
            step="0.01"
            value={formData.readingValue}
            onChange={e => setFormData({ ...formData, readingValue: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit">Unit</Label>
          <Select
            value={formData.unit}
            onValueChange={value => setFormData({ ...formData, unit: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {unitOptions[formData.utilityType || 'power'].map(unit => (
                <SelectItem key={unit} value={unit}>
                  {unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="samplePoint">Sample Point</Label>
        <Input
          id="samplePoint"
          value={formData.samplePoint}
          onChange={e => setFormData({ ...formData, samplePoint: e.target.value })}
          placeholder="e.g., Main Panel, Gas Meter 1"
          required
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" className="flex-1">
          Log Reading
        </Button>
      </div>
    </form>
  );
}
