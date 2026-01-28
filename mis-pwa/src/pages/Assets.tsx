import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { mockAssets } from '@/lib/mockData';
import type { Asset, AssetStatus, AssetType } from '@/types';
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
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  Download,
  Upload,
  Edit2,
  Trash2,
  QrCode,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const statusColors: Record<AssetStatus, string> = {
  active: 'status-active',
  inactive: 'status-inactive',
  maintenance: 'status-warning',
  disposed: 'status-critical',
};

export default function Assets() {
  const { hasPermission } = useAuth();
  const [assets, setAssets] = useState<Asset[]>(mockAssets);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const filteredAssets = assets.filter(asset => {
    const matchesSearch =
      asset.assetCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: assets.length,
    active: assets.filter(a => a.status === 'active').length,
    maintenance: assets.filter(a => a.status === 'maintenance').length,
    disposed: assets.filter(a => a.status === 'disposed').length,
  };

  const handleSaveAsset = (formData: Partial<Asset>) => {
    if (editingAsset) {
      setAssets(prev =>
        prev.map(a => (a.id === editingAsset.id ? { ...a, ...formData } : a))
      );
    } else {
      const newAsset: Asset = {
        id: Date.now().toString(),
        assetCode: formData.assetCode || '',
        assetName: formData.assetName || '',
        assetType: formData.assetType || 'machine',
        status: formData.status || 'active',
        location: formData.location || '',
        manufacturer: formData.manufacturer || '',
        serialNumber: formData.serialNumber || '',
        installDate: formData.installDate || new Date().toISOString().split('T')[0],
      };
      setAssets(prev => [...prev, newAsset]);
    }
    setIsDialogOpen(false);
    setEditingAsset(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this asset?')) {
      setAssets(prev => prev.filter(a => a.id !== id));
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Assets Register</h1>
          <p className="page-description">Manage and track all company assets</p>
        </div>
        <div className="flex gap-2">
          {hasPermission('create_assets') && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingAsset(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Asset
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingAsset ? 'Edit Asset' : 'Add Asset'}
                  </DialogTitle>
                </DialogHeader>
                <AssetForm
                  asset={editingAsset}
                  onSave={handleSaveAsset}
                  onCancel={() => setIsDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Assets" value={stats.total} />
        <StatCard label="Active" value={stats.active} variant="success" />
        <StatCard label="Under Maintenance" value={stats.maintenance} variant="warning" />
        <StatCard label="Disposed" value={stats.disposed} variant="muted" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
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
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="disposed">Disposed</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" title="Import">
            <Upload className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" title="Export">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead className="bg-secondary/50">
              <tr>
                <th>ID</th>
                <th>Asset Code</th>
                <th>Asset Name</th>
                <th className="hidden md:table-cell">Location</th>
                <th className="hidden lg:table-cell">Install Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    No assets found.
                  </td>
                </tr>
              ) : (
                filteredAssets.map(asset => (
                  <tr key={asset.id}>
                    <td className="font-mono text-xs">{asset.id}</td>
                    <td className="font-medium">{asset.assetCode}</td>
                    <td>{asset.assetName}</td>
                    <td className="hidden md:table-cell text-muted-foreground">
                      {asset.location}
                    </td>
                    <td className="hidden lg:table-cell text-muted-foreground">
                      {asset.installDate}
                    </td>
                    <td>
                      <Badge className={cn('status-badge', statusColors[asset.status])}>
                        {asset.status}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="QR Code"
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                        {hasPermission('update_assets') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingAsset(asset);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                        {hasPermission('delete_assets') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(asset.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  variant = 'default',
}: {
  label: string;
  value: number;
  variant?: 'default' | 'success' | 'warning' | 'muted';
}) {
  const colors = {
    default: 'text-foreground',
    success: 'text-success',
    warning: 'text-warning',
    muted: 'text-muted-foreground',
  };

  return (
    <div className="stat-card">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn('text-2xl font-bold', colors[variant])}>{value}</span>
    </div>
  );
}

function AssetForm({
  asset,
  onSave,
  onCancel,
}: {
  asset: Asset | null;
  onSave: (data: Partial<Asset>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Partial<Asset>>(
    asset || {
      assetCode: '',
      assetName: '',
      assetType: 'machine',
      status: 'active',
      location: '',
      manufacturer: '',
      serialNumber: '',
      installDate: new Date().toISOString().split('T')[0],
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="assetCode">Asset Code</Label>
          <Input
            id="assetCode"
            value={formData.assetCode}
            onChange={e => setFormData({ ...formData, assetCode: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="assetName">Asset Name</Label>
          <Input
            id="assetName"
            value={formData.assetName}
            onChange={e => setFormData({ ...formData, assetName: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="assetType">Type</Label>
          <Select
            value={formData.assetType}
            onValueChange={value => setFormData({ ...formData, assetType: value as AssetType })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="machine">Machine</SelectItem>
              <SelectItem value="equipment">Equipment</SelectItem>
              <SelectItem value="tool">Tool</SelectItem>
              <SelectItem value="vehicle">Vehicle</SelectItem>
              <SelectItem value="auxiliary">Auxiliary</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={value => setFormData({ ...formData, status: value as AssetStatus })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="disposed">Disposed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={e => setFormData({ ...formData, location: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="manufacturer">Manufacturer</Label>
          <Input
            id="manufacturer"
            value={formData.manufacturer}
            onChange={e => setFormData({ ...formData, manufacturer: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="serialNumber">Serial Number</Label>
          <Input
            id="serialNumber"
            value={formData.serialNumber}
            onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="installDate">Install Date</Label>
        <Input
          id="installDate"
          type="date"
          value={formData.installDate}
          onChange={e => setFormData({ ...formData, installDate: e.target.value })}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" className="flex-1">
          Save
        </Button>
      </div>
    </form>
  );
}
