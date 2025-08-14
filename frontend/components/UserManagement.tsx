import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ConfirmDialog } from './ui/dialogs';
import { LoadingSpinner, EmptyState } from './ui/common';
import { UserForm } from './forms/UserForm';
import { TemporaryPasswordModal } from './TemporaryPasswordModal';
import { 
  Plus,
  Edit,
  Trash2,
  Search,
  User,
  Shield,
  UserCheck,
  UserX,
  AlertTriangle
} from 'lucide-react';
import { useUserManagement } from '../hooks/useUserManagement';
import { useDebounce, useContainers } from '../hooks';
import type { AppUser } from '../types';

export function UserManagement() {
  const userManagement = useUserManagement();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState<any>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; userId: string | null }>({
    open: false,
    userId: null,
  });

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Filter users client-side based on search query
  const filteredUsers = userManagement.items.filter(user => 
    user.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    user.email.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const handleCreateUser = async (userData: any) => {
    const response = await userManagement.createUser(userData);
    setNewUserData(response);
    setIsPasswordModalOpen(true);
  };

  const handleEditUser = (user: AppUser) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async (userData: any) => {
    if (editingUser) {
      await userManagement.updateUser(editingUser.id, {
        ...userData,
        is_active: editingUser.isActive,
      });
      setEditingUser(null);
    }
  };

  const handleDeleteUser = (userId: string) => {
    setDeleteDialog({ open: true, userId });
  };

  const confirmDeleteUser = async () => {
    if (deleteDialog.userId) {
      await userManagement.deleteUser(deleteDialog.userId);
      setDeleteDialog({ open: false, userId: null });
    }
  };

  if (userManagement.loading && userManagement.items.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">User Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search users by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full sm:w-80"
            />
          </div>
          
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create User
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {userManagement.error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <p className="text-red-700">{userManagement.error}</p>
          </div>
        </div>
      )}

      {/* Users List */}
      {filteredUsers.length === 0 && !userManagement.loading ? (
        <EmptyState
          icon={User}
          title="No users found"
          description={searchQuery ? "No users match your search criteria." : "Get started by creating your first user."}
          action={
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create User
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-gray-100 rounded-full">
                      {user.role === 'admin' ? (
                        <Shield className="w-5 h-5 text-blue-600" />
                      ) : (
                        <User className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <Badge 
                          variant={user.role === 'admin' ? 'default' : 'secondary'}
                          className={user.role === 'admin' ? 'bg-blue-100 text-blue-800' : ''}
                        >
                          {user.role}
                        </Badge>
                        <Badge 
                          variant={user.isActive ? 'default' : 'destructive'}
                          className={user.isActive ? 'bg-green-100 text-green-800' : ''}
                        >
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                        <span>Created: {new Date(user.createdAt).toLocaleDateString()}</span>
                        {user.lastLogin && (
                          <span>Last login: {new Date(user.lastLogin).toLocaleDateString()}</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                        <span className="font-mono">{user.storageAccount}</span>
                        <span className="font-mono">{user.container}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => userManagement.toggleUserStatus(user.id)}
                      className={user.isActive ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}
                    >
                      {user.isActive ? (
                        <UserX className="w-4 h-4" />
                      ) : (
                        <UserCheck className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600">
            Total Users: {userManagement.items.length}
            {searchQuery && (
              <span className="ml-4">
                Filtered: {filteredUsers.length}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <UserForm
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreateUser}
      />

      <UserForm
        open={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingUser(null);
        }}
        onSubmit={handleUpdateUser}
        user={editingUser}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, userId: null })}
        onConfirm={confirmDeleteUser}
        title="Delete User"
        description="Are you sure you want to delete this user? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
      />

      {newUserData && (
        <TemporaryPasswordModal
          isOpen={isPasswordModalOpen}
          onClose={() => {
            setIsPasswordModalOpen(false);
            setNewUserData(null);
          }}
          userName={newUserData.name}
          userEmail={newUserData.email}
          temporaryPassword={newUserData.temporaryPassword || 'temp123'}
        />
      )}
    </div>
  );
}
