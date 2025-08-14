import { useEffect, useState } from 'react';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
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
  
  // Always start with empty values to avoid stale data
  const initialValues = {
    name: '',
    connection_string: '',
    location: '',
  };

  const validationRules = isEditing 
    ? [
        { field: 'connection_string' as const, validator: validators.required('Connection string is required') },
      ]
    : [
        { field: 'name' as const, validator: validators.required('Account name is required') },
        { field: 'connection_string' as const, validator: validators.required('Connection string is required') },
        { field: 'location' as const, validator: validators.required('Location is required') },
      ];

  const form = useForm(initialValues, validationRules);
  
  // Update form fields when the form is opened or when account changes
  useEffect(() => {
    if (open) {
      if (isEditing && account) {
        // For editing, set values based on account data
        form.setValues({
          name: account.name || '',
          connection_string: account.connectionString || '',
          location: account.location || '',
        });
      } else {
        // For new account, reset to initial state
        form.setValues({
          name: '',
          connection_string: '',
          location: '',
        });
      }
    }
  }, [open, account, isEditing]);

  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const handleSubmit = async () => {
    setSubmissionError(null);
    // Validate the form before submission
    const isValid = form.validate();
    // Only proceed if validation passes
    if (isValid) {
      try {
        await onSubmit(form.values);
        form.reset();
        onClose();
      } catch (error) {
        // Check if error is due to duplicate storage account name (only for new accounts)
        if (!isEditing && error instanceof Error && error.message.includes('already exists')) {
          form.setError('name', 'A storage account with this name already exists');
        } else {
          // Generic error handling
          const message = error instanceof Error && error.message ? error.message : null;
          setSubmissionError(message || 'Form submission failed. Please try again.');
        }
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
    >
      {submissionError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Submission Failed</AlertTitle>
          <AlertDescription>{submissionError}</AlertDescription>
        </Alert>
      )}
      <TextField
        label="Account Name"
        value={form.values.name}
        onChange={(value) => form.setValue('name', value)}
        placeholder={!isEditing ? "mystorage01" : undefined}
        error={form.errors.name}
        required
        disabled={isEditing}
      />
      <TextField
        label="Connection String"
        value={form.values.connection_string}
        onChange={(value) => form.setValue('connection_string', value)}
        placeholder={!isEditing ? "DefaultEndpointsProtocol=https;AccountName=..." : undefined}
        error={form.errors.connection_string}
        required
      />
      <div className="grid grid-cols-2 gap-4">
        {isEditing ? (
          <TextField
            label="Location"
            value={form.values.location}
            onChange={() => {}} // No-op since it's disabled
            error={form.errors.location}
            required
            disabled={true}
          />
        ) : (
          <SelectField
            label="Location"
            value={form.values.location}
            onChange={(value) => form.setValue('location', value)}
            options={locationOptions}
            error={form.errors.location}
            required
          />
        )}
      </div>
    </FormDialog>
  );
}