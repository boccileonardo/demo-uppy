import { useEffect, useState } from 'react';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
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
      enabled: true, // Always fetch containers data
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
  
  const validationRules = [
    { field: 'email' as const, validator: validators.required('Email is required') },
    { field: 'email' as const, validator: validators.email() },
    { field: 'name' as const, validator: validators.required('Name is required') },
    { field: 'container_id' as const, validator: validators.required('Container is required') },
  ];

  const form = useForm(
    {
      email: '',
      name: '',
      role: 'user' as 'user' | 'admin',
      container_id: '',
    }, 
    validationRules
  );

  // Update form fields when the form is opened or when container data changes
  useEffect(() => {
    if (open && containersWithAccounts) {
      if (isEditing && user) {
        // For editing, set values based on the user data
        const containerId = findContainerId();
        form.setValues({
          email: user.email || '',
          name: user.name || '',
          role: (user.role as 'user' | 'admin') || 'user',
          container_id: containerId
        });
      } else {
        // For new user, reset to initial state
        form.reset();
      }
    }
  }, [open, user, containersWithAccounts]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset();
      setSubmissionError(null);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

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
        // Check if error is due to duplicate email
        if (error instanceof Error && error.message.includes('already exists')) {
          form.setError('email', 'A user with this email already exists');
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
    setSubmissionError(null);
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
    >
      {submissionError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Submission Failed</AlertTitle>
          <AlertDescription>{submissionError}</AlertDescription>
        </Alert>
      )}
      <TextField
        label="Email"
        type="email"
        value={form.values.email}
        onChange={(value) => form.setValue('email', value)}
        placeholder={!isEditing ? "user@example.com" : undefined}
        error={form.errors.email}
        required
        disabled={isEditing} // Email should not be editable
        key={`email-${isEditing ? user?.id : 'new'}`}
      />
      <TextField
        label="Full Name"
        value={form.values.name}
        onChange={(value) => form.setValue('name', value)}
        placeholder={!isEditing ? "John Doe" : undefined}
        error={form.errors.name}
        required
        key={`name-${isEditing ? user?.id : 'new'}`}
      />
      <SelectField
        label="Role"
        value={form.values.role}
        onChange={(value) => form.setValue('role', value)}
        options={roleOptions}
        error={form.errors.role}
        required
        key={`role-${isEditing ? user?.id : 'new'}`}
      />
      <SelectField
        label="Container & Storage Account"
        value={form.values.container_id}
        onChange={(value) => form.setValue('container_id', value)}
        options={containerOptions}
        error={form.errors.container_id}
        placeholder={containersLoading ? "Loading containers..." : "Select container"}
        required
        key={`container-${isEditing ? user?.id : 'new'}`}
      />
    </FormDialog>
  );
}
