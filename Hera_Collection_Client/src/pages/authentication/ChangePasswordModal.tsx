import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";

interface ChangePasswordModalProps {
  trigger?: React.ReactNode;
}

const ChangePasswordModal = ({ trigger }: ChangePasswordModalProps) => {
  const { changePassword } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    // Validate passwords
    if (formData.newPassword !== formData.confirmNewPassword) {
      setError("New passwords do not match");
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 8) {
      setError("New password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    // Check password strength
    const hasUpperCase = /[A-Z]/.test(formData.newPassword);
    const hasLowerCase = /[a-z]/.test(formData.newPassword);
    const hasNumbers = /\d/.test(formData.newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      setError("New password must contain uppercase, lowercase, number, and special character");
      setLoading(false);
      return;
    }

    try {
      const result = await changePassword(
        formData.currentPassword,
        formData.newPassword,
        formData.confirmNewPassword
      );

      if (result.success) {
        setSuccess(true);
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmNewPassword: "",
        });
        setTimeout(() => {
          setOpen(false);
          setSuccess(false);
        }, 2000);
      } else {
        setError(result.error || "Failed to change password");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validatePassword = (password: string) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    return requirements;
  };

  const requirements = validatePassword(formData.newPassword);
  const isPasswordValid = Object.values(requirements).every(Boolean);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Lock className="h-4 w-4" />
            Change Password
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </DialogTitle>
          <DialogDescription>
            Update your password for enhanced security.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="text-center py-8">
            <div className="mx-auto h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Password Changed!</h3>
            <p className="text-muted-foreground">
              Your password has been updated successfully.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={formData.currentPassword}
                  onChange={handleChange}
                  placeholder="Enter current password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  name="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Enter new password"
                  required
                  className={formData.newPassword && !isPasswordValid ? "border-destructive" : ""}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {formData.newPassword && (
                <div className="space-y-1 mt-2">
                  <p className="text-xs font-medium">Password Requirements:</p>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div className="flex items-center gap-1">
                      <div className={`h-2 w-2 rounded-full ${requirements.length ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className={requirements.length ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                        At least 8 characters
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`h-2 w-2 rounded-full ${requirements.uppercase ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className={requirements.uppercase ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                        Uppercase letter
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`h-2 w-2 rounded-full ${requirements.lowercase ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className={requirements.lowercase ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                        Lowercase letter
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`h-2 w-2 rounded-full ${requirements.number ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className={requirements.number ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                        Number
                      </span>
                    </div>
                    <div className="flex items-center gap-1 col-span-2">
                      <div className={`h-2 w-2 rounded-full ${requirements.special ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className={requirements.special ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                        Special character
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmNewPassword"
                  name="confirmNewPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmNewPassword}
                  onChange={handleChange}
                  placeholder="Confirm new password"
                  required
                  className={
                    formData.confirmNewPassword && 
                    formData.newPassword !== formData.confirmNewPassword
                      ? "border-destructive"
                      : ""
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {formData.confirmNewPassword && 
               formData.newPassword !== formData.confirmNewPassword && (
                <p className="text-xs text-destructive">Passwords do not match</p>
              )}
            </div>

            <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <AlertDescription className="text-sm">
                After changing your password, you'll be logged out from all other devices.
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading || !isPasswordValid || !formData.currentPassword || formData.newPassword !== formData.confirmNewPassword}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Changing...
                  </>
                ) : (
                  "Change Password"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordModal;