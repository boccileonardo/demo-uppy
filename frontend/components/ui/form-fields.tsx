import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { cn } from '../ui/utils';

interface BaseFieldProps {
  label: string;
  id?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

interface TextFieldProps extends BaseFieldProps {
  type?: 'text' | 'email' | 'password';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function TextField({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required,
  disabled,
  className,
}: TextFieldProps) {
  const fieldId = id || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={fieldId}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        id={fieldId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={error ? 'border-red-500' : ''}
      />
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
}

export function SelectField({
  label,
  id,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  error,
  required,
  disabled,
  className,
}: SelectFieldProps) {
  const fieldId = id || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={fieldId}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className={error ? 'border-red-500' : ''}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
