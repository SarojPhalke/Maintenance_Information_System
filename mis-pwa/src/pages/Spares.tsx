import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { mockSpares } from '@/lib/mockData';
import type { SparePart } from '@/types';
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
  Filter,
  Download,
  Upload,
  Edit2,
  Trash2,
  ArrowUpDown,
  AlertTriangle,
  Package,
  TrendingDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SparesPage() {
  const { hasPermission } = useAuth();
  const [spares, setSpares] = useState<SparePart[]>(mockSpares);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSpare, setEditingSpare] = useState<SparePart | null>(null);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [selectedSpare, setSelectedSpare] = useState<SparePart | null>(null);

  const categories = [...new Set(spares.map(s => s.category))];

  const filteredSpares = spares.filter(spare => {
    const matchesSearch =
      spare.partCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spare.partName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || spare.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = spares.filter(s => s.currentStock <= s.minStock);

  const stats = {
    total: spares.length,
    totalValue: spares.reduce((sum, s) => sum + s.currentStock * s.unitPrice, 0),
    lowStock: lowStockItems.length,
    categories: categories.length,
  };

  const getStockStatus = (spare: SparePart) => {
    if (spare.currentStock <= spare.minStock) return 'critical';
    if (spare.currentStock <= spare.minStock * 1.5) return 'warning';
    return 'ok';
  };

  const handleSaveSpare = (formData: Partial<SparePart>) => {
    if (editingSpare) {
      setSpares(prev =>
        prev.map(s => (s.id === editingSpare.id ? { ...s, ...formData } : s))
      );
    } else {
      const newSpare: SparePart = {
        id: Date.now().toString(),
        partCode: formData.partCode || '',
        partName: formData.partName || '',
        category: formData.category || '',
        currentStock: formData.currentStock || 0,
        minStock: formData.minStock || 0,
        maxStock: formData.maxStock || 0,
        unit: formData.unit || 'pcs',
        location: formData.location || '',
        unitPrice: formData.unitPrice || 0,
      };
      setSpares(prev => [...prev, newSpare]);
    }
    setIsDialogOpen(false);
    setEditingSpare(null);
  };

  const handleTransaction = (spareId: string, type: 'in' | 'out', quantity: number) => {
    setSpares(prev =>
      prev.map(s =>
        s.id === spareId
          ? {
              ...s,
              currentStock: type === 'in' ? s.currentStock + quantity : s.currentStock - quantity,
              lastRestocked: type === 'in' ? new Date().toISOString().split('T')[0] : s.lastRestocked,
            }
          : s
      )
    );
    setTransactionDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this spare part?')) {
      setSpares(prev => prev.filter(s => s.id !== id));
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Spare Inventory</h1>
          <p className="page-description">Manage spare parts with stock alerts</p>
        </div>
        <div className="flex gap-2">
          {hasPermission('create_spares') && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingSpare(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Part
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingSpare ? 'Edit Spare Part' : 'Add Spare Part'}
                  </DialogTitle>
                </DialogHeader>
                <SpareForm
                  spare={editingSpare}
                  onSave={handleSaveSpare}
                  onCancel={() => setIsDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Package} label="Total Parts" value={stats.total.toString()} />
        <StatCard
          icon={TrendingDown}
          label="Total Value"
          value={`$${stats.totalValue.toLocaleString()}`}
        />
        <StatCard
          icon={AlertTriangle}
          label="Low Stock"
          value={stats.lowStock.toString()}
          variant={stats.lowStock > 0 ? 'warning' : 'default'}
        />
        <StatCard icon={Filter} label="Categories" value={stats.categories.toString()} />
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="mb-4 p-3 bg-warning/10 border border-warning/30 rounded-lg">
          <div className="flex items-center gap-2 text-warning mb-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">Low Stock Alert</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map(item => (
              <Badge key={item.id} variant="outline" className="text-warning border-warning/50">
                {item.partCode}: {item.currentStock} {item.unit}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search parts..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead className="bg-secondary/50">
              <tr>
                <th>Part Code</th>
                <th>Part Name</th>
                <th className="hidden md:table-cell">Category</th>
                <th>Stock</th>
                <th className="hidden lg:table-cell">Min/Max</th>
                <th className="hidden md:table-cell">Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSpares.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-muted-foreground">
                    No spare parts found.
                  </td>
                </tr>
              ) : (
                filteredSpares.map(spare => {
                  const stockStatus = getStockStatus(spare);
                  return (
                    <tr key={spare.id}>
                      <td className="font-mono text-sm">{spare.partCode}</td>
                      <td className="font-medium">{spare.partName}</td>
                      <td className="hidden md:table-cell text-muted-foreground">
                        {spare.category}
                      </td>
                      <td>
                        <span className={cn(
                          stockStatus === 'critical' && 'text-destructive font-medium',
                          stockStatus === 'warning' && 'text-warning'
                        )}>
                          {spare.currentStock} {spare.unit}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell text-muted-foreground">
                        {spare.minStock} / {spare.maxStock}
                      </td>
                      <td className="hidden md:table-cell text-muted-foreground">
                        {spare.location}
                      </td>
                      <td>
                        <Badge
                          className={cn(
                            'status-badge',
                            stockStatus === 'critical' && 'status-critical',
                            stockStatus === 'warning' && 'status-warning',
                            stockStatus === 'ok' && 'status-active'
                          )}
                        >
                          {stockStatus === 'ok' ? 'In Stock' : stockStatus === 'warning' ? 'Low' : 'Critical'}
                        </Badge>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          {hasPermission('issue_spares') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Issue/Receive"
                              onClick={() => {
                                setSelectedSpare(spare);
                                setTransactionDialogOpen(true);
                              }}
                            >
                              <ArrowUpDown className="h-4 w-4" />
                            </Button>
                          )}
                          {hasPermission('update_spares') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditingSpare(spare);
                                setIsDialogOpen(true);
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          )}
                          {hasPermission('delete_spares') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(spare.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Dialog */}
      <Dialog open={transactionDialogOpen} onOpenChange={setTransactionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stock Transaction</DialogTitle>
          </DialogHeader>
          {selectedSpare && (
            <TransactionForm
              spare={selectedSpare}
              onSubmit={(type, qty) => handleTransaction(selectedSpare.id, type, qty)}
              onCancel={() => setTransactionDialogOpen(false)}
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
  variant = 'default',
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  variant?: 'default' | 'warning';
}) {
  return (
    <div className="stat-card">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
      </div>
      <span className={cn('text-2xl font-bold', variant === 'warning' && 'text-warning')}>
        {value}
      </span>
    </div>
  );
}

function SpareForm({
  spare,
  onSave,
  onCancel,
}: {
  spare: SparePart | null;
  onSave: (data: Partial<SparePart>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Partial<SparePart>>(
    spare || {
      partCode: '',
      partName: '',
      category: '',
      currentStock: 0,
      minStock: 0,
      maxStock: 0,
      unit: 'pcs',
      location: '',
      unitPrice: 0,
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
          <Label htmlFor="partCode">Part Code</Label>
          <Input
            id="partCode"
            value={formData.partCode}
            onChange={e => setFormData({ ...formData, partCode: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="partName">Part Name</Label>
          <Input
            id="partName"
            value={formData.partName}
            onChange={e => setFormData({ ...formData, partName: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={e => setFormData({ ...formData, category: e.target.value })}
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
              <SelectItem value="pcs">Pieces</SelectItem>
              <SelectItem value="L">Liters</SelectItem>
              <SelectItem value="kg">Kilograms</SelectItem>
              <SelectItem value="m">Meters</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="currentStock">Current Stock</Label>
          <Input
            id="currentStock"
            type="number"
            value={formData.currentStock}
            onChange={e => setFormData({ ...formData, currentStock: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="minStock">Min Stock</Label>
          <Input
            id="minStock"
            type="number"
            value={formData.minStock}
            onChange={e => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxStock">Max Stock</Label>
          <Input
            id="maxStock"
            type="number"
            value={formData.maxStock}
            onChange={e => setFormData({ ...formData, maxStock: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={e => setFormData({ ...formData, location: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unitPrice">Unit Price ($)</Label>
          <Input
            id="unitPrice"
            type="number"
            step="0.01"
            value={formData.unitPrice}
            onChange={e => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
          />
        </div>
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

function TransactionForm({
  spare,
  onSubmit,
  onCancel,
}: {
  spare: SparePart;
  onSubmit: (type: 'in' | 'out', quantity: number) => void;
  onCancel: () => void;
}) {
  const [type, setType] = useState<'in' | 'out'>('out');
  const [quantity, setQuantity] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'out' && quantity > spare.currentStock) {
      alert('Insufficient stock');
      return;
    }
    onSubmit(type, quantity);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 bg-secondary/50 rounded-lg">
        <div className="font-medium">{spare.partName}</div>
        <div className="text-sm text-muted-foreground">
          Current Stock: {spare.currentStock} {spare.unit}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Transaction Type</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={type === 'in' ? 'default' : 'outline'}
            onClick={() => setType('in')}
          >
            Receive (In)
          </Button>
          <Button
            type="button"
            variant={type === 'out' ? 'default' : 'outline'}
            onClick={() => setType('out')}
          >
            Issue (Out)
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="quantity">Quantity</Label>
        <Input
          id="quantity"
          type="number"
          min="1"
          max={type === 'out' ? spare.currentStock : undefined}
          value={quantity}
          onChange={e => setQuantity(parseInt(e.target.value) || 1)}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" className="flex-1">
          Confirm
        </Button>
      </div>
    </form>
  );
}
