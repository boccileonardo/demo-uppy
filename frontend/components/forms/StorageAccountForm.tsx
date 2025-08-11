import { FormDialog } from '../ui/dialogs';
import { TextField, SelectField } from '../ui/form-fields';
import { useForm, validators } from '../../hooks/useForm';
import type { StorageAccountCreateRequest, StorageAccountUpdateRequest, StorageAccountData } from '../../types';

interface StorageAccountFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: StorageAccountCreateRequest | StorageAccountUpdateRequest) => Promise<void>;
  account?: StorageAccountData | null;
}

const locationOptions = [
  { value: 'East US', label: 'East US' },
  { value: 'West US', label: 'West US' },
  { value: 'West US 2', label: 'West US 2' },
  { value: 'Central US', label: 'Central US' },
  { value: 'North Central US', label: 'North Central US' },
  { value: 'South Central US', label: 'South Central US' },
  { value: 'East US 2', label: 'East US 2' },
];

export function StorageAccountForm({ 
  open, 
  onClose, 
  onSubmit, 
  account 
}: StorageAccountFormProps) {
  const isEditing = !!account;
  
  const initialValues = {
    name: account?.name || '',
    connection_string: account?.connectionString || '',
    location: account?.location || 'Unknown',
  };

  const validationRules = [
    { field: 'name' as const, validator: validators.required('Account name is required') },
    { field: 'connection_string' as const, validator: validators.required('Connection string is required') },
    { field: 'location' as const, validator: validators.required('Location is required') },
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
      title={isEditing ? 'Edit Storage Account' : 'Add Storage Account'}
      description={
        isEditing 
          ? 'Update storage account configuration.'
          : 'Add a new Azure Blob Storage account to the system.'
      }
      onSubmit={handleSubmit}
      submitLabel={isEditing ? 'Update Account' : 'Add Account'}
      isSubmitting={form.isSubmitting}
      submitDisabled={!form.isValid || !form.isDirty}
    >
      <TextField
        label="Account Name"
        value={form.values.name}
        onChange={(value) => form.setValue('name', value)}
        placeholder="mystorage01"
        error={form.errors.name}
        required
      />

      <TextField
        label="Connection String"
        value={form.values.connection_string}
        onChange={(value) => form.setValue('connection_string', value)}
        placeholder="DefaultEndpointsProtocol=https;AccountName=..."
        error={form.errors.connection_string}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Location"
          value={form.values.location}
          onChange={(value) => form.setValue('location', value)}
          options={locationOptions}
          error={form.errors.location}
          required
        />
      </div>
    </FormDialog>
  );
}

interface ContainerFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; account_id: string }) => Promise<void>;
  storageAccounts: Array<{ id: string; name: string; isActive: boolean }>;
}

export function ContainerForm({ 
  open, 
  onClose, 
  onSubmit, 
  storageAccounts 
}: ContainerFormProps) {
  const initialValues = {
    name: '',
    account_id: '',
  };

  const validationRules = [
    { field: 'name' as const, validator: validators.required('Container name is required') },
    { field: 'account_id' as const, validator: validators.required('Storage account is required') },
  ];

  const form = useForm(initialValues, validationRules);

  const activeAccountOptions = storageAccounts
    .filter(account => account.isActive)
    .map(account => ({
      value: account.id,
      label: account.name,
    }));

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
      title="Create New Container"
      description="Add a new container to an existing storage account."
      onSubmit={handleSubmit}
      submitLabel="Create Container"
      isSubmitting={form.isSubmitting}
      submitDisabled={!form.isValid || !form.isDirty}
    >
      <SelectField
        label="Storage Account"
        value={form.values.account_id}
        onChange={(value) => form.setValue('account_id', value)}
        options={activeAccountOptions}
        placeholder="Select storage account"
        error={form.errors.account_id}
        required
      />

      <TextField
        label="Container Name"
        value={form.values.name}
        onChange={(value) => form.setValue('name', value)}
        placeholder="my-container"
        error={form.errors.name}
        required
      />
    </FormDialog>
  );
}
