import { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert } from './ui/alert';
import { Copy, CheckCircle, Eye, EyeOff, AlertTriangle } from 'lucide-react';

interface TemporaryPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userEmail: string;
  temporaryPassword: string;
}

export function TemporaryPasswordModal({
  isOpen,
  onClose,
  userName,
  userEmail,
  temporaryPassword
}: TemporaryPasswordModalProps) {
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy password:', err);
    }
  };

  const handleClose = () => {
    setCopied(false);
    setShowPassword(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span>User Created Successfully</span>
          </DialogTitle>
          <DialogDescription>
            A new user account has been created for <strong>{userName}</strong> ({userEmail}).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <div className="ml-2 text-sm text-amber-800">
              <strong>Important:</strong> Please save this temporary password. It will not be displayed again.
            </div>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="temp-password" className="text-sm font-medium">
              Temporary Password
            </Label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Input
                  id="temp-password"
                  type={showPassword ? "text" : "password"}
                  value={temporaryPassword}
                  readOnly
                  className="pr-10 font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-500" />
                  )}
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className={copied ? "text-green-600 border-green-300" : ""}
              >
                {copied ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            {copied && (
              <p className="text-xs text-green-600">Password copied to clipboard!</p>
            )}
          </div>

          <div className="text-sm text-gray-600 space-y-1">
            <p>• Share this password with <strong>{userName}</strong> to allow them to log in</p>
            <p>• They will be required to set a new password on their first login</p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleClose} className="w-full">
            I have saved the password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
