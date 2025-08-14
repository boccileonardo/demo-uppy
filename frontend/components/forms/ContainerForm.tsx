import { useEffect, useState } from 'react';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { FormDialog } from '../ui/dialogs';
import { TextField, SelectField } from '../ui/form-fields';
import { useForm, validators } from '../../hooks/useForm';

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
  
  // Update form fields when the form is opened
  useEffect(() => {
    if (open) {
      // Reset the form whenever it opens
      form.reset();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  
  const activeAccountOptions = storageAccounts
    .filter(account => account.isActive)
    .map(account => ({
      value: account.id,
      label: account.name,
    }));

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
        // Check if error is due to duplicate container name
        if (error instanceof Error && error.message.includes('already exists')) {
          form.setError('name', 'A container with this name already exists');
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
      title="Create New Container"
      description="Add a new container to an existing storage account."
      onSubmit={handleSubmit}
      submitLabel="Create Container"
      isSubmitting={form.isSubmitting}
    >
      {submissionError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Submission Failed</AlertTitle>
          <AlertDescription>{submissionError}</AlertDescription>
        </Alert>
      )}
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
