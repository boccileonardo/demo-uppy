import { useEffect } from 'react';
import { FormDialog } from '../ui/dialogs';
import { TextField, SelectField } from '../ui/form-fields';
import { useForm, validators } from '../../hooks/useForm';
import { useQuery } from '../../hooks/useQuery';
import { cachedApiService } from '../../services/cachedApi';
import type { UserCreateRequest, UserUpdateRequest, AppUser } from '../../types';

interface UserFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: UserCreateRequest | UserUpdateRequest) => Promise<void>;
  user?: AppUser | null;
}

const roleOptions = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
];

export function UserForm({ 
  open, 
  onClose, 
  onSubmit, 
  user
}: UserFormProps) {
  const isEditing = !!user;
  
  // Fetch containers with accounts from API
  const { data: containersWithAccounts, loading: containersLoading } = useQuery(
    cachedApiService.getContainersWithAccounts,
    [],
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      enabled: open, // Only fetch when form is open
    }
  );
  
  // Create container options for dropdown
  const containerOptions = (containersWithAccounts || []).map(container => ({
    value: container.container_id,
    label: container.display_name,
  }));
  
  // Find container ID based on user's current container and storage account (for editing)
  const findContainerId = () => {
    if (!user || !containersWithAccounts) return '';
    
    const matchingContainer = containersWithAccounts.find(
      c => c.container_name === user.container && c.storage_account_name === user.storageAccount
    );
    
    return matchingContainer?.container_id || '';
  };
  
  const initialValues = {
    email: user?.email || '',
    name: user?.name || '',
    role: (user?.role || 'user') as 'user' | 'admin',
    container_id: findContainerId() || '',
  };

  const validationRules = [
    { field: 'email' as const, validator: validators.required('Email is required') },
    { field: 'email' as const, validator: validators.email() },
    { field: 'name' as const, validator: validators.required('Name is required') },
    { field: 'container_id' as const, validator: validators.required('Container is required') },
  ];

  // Update form fields when container data is loaded (for editing)
  useEffect(() => {
    if (user && containersWithAccounts && containersWithAccounts.length > 0) {
      const newContainerId = findContainerId();
      if (newContainerId) {
        form.setValue('container_id', newContainerId);
      }
    }
  }, [user, containersWithAccounts]); // eslint-disable-line react-hooks/exhaustive-deps

  const form = useForm(initialValues, validationRules);

  const handleSubmit = async () => {
    if (form.validate()) {
      try {
        await onSubmit(form.values);
        form.reset();
        onClose();
      } catch (error) {
        // Error is handled by the calling component
      }
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <FormDialog
      open={open}
      onClose={handleClose}
      title={isEditing ? 'Edit User' : 'Create New User'}
      description={
        isEditing 
          ? 'Update user information and permissions.'
          : 'Create a new user account. They will need to set their password on first login.'
      }
      onSubmit={handleSubmit}
      submitLabel={isEditing ? 'Update User' : 'Create User'}
      isSubmitting={form.isSubmitting}
      submitDisabled={!form.isValid || !form.isDirty}
    >
      <TextField
        label="Email"
        type="email"
        value={form.values.email}
        onChange={(value) => form.setValue('email', value)}
        error={form.errors.email}
        required
        disabled={isEditing} // Email should not be editable
      />

      <TextField
        label="Full Name"
        value={form.values.name}
        onChange={(value) => form.setValue('name', value)}
        error={form.errors.name}
        required
      />

      <SelectField
        label="Role"
        value={form.values.role}
        onChange={(value) => form.setValue('role', value)}
        options={roleOptions}
        error={form.errors.role}
        required
      />

      <SelectField
        label="Container & Storage Account"
        value={form.values.container_id}
        onChange={(value) => form.setValue('container_id', value)}
        options={containerOptions}
        error={form.errors.container_id}
        placeholder={containersLoading ? "Loading containers..." : "Select container"}
        required
      />
    </FormDialog>
  );
}
