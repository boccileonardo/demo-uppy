/**
 * Reusable UI components
 */

import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '../ui/utils';
import { NotificationState } from '../../types';

interface NotificationProps {
  notification: NotificationState;
  onClose?: () => void;
}

export const Notification: React.FC<NotificationProps> = ({ notification, onClose }) => {
  if (!notification.show) return null;

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  };

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
  };

  const Icon = icons[notification.type];

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-right-5 duration-300">
      <div className={cn(
        'text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2',
        colors[notification.type]
      )}>
        <Icon className="w-5 h-5" />
        <span className="text-sm font-medium">{notification.message}</span>
        {onClose && (
          <button 
            onClick={onClose}
            className="ml-2 text-white hover:text-gray-200"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={cn(
      'animate-spin rounded-full border-b-2 border-blue-600',
      sizeClasses[size],
      className
    )} />
  );
};

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon: Icon, 
  title, 
  description, 
  action 
}) => {
  return (
    <div className="text-center py-8">
      {Icon && <Icon className="w-8 h-8 text-gray-300 mx-auto mb-2" />}
      <p className="text-sm text-gray-500">{title}</p>
      {description && (
        <p className="text-xs text-gray-400 mt-1">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string | number;
  variant?: 'default' | 'success' | 'error';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  label, 
  value, 
  variant = 'default',
  className 
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
  };

  return (
    <div className={cn('flex justify-between', className)}>
      <span className="text-sm text-gray-600">{label}</span>
      <span className={cn(
        'px-2 py-1 rounded text-xs font-medium',
        variants[variant]
      )}>
        {value}
      </span>
    </div>
  );
};

interface FileItemProps {
  filename: string;
  size: number;
  uploadedAt: string;
  status: 'success' | 'error' | 'pending';
  formatFileSize: (bytes: number) => string;
  formatDate: (date: string) => string;
}

export const FileItem: React.FC<FileItemProps> = ({
  filename,
  size,
  uploadedAt,
  status,
  formatFileSize,
  formatDate,
}) => {
  const statusIcons = {
    success: CheckCircle,
    error: XCircle,
    pending: AlertCircle,
  };

  const statusColors = {
    success: 'text-green-500',
    error: 'text-red-500',
    pending: 'text-yellow-500',
  };

  const Icon = statusIcons[status];

  return (
    <div className="flex items-start justify-between">
      <div className="flex items-start space-x-2 flex-1 min-w-0">
        <div className="flex-shrink-0 mt-1">
          <Icon className={cn('w-4 h-4', statusColors[status])} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm truncate" title={filename}>
            {filename}
          </p>
          <p className="text-xs text-gray-500">
            {formatFileSize(size)} • {formatDate(uploadedAt)}
          </p>
        </div>
      </div>
    </div>
  );
};
