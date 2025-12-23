import { Sidebar } from '@/components/Sidebar';
import { usersData, User } from '@/data/blockchainData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Users as UsersIcon, 
  Shield, 
  Upload, 
  Eye, 
  Search,
  UserPlus,
  Activity,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const USERS_STORAGE_KEY = 'certchain_users';

const Users = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { user: currentUser } = useAuth();

  // local users state so we can add/remove in the UI for the demo
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
      return storedUsers ? JSON.parse(storedUsers) : usersData;
    } catch (error) {
      console.error("Failed to load users from localStorage", error);
      return usersData;
    }
  });

  useEffect(() => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  const { toast } = useToast();

  // Dialog / confirmation state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [confirmAddOpen, setConfirmAddOpen] = useState(false);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [pendingNewUser, setPendingNewUser] = useState<{ username: string; role: User['role']; password: string } | null>(null);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);

  // Add user form state
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState<User['role']>('uploader');
  const [newPassword, setNewPassword] = useState('');
  
  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartAdd = () => {
    setNewUsername('');
    setNewRole('uploader');
    setNewPassword('');
    setAddDialogOpen(true);
  };

  const validateNewUser = (username: string, password: string, role: User['role']) => {
    const trimmed = username.trim();
    if (!trimmed) {
      toast({ title: 'Validation error', description: 'Username is required', variant: 'destructive' });
      return false;
    }
    if (users.find(u => u.username.toLowerCase() === trimmed.toLowerCase())) {
      toast({ title: 'Validation error', description: 'Username already exists', variant: 'destructive' });
      return false;
    }
    const min = role === 'admin' ? 6 : 4;
    if (!password || password.length < min) {
      toast({ title: 'Validation error', description: `Password must be at least ${min} characters`, variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handleCreate = () => {
    if (!validateNewUser(newUsername, newPassword, newRole)) return;
    setPendingNewUser({ username: newUsername.trim(), role: newRole, password: newPassword });
    setConfirmAddOpen(true);
  };

  const handleCreateConfirm = () => {
    if (!pendingNewUser) return;
    setUsers(prev => [...prev, { username: pendingNewUser.username, role: pendingNewUser.role, login_count: 0 }]);
    toast({ title: 'Success', description: `User ${pendingNewUser.username} created.` });
    setConfirmAddOpen(false);
    setPendingNewUser(null);
    setAddDialogOpen(false);
  };

  const startRemoveUser = (username: string) => {
    if (currentUser?.role !== 'admin') {
      toast({ title: 'Permission Denied', description: 'Only admins can remove users.', variant: 'destructive' });
      return;
    }
    if (username === currentUser.username) {
      toast({ title: 'Action not allowed', description: "You cannot remove yourself.", variant: 'destructive' });
      return;
    }
    setRemoveTarget(username);
    setConfirmRemoveOpen(true);
  };

  const handleRemoveConfirm = () => {
    if (!removeTarget) return;
    setUsers(prev => prev.filter(u => u.username !== removeTarget));
    toast({ title: 'Success', description: `User ${removeTarget} has been removed.` });
    setConfirmRemoveOpen(false);
    setRemoveTarget(null);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'uploader':
        return <Upload className="w-4 h-4" />;
      case 'viewer':
        return <Eye className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getRoleBadge = (role: string) => {
    const styles = {
      admin: 'bg-primary/10 text-primary border-primary/20',
      uploader: 'bg-success/10 text-success border-success/20',
      viewer: 'bg-muted text-muted-foreground border-border'
    };

    return (
      <span className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border",
        styles[role as keyof typeof styles]
      )}>
        {getRoleIcon(role)}
        <span className="capitalize">{role}</span>
      </span>
    );
  };

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    uploaders: users.filter(u => u.role === 'uploader').length,
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 opacity-0 animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <UsersIcon className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-display font-bold text-foreground">User Management</h1>
            </div>
            <p className="text-muted-foreground">Manage system users and their access permissions</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <Button className="gap-2" onClick={handleStartAdd}>
                <UserPlus className="w-4 h-4" />
                Add User
              </Button>
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create User</DialogTitle>
                    <DialogDescription>Add a new user and assign a role and password</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-2">
                    <Input placeholder="Username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
                    <div className="flex gap-2">
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value as User['role'])}
                        className="px-3 py-2 rounded-md bg-background border border-border flex-1"
                      >
                        <option value="uploader" className="text-black">Uploader</option>
                        <option value="admin" className="text-black">Admin</option>
                      </select>
                      <Input type="password" placeholder="Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreate}>Create</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Confirm add dialog */}
              <AlertDialog open={confirmAddOpen} onOpenChange={setConfirmAddOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Create User</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to create user <strong>{pendingNewUser?.username}</strong> with role <strong>{pendingNewUser?.role}</strong>?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCreateConfirm}>Confirm</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass rounded-xl p-4 opacity-0 animate-scale-in" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <UsersIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-display font-bold text-foreground">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Total Users</div>
              </div>
            </div>
          </div>
          <div className="glass rounded-xl p-4 opacity-0 animate-scale-in" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-display font-bold text-foreground">{stats.admins}</div>
                <div className="text-xs text-muted-foreground">Administrators</div>
              </div>
            </div>
          </div>
          <div className="glass rounded-xl p-4 opacity-0 animate-scale-in" style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Upload className="w-5 h-5 text-success" />
              </div>
              <div>
                <div className="text-2xl font-display font-bold text-foreground">{stats.uploaders}</div>
                <div className="text-xs text-muted-foreground">Uploaders</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div 
          className="glass-strong rounded-2xl p-6 mb-6 opacity-0 animate-slide-up"
          style={{ animationDelay: '350ms', animationFillMode: 'forwards' }}
        >
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12"
            />
          </div>
        </div>

        {/* Users Table */}
        <div 
          className="glass-strong rounded-2xl overflow-hidden opacity-0 animate-slide-up"
          style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}
        >
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">User</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Role</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Login Count</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, idx) => (
                <tr 
                  key={user.username}
                  className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <span className="text-primary font-display font-semibold">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{user.username}</p>
                        <p className="text-xs text-muted-foreground">{user.username}@certchain.io</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{user.login_count || 0}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                      <span className="text-muted-foreground">Active</span>
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {currentUser?.role === 'admin' && user.username !== currentUser.username && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => startRemoveUser(user.username)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Confirm remove dialog */}
        <AlertDialog open={confirmRemoveOpen} onOpenChange={setConfirmRemoveOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm remove</AlertDialogTitle>
              <AlertDialogDescription>Are you sure you want to remove <strong>{removeTarget}</strong>?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRemoveConfirm}>Remove</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {filteredUsers.length === 0 && (
          <div className="text-center py-16">
            <UsersIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-display font-semibold text-foreground mb-2">No users found</h3>
            <p className="text-muted-foreground">Try adjusting your search criteria</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Users;
