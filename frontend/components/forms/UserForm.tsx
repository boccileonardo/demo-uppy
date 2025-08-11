import { FormDialog } from '../ui/dialogs';
import { TextField, SelectField } from '../ui/form-fields';
import { useForm, validators } from '../../hooks/useForm';
import type { UserCreateRequest, UserUpdateRequest, AppUser } from '../../types';

interface UserFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: UserCreateRequest | UserUpdateRequest) => Promise<void>;
  user?: AppUser | null;
  storageAccounts?: Array<{ id: string; name: string }>;
}

const roleOptions = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
];

const defaultStorageAccounts = [
  { id: 'secureuploadsa01', name: 'secureuploadsa01' },
  { id: 'secureuploadsa02', name: 'secureuploadsa02' },
];

const containerOptions = [
  { value: 'user-uploads', label: 'user-uploads' },
  { value: 'admin-uploads', label: 'admin-uploads' },
];

export function UserForm({ 
  open, 
  onClose, 
  onSubmit, 
  user, 
  storageAccounts = defaultStorageAccounts 
}: UserFormProps) {
  const isEditing = !!user;
  
  const initialValues = {
    email: user?.email || '',
    name: user?.name || '',
    role: (user?.role || 'user') as 'user' | 'admin',
    storage_account: user?.storageAccount || 'secureuploadsa01',
    container: user?.container || 'user-uploads',
  };

  const validationRules = [
    { field: 'email' as const, validator: validators.required('Email is required') },
    { field: 'email' as const, validator: validators.email() },
    { field: 'name' as const, validator: validators.required('Name is required') },
    { field: 'storage_account' as const, validator: validators.required('Storage account is required') },
    { field: 'container' as const, validator: validators.required('Container is required') },
  ];

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

      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Storage Account"
          value={form.values.storage_account}
          onChange={(value) => form.setValue('storage_account', value)}
          options={storageAccounts.map(account => ({
            value: account.id,
            label: account.name,
          }))}
          error={form.errors.storage_account}
          required
        />

        <SelectField
          label="Container"
          value={form.values.container}
          onChange={(value) => form.setValue('container', value)}
          options={containerOptions}
          error={form.errors.container}
          required
        />
      </div>
    </FormDialog>
  );
}
