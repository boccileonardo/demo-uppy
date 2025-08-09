import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
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

interface StorageAccount {
  id: string;
  name: string;
  connectionString: string;
  location: string;
  redundancy: 'LRS' | 'GRS' | 'ZRS' | 'GZRS';
  isActive: boolean;
  createdAt: Date;
  containers: Container[];
}

interface Container {
  id: string;
  name: string;
  accessLevel: 'private' | 'blob' | 'container';
  size: string;
  files: number;
  lastModified: Date;
}

export function StorageConfiguration() {
  const [storageAccounts, setStorageAccounts] = useState<StorageAccount[]>([
    {
      id: '1',
      name: 'secureuploadsa01',
      connectionString: 'DefaultEndpointsProtocol=https;AccountName=secureuploadsa01;AccountKey=***',
      location: 'West US 2',
      redundancy: 'GRS',
      isActive: true,
      createdAt: new Date('2024-01-01'),
      containers: [
        {
          id: '1',
          name: 'user-uploads',
          accessLevel: 'private',
          size: '4.2 GB',
          files: 1247,
          lastModified: new Date('2024-01-21')
        },
        {
          id: '2',
          name: 'admin-uploads',
          accessLevel: 'private',
          size: '890 MB',
          files: 156,
          lastModified: new Date('2024-01-20')
        }
      ]
    },
    {
      id: '2',
      name: 'secureuploadsa02',
      connectionString: 'DefaultEndpointsProtocol=https;AccountName=secureuploadsa02;AccountKey=***',
      location: 'East US',
      redundancy: 'LRS',
      isActive: true,
      createdAt: new Date('2024-01-15'),
      containers: [
        {
          id: '3',
          name: 'backup-uploads',
          accessLevel: 'private',
          size: '2.1 GB',
          files: 634,
          lastModified: new Date('2024-01-19')
        }
      ]
    }
  ]);

  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [isContainerDialogOpen, setIsContainerDialogOpen] = useState(false);
  const [isEditAccountDialogOpen, setIsEditAccountDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<StorageAccount | null>(null);
  const [accountForm, setAccountForm] = useState({
    name: '',
    connectionString: '',
    location: 'West US 2',
    redundancy: 'GRS' as 'LRS' | 'GRS' | 'ZRS' | 'GZRS'
  });
  const [containerForm, setContainerForm] = useState({
    name: '',
    accountId: ''
  });

  const handleCreateAccount = () => {
    const newAccount: StorageAccount = {
      id: Math.random().toString(36).substr(2, 9),
      name: accountForm.name,
      connectionString: accountForm.connectionString,
      location: accountForm.location,
      redundancy: accountForm.redundancy,
      isActive: true,
      createdAt: new Date(),
      containers: []
    };

    setStorageAccounts(prev => [...prev, newAccount]);
    setAccountForm({
      name: '',
      connectionString: '',
      location: 'West US 2',
      redundancy: 'GRS'
    });
    setIsAccountDialogOpen(false);
  };

  const handleCreateContainer = () => {
    const newContainer: Container = {
      id: Math.random().toString(36).substr(2, 9),
      name: containerForm.name,
      accessLevel: 'private', // Default to private
      size: '0 MB',
      files: 0,
      lastModified: new Date()
    };

    setStorageAccounts(prev => prev.map(account =>
      account.id === containerForm.accountId
        ? { ...account, containers: [...account.containers, newContainer] }
        : account
    ));

    setContainerForm({
      name: '',
      accountId: ''
    });
    setIsContainerDialogOpen(false);
  };

  const handleEditAccount = (account: StorageAccount) => {
    setEditingAccount(account);
    setIsEditAccountDialogOpen(true);
  };

  const handleUpdateAccount = () => {
    if (!editingAccount) return;

    setStorageAccounts(prev => prev.map(account =>
      account.id === editingAccount.id ? editingAccount : account
    ));
    setEditingAccount(null);
    setIsEditAccountDialogOpen(false);
  };

  const handleDeleteAccount = (accountId: string) => {
    if (confirm('Are you sure you want to delete this storage account? This will affect all users assigned to it.')) {
      setStorageAccounts(prev => prev.filter(account => account.id !== accountId));
    }
  };

  const handleDeleteContainer = (accountId: string, containerId: string) => {
    if (confirm('Are you sure you want to delete this container? All files will be lost.')) {
      setStorageAccounts(prev => prev.map(account =>
        account.id === accountId
          ? { ...account, containers: account.containers.filter(c => c.id !== containerId) }
          : account
      ));
    }
  };

  const maskConnectionString = (connectionString: string) => {
    const parts = connectionString.split(';');
    return parts.map(part => {
      if (part.startsWith('AccountKey=')) {
        return 'AccountKey=' + '*'.repeat(20);
      }
      return part;
    }).join(';');
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl">Storage Configuration</h2>
          <p className="text-sm text-muted-foreground">
            Manage Azure Blob Storage accounts and containers
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Dialog open={isContainerDialogOpen} onOpenChange={setIsContainerDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Container
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Container</DialogTitle>
                <DialogDescription>
                  Add a new container to an existing storage account.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="container-account">Storage Account</Label>
                  <Select
                    value={containerForm.accountId}
                    onValueChange={(value) => setContainerForm({ ...containerForm, accountId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select storage account" />
                    </SelectTrigger>
                    <SelectContent>
                      {storageAccounts.filter(account => account.isActive).map(account => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="container-name">Container Name</Label>
                  <Input
                    id="container-name"
                    placeholder="my-container"
                    value={containerForm.name}
                    onChange={(e) => setContainerForm({ ...containerForm, name: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsContainerDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateContainer}
                  disabled={!containerForm.name || !containerForm.accountId}
                >
                  Create Container
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Storage Account
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Storage Account</DialogTitle>
                <DialogDescription>
                  Connect a new Azure Blob Storage account to the system.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="account-name">Account Name</Label>
                  <Input
                    id="account-name"
                    placeholder="mystorageaccount"
                    value={accountForm.name}
                    onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="connection-string">Connection String</Label>
                  <Input
                    id="connection-string"
                    placeholder="DefaultEndpointsProtocol=https;AccountName=..."
                    value={accountForm.connectionString}
                    onChange={(e) => setAccountForm({ ...accountForm, connectionString: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Select
                      value={accountForm.location}
                      onValueChange={(value) => setAccountForm({ ...accountForm, location: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="West US 2">West US 2</SelectItem>
                        <SelectItem value="East US">East US</SelectItem>
                        <SelectItem value="Central US">Central US</SelectItem>
                        <SelectItem value="West Europe">West Europe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="redundancy">Redundancy</Label>
                    <Select
                      value={accountForm.redundancy}
                      onValueChange={(value: 'LRS' | 'GRS' | 'ZRS' | 'GZRS') => 
                        setAccountForm({ ...accountForm, redundancy: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LRS">LRS</SelectItem>
                        <SelectItem value="GRS">GRS</SelectItem>
                        <SelectItem value="ZRS">ZRS</SelectItem>
                        <SelectItem value="GZRS">GZRS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAccountDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateAccount}
                  disabled={!accountForm.name || !accountForm.connectionString}
                >
                  Add Account
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Storage Accounts */}
      <div className="space-y-6">
        {storageAccounts.map((account) => (
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
                            <div className="space-y-1 text-xs text-gray-600">
                              <div className="flex justify-between">
                                <span>Size:</span>
                                <span>{container.size}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Files:</span>
                                <span>{container.files.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Modified:</span>
                                <span>{container.lastModified.toLocaleDateString()}</span>
                              </div>
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

      {/* Edit Account Dialog */}
      <Dialog open={isEditAccountDialogOpen} onOpenChange={setIsEditAccountDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Storage Account</DialogTitle>
            <DialogDescription>
              Update storage account settings. Changes may affect connected users.
            </DialogDescription>
          </DialogHeader>
          {editingAccount && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-account-name">Account Name</Label>
                <Input
                  id="edit-account-name"
                  value={editingAccount.name}
                  onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-connection-string">Connection String</Label>
                <Input
                  id="edit-connection-string"
                  value={editingAccount.connectionString}
                  onChange={(e) => setEditingAccount({ ...editingAccount, connectionString: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-location">Location</Label>
                  <Select
                    value={editingAccount.location}
                    onValueChange={(value) => setEditingAccount({ ...editingAccount, location: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="West US 2">West US 2</SelectItem>
                      <SelectItem value="East US">East US</SelectItem>
                      <SelectItem value="Central US">Central US</SelectItem>
                      <SelectItem value="West Europe">West Europe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-redundancy">Redundancy</Label>
                  <Select
                    value={editingAccount.redundancy}
                    onValueChange={(value: 'LRS' | 'GRS' | 'ZRS' | 'GZRS') => 
                      setEditingAccount({ ...editingAccount, redundancy: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LRS">LRS</SelectItem>
                      <SelectItem value="GRS">GRS</SelectItem>
                      <SelectItem value="ZRS">ZRS</SelectItem>
                      <SelectItem value="GZRS">GZRS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={editingAccount.isActive ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEditingAccount({ ...editingAccount, isActive: true })}
                  >
                    Active
                  </Button>
                  <Button
                    variant={!editingAccount.isActive ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={() => setEditingAccount({ ...editingAccount, isActive: false })}
                  >
                    Inactive
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditAccountDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAccount}>
              Update Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Configuration Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
            Configuration Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important Security Notes:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Store connection strings securely and rotate them regularly</li>
                <li>• Use private access level for containers containing sensitive data</li>
                <li>• Enable Azure Storage Analytics for monitoring and auditing</li>
                <li>• Consider using Managed Identity for enhanced security</li>
                <li>• Regularly backup important data to secondary regions</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
