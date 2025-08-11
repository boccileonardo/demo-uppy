import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { ConfirmDialog } from './ui/dialogs';
import { LoadingSpinner, EmptyState } from './ui/common';
import { StorageAccountForm, ContainerForm } from './forms/StorageAccountForm';
import { 
  Database,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  Cloud,
  HardDrive,
  Key
} from 'lucide-react';
import { useStorageManagement } from '../hooks/useStorageManagement';
import type { StorageAccountData } from '../types';

export function StorageConfiguration() {
  const storageManagement = useStorageManagement();
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [isContainerDialogOpen, setIsContainerDialogOpen] = useState(false);
  const [isEditAccountDialogOpen, setIsEditAccountDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<StorageAccountData | null>(null);
  const [deleteAccountDialog, setDeleteAccountDialog] = useState<{ 
    open: boolean; 
    accountId: string | null;
  }>({
    open: false,
    accountId: null,
  });
  const [deleteContainerDialog, setDeleteContainerDialog] = useState<{ 
    open: boolean; 
    accountId: string | null;
    containerId: string | null;
  }>({
    open: false,
    accountId: null,
    containerId: null,
  });

  // The hook automatically fetches data, no manual fetch needed
  
  const handleCreateAccount = async (accountData: any) => {
    await storageManagement.createStorageAccount(accountData);
  };

  const handleEditAccount = (account: StorageAccountData) => {
    setEditingAccount(account);
    setIsEditAccountDialogOpen(true);
  };

  const handleUpdateAccount = async (accountData: any) => {
    if (editingAccount) {
      await storageManagement.updateStorageAccount(editingAccount.id, {
        ...accountData,
        is_active: editingAccount.isActive,
      });
      setEditingAccount(null);
    }
  };

  const handleDeleteAccount = (accountId: string) => {
    setDeleteAccountDialog({ open: true, accountId });
  };

  const confirmDeleteAccount = async () => {
    if (deleteAccountDialog.accountId) {
      await storageManagement.deleteStorageAccount(deleteAccountDialog.accountId);
      setDeleteAccountDialog({ open: false, accountId: null });
    }
  };

  const handleCreateContainer = async (containerData: any) => {
    await storageManagement.createContainer(containerData);
  };

  const handleDeleteContainer = (accountId: string, containerId: string) => {
    setDeleteContainerDialog({ 
      open: true, 
      accountId, 
      containerId 
    });
  };

  const confirmDeleteContainer = async () => {
    if (deleteContainerDialog.containerId) {
      await storageManagement.deleteContainer(
        deleteContainerDialog.containerId
      );
      setDeleteContainerDialog({ 
        open: false, 
        accountId: null, 
        containerId: null 
      });
    }
  };

  const maskConnectionString = (connectionString: string) => {
    const parts = connectionString.split(';');
    return parts.map(part => {
      if (part.includes('AccountKey=')) {
        const [key, value] = part.split('=');
        return `${key}=${'*'.repeat(Math.min(value.length, 20))}`;
      }
      return part;
    }).join(';');
  };

  if (storageManagement.accountsLoading && storageManagement.accounts.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Storage Configuration</h2>
          <p className="text-sm text-muted-foreground">
            Manage Azure Blob Storage accounts and containers
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            onClick={() => setIsContainerDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Container
          </Button>
          
          <Button onClick={() => setIsAccountDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Account
          </Button>
        </div>
      </div>

      {/* Error Display */}
            {storageManagement.accountsError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{storageManagement.accountsError}</AlertDescription>
        </Alert>
      )}

      {/* Storage Accounts */}
      {storageManagement.accounts.length === 0 && !storageManagement.accountsLoading ? (
        <EmptyState
          icon={Database}
          title="No storage accounts configured"
          description="Get started by adding your first Azure Blob Storage account."
          action={
            <Button onClick={() => setIsAccountDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Storage Account
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {storageManagement.accounts.map((account) => (
            <Card key={account.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Database className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>{account.name}</span>
                        <Badge 
                          variant={account.isActive ? 'default' : 'destructive'}
                          className={account.isActive ? 'bg-green-100 text-green-800' : ''}
                        >
                          {account.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {account.location} • {account.redundancy} • {account.containers.length} containers
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditAccount(account)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAccount(account.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Connection Details */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Key className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">Connection String</span>
                    </div>
                    <code className="text-xs text-gray-600 break-all">
                      {maskConnectionString(account.connectionString)}
                    </code>
                  </div>

                  {/* Containers */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center">
                      <HardDrive className="w-4 h-4 mr-2" />
                      Containers ({account.containers.length})
                    </h4>
                    
                    {account.containers.length === 0 ? (
                      <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                        <Cloud className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No containers in this account</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {account.containers.map((container) => (
                          <Card key={container.id} className="border border-gray-200">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="text-sm font-mono">{container.name}</h5>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteContainer(account.id, container.id)}
                                  className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                              <div className="space-y-1 text-xs text-gray-500">
                                <div>Access: {container.accessLevel}</div>
                                <div>Created: {new Date().toLocaleDateString()}</div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <StorageAccountForm
        open={isAccountDialogOpen}
        onClose={() => setIsAccountDialogOpen(false)}
        onSubmit={handleCreateAccount}
      />

      <StorageAccountForm
        open={isEditAccountDialogOpen}
        onClose={() => {
          setIsEditAccountDialogOpen(false);
          setEditingAccount(null);
        }}
        onSubmit={handleUpdateAccount}
        account={editingAccount}
      />

      <ContainerForm
        open={isContainerDialogOpen}
        onClose={() => setIsContainerDialogOpen(false)}
        onSubmit={handleCreateContainer}
        storageAccounts={storageManagement.accounts}
      />

      <ConfirmDialog
        open={deleteAccountDialog.open}
        onClose={() => setDeleteAccountDialog({ open: false, accountId: null })}
        onConfirm={confirmDeleteAccount}
        title="Delete Storage Account"
        description="Are you sure you want to delete this storage account? This will affect all users assigned to it."
        confirmLabel="Delete"
        variant="destructive"
      />

      <ConfirmDialog
        open={deleteContainerDialog.open}
        onClose={() => setDeleteContainerDialog({ 
          open: false, 
          accountId: null, 
          containerId: null 
        })}
        onConfirm={confirmDeleteContainer}
        title="Delete Container"
        description="Are you sure you want to delete this container? All files will be lost."
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
}
