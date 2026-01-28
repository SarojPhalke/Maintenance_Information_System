import { useState } from 'react';
import { mockUsers, rolePermissions } from '@/lib/mockData';
import type { User, UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Search,
  Edit2,
  Shield,
  Users,
  UserCheck,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const roleBadgeColors: Record<UserRole, string> = {
  admin: 'bg-destructive/20 text-destructive',
  manager: 'bg-warning/20 text-warning',
  engineer: 'bg-info/20 text-info',
  operator: 'bg-success/20 text-success',
};

const allPermissions = [
  { key: 'view_dashboard', name: 'View Dashboard', category: 'Dashboard' },
  { key: 'view_assets', name: 'View Assets', category: 'Assets' },
  { key: 'create_assets', name: 'Create Assets', category: 'Assets' },
  { key: 'update_assets', name: 'Update Assets', category: 'Assets' },
  { key: 'delete_assets', name: 'Delete Assets', category: 'Assets' },
  { key: 'view_pm', name: 'View PM', category: 'PM' },
  { key: 'create_pm', name: 'Create PM', category: 'PM' },
  { key: 'update_pm', name: 'Update PM', category: 'PM' },
  { key: 'delete_pm', name: 'Delete PM', category: 'PM' },
  { key: 'view_breakdowns', name: 'View Breakdowns', category: 'Breakdowns' },
  { key: 'create_breakdown', name: 'Create Breakdown', category: 'Breakdowns' },
  { key: 'update_breakdown', name: 'Update Breakdown', category: 'Breakdowns' },
  { key: 'view_spares', name: 'View Spares', category: 'Spares' },
  { key: 'create_spares', name: 'Create Spares', category: 'Spares' },
  { key: 'update_spares', name: 'Update Spares', category: 'Spares' },
  { key: 'issue_spares', name: 'Issue Spares', category: 'Spares' },
  { key: 'view_utilities', name: 'View Utilities', category: 'Utilities' },
  { key: 'create_utilities', name: 'Create Utilities', category: 'Utilities' },
  { key: 'view_kpi', name: 'View KPI', category: 'KPI' },
  { key: 'view_analytics', name: 'View Analytics', category: 'Analytics' },
  { key: 'manage_users', name: 'Manage Users', category: 'Admin' },
  { key: 'manage_roles', name: 'Manage Roles', category: 'Admin' },
];

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Record<UserRole, string[]>>(rolePermissions);

  const filteredUsers = users.filter(
    user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, role: newRole } : u))
    );
  };

  const handlePermissionToggle = (role: UserRole, permission: string) => {
    setPermissions(prev => {
      const currentPermissions = prev[role] || [];
      const hasPermission = currentPermissions.includes(permission);
      return {
        ...prev,
        [role]: hasPermission
          ? currentPermissions.filter(p => p !== permission)
          : [...currentPermissions, permission],
      };
    });
  };

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    managers: users.filter(u => u.role === 'manager').length,
    engineers: users.filter(u => u.role === 'engineer').length,
    operators: users.filter(u => u.role === 'operator').length,
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">User Management</h1>
        <p className="page-description">Manage users, roles, and permissions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <StatCard icon={Users} label="Total Users" value={stats.total} />
        <StatCard icon={Shield} label="Admins" value={stats.admins} color="text-destructive" />
        <StatCard icon={UserCheck} label="Managers" value={stats.managers} color="text-warning" />
        <StatCard icon={Settings} label="Engineers" value={stats.engineers} color="text-info" />
        <StatCard icon={Users} label="Operators" value={stats.operators} color="text-success" />
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="permissions">Role Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          {/* Search */}
          <div className="mb-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead className="bg-secondary/50">
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th className="hidden md:table-cell">Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td className="font-medium">{user.name}</td>
                      <td className="text-muted-foreground">{user.email}</td>
                      <td>
                        <Badge className={cn('status-badge capitalize', roleBadgeColors[user.role])}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="hidden md:table-cell text-muted-foreground">
                        {user.createdAt}
                      </td>
                      <td>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setSelectedUser(user);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="permissions">
          <div className="grid gap-4 lg:grid-cols-2">
            {(['admin', 'manager', 'engineer', 'operator'] as UserRole[]).map(role => (
              <Card key={role}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Badge className={cn('capitalize', roleBadgeColors[role])}>
                      {role}
                    </Badge>
                    <CardTitle className="text-base">Permissions</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {Object.entries(
                      allPermissions.reduce((acc, perm) => {
                        if (!acc[perm.category]) acc[perm.category] = [];
                        acc[perm.category].push(perm);
                        return acc;
                      }, {} as Record<string, typeof allPermissions>)
                    ).map(([category, perms]) => (
                      <div key={category}>
                        <div className="text-xs font-medium text-muted-foreground mb-2">
                          {category}
                        </div>
                        <div className="space-y-2">
                          {perms.map(perm => (
                            <div key={perm.key} className="flex items-center gap-2">
                              <Checkbox
                                id={`${role}-${perm.key}`}
                                checked={permissions[role]?.includes(perm.key)}
                                onCheckedChange={() => handlePermissionToggle(role, perm.key)}
                              />
                              <label
                                htmlFor={`${role}-${perm.key}`}
                                className="text-sm cursor-pointer"
                              >
                                {perm.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={selectedUser.name} disabled />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={selectedUser.email} disabled />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={selectedUser.role}
                  onValueChange={value => {
                    handleRoleChange(selectedUser.id, value as UserRole);
                    setSelectedUser({ ...selectedUser, role: value as UserRole });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operator">Operator</SelectItem>
                    <SelectItem value="engineer">Engineer</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                onClick={() => setEditDialogOpen(false)}
              >
                Save Changes
              </Button>
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
  color = 'text-foreground',
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="stat-card">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
      </div>
      <span className={cn('text-2xl font-bold', color)}>{value}</span>
    </div>
  );
}
