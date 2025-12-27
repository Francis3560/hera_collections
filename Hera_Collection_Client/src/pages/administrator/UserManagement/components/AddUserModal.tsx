import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Key, Shield, Mail, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { OrbitProgress } from 'react-loading-indicators';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newUser: any) => void;
  userService?: any; // Optional: pass userService as prop from parent
}

// Full page loader component matching your login page style
const FullPageLoader = ({ message = "Processing..." }: { message?: string }) => (
  <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="text-center space-y-6">
      <OrbitProgress 
        color="#32cd32" 
        size="medium" 
        text="" 
        textColor=""
      />
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary via-primary-light to-primary bg-clip-text text-transparent mb-2">
          {message}
        </h2>
        <p className="text-muted-foreground">
          Please wait while we process your request...
        </p>
      </div>
    </div>
  </div>
);

const AddUserModal: React.FC<AddUserModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  userService: propUserService // Accept userService as prop
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'USER',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const roles = [
    { value: 'USER', label: 'User', description: 'Regular user account' },
    { value: 'ADMIN', label: 'Administrator', description: 'Full system access' },
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Full name validation
    if (!formData.fullName?.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    // Phone validation (optional but must be valid if provided)
    if (formData.phone && !/^(\+254|254|0)?[7]\d{8}$/.test(formData.phone.replace(/\s+/g, ''))) {
      newErrors.phone = 'Please enter a valid Kenyan phone number';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and numbers';
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generatePassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one of each required character type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)];
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    setFormData(prev => ({
      ...prev,
      password: password,
      confirmPassword: password,
    }));
    
    // Clear password errors if any
    setErrors(prev => ({
      ...prev,
      password: '',
      confirmPassword: '',
    }));
  };

  const formatPhoneNumber = (phone: string) => {
    // Remove all non-digit characters
    let digits = phone.replace(/\D/g, '');
    
    // If starts with 0, convert to +254
    if (digits.startsWith('0')) {
      digits = '254' + digits.substring(1);
    }
    // If starts with 254, keep as is
    else if (digits.startsWith('254')) {
      digits = digits;
    }
    // If starts with 7 (without country code), add 254
    else if (digits.startsWith('7') && digits.length === 9) {
      digits = '254' + digits;
    }
    
    return digits;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePhoneChange = (value: string) => {
    // Format phone number as user types
    let formatted = value.replace(/\D/g, '');
    
    if (formatted.startsWith('254') && formatted.length > 3) {
      formatted = `+${formatted.substring(0, 3)} ${formatted.substring(3, 6)} ${formatted.substring(6, 9)} ${formatted.substring(9)}`;
    } else if (formatted.startsWith('0') && formatted.length > 1) {
      formatted = `0${formatted.substring(1, 4)} ${formatted.substring(4, 7)} ${formatted.substring(7)}`;
    }
    
    handleInputChange('phone', formatted.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('=== DEBUG: Form submission started ===');

    if (!validateForm()) {
      console.log('Validation failed:', errors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare user data according to your backend schema
      const userData = {
        name: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone ? formatPhoneNumber(formData.phone) : undefined,
        role: formData.role,
        password: formData.password,
      };

      console.log('Creating user with data:', userData);
      console.log('JSON payload:', JSON.stringify(userData, null, 2));

      // Determine which userService to use
      let userService;
      
      if (propUserService) {
        // Use the service passed as prop
        userService = propUserService;
        console.log('Using userService passed as prop');
      } else {
        // Fallback to direct fetch since imports are failing
        console.log('Using direct fetch since userService import failed');
        await submitWithDirectFetch(userData);
        return; // Exit early since direct fetch handles everything
      }

      // Make the actual API call
      console.log('Making API call to /users endpoint...');
      const response = await userService.createUser(userData);
      
      console.log('API Response received:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });

      toast({
        title: 'Success',
        description: 'User created successfully',
      });

      onSuccess(response.data);
      handleClose();

    } catch (error: any) {
      console.error('=== DEBUG: Full error details ===', error);
      
      let errorMessage = 'Failed to create user. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('Error message to display:', errorMessage);
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Direct fetch fallback method
  const submitWithDirectFetch = async (userData: any) => {
    try {
      console.log('Using direct fetch to submit data...');
      
      // Try to get API URL from environment, fallback to default
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      console.log('API URL:', apiUrl);
      
      const response = await fetch(`${apiUrl}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('hera_accessToken') || ''}`
        },
        body: JSON.stringify(userData)
      });

      console.log('Direct fetch response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (jsonError) {
          errorData = { message: `HTTP error! status: ${response.status}` };
        }
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Direct fetch result:', result);

      toast({
        title: 'Success',
        description: 'User created successfully',
      });

      onSuccess(result);
      handleClose();
    } catch (error: any) {
      console.error('Direct fetch error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create user',
        variant: 'destructive',
      });
      throw error; // Re-throw to be caught by outer catch
    }
  };

  const handleClose = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      role: 'USER',
      password: '',
      confirmPassword: '',
    });
    setErrors({});
    onClose();
  };

  return (
    <>
      {/* Full-page transparent loader overlay - Matching login page style */}
      {isSubmitting && (
        <FullPageLoader 
          message="Creating User Account"
        />
      )}

      {/* Main dialog */}
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Add New User
            </DialogTitle>
            <DialogDescription>
              Create a new user account with role, full name, phone number, and password.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address <span className="text-destructive">*</span>
                </div>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={errors.email ? 'border-destructive' : ''}
                placeholder="john.doe@example.com"
                disabled={isSubmitting}
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className={errors.fullName ? 'border-destructive' : ''}
                placeholder="John Doe"
                disabled={isSubmitting}
                autoComplete="name"
              />
              {errors.fullName && (
                <p className="text-sm text-destructive">{errors.fullName}</p>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number (Optional)
                </div>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className={errors.phone ? 'border-destructive' : ''}
                placeholder="+254 700 000 000"
                disabled={isSubmitting}
                autoComplete="tel"
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Format: +254 700 000 000 or 0700 000 000
              </p>
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Role <span className="text-destructive">*</span>
                </div>
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleInputChange('role', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger className={errors.role ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex flex-col">
                        <span>{role.label}</span>
                        <span className="text-xs text-muted-foreground">{role.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-destructive">{errors.role}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    Password <span className="text-destructive">*</span>
                  </div>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generatePassword}
                  disabled={isSubmitting}
                >
                  Generate
                </Button>
              </div>
              
              <div className="space-y-2">
                <Input
                  id="password"
                  type="text"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={errors.password ? 'border-destructive' : ''}
                  placeholder="Enter password"
                  disabled={isSubmitting}
                  autoComplete="new-password"
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirm Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="confirmPassword"
                  type="text"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={errors.confirmPassword ? 'border-destructive' : ''}
                  placeholder="Confirm password"
                  disabled={isSubmitting}
                  autoComplete="new-password"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="text-sm font-medium mb-2">Password Strength</div>
                  <div className="flex gap-1 mb-2">
                    {[1, 2, 3, 4].map((level) => {
                      const hasLower = /[a-z]/.test(formData.password);
                      const hasUpper = /[A-Z]/.test(formData.password);
                      const hasNumber = /\d/.test(formData.password);
                      const hasSpecial = /[!@#$%^&*]/.test(formData.password);
                      const isLong = formData.password.length >= 12;
                      
                      const score = [
                        formData.password.length >= 8,
                        hasLower && hasUpper,
                        hasNumber,
                        hasSpecial || isLong,
                      ].filter(Boolean).length;
                      
                      return (
                        <div
                          key={level}
                          className={`flex-1 h-2 rounded-full transition-colors ${
                            level <= score
                              ? score >= 4 ? 'bg-green-500' :
                                score >= 3 ? 'bg-primary' :
                                score >= 2 ? 'bg-yellow-500' :
                                'bg-red-500'
                              : 'bg-muted'
                          }`}
                        />
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Strong passwords have uppercase, lowercase, numbers, and are at least 8 characters.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-32"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <OrbitProgress color="#ffffff" size="small" text="" textColor="" />
                    <span>Creating...</span>
                  </div>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create User
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddUserModal;