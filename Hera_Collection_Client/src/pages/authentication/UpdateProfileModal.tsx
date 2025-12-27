import React, { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Globe, 
  Edit, 
  AlertCircle,
  CheckCircle,
  XCircle 
} from "lucide-react";
import { OrbitProgress } from "react-loading-indicators";

interface UpdateProfileModalProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

// Custom Response Modal for Top-Right
const ResponseModal = ({ 
  type, 
  title, 
  message, 
  isVisible, 
  onClose 
}: { 
  type: 'success' | 'error';
  title: string;
  message: string;
  isVisible: boolean;
  onClose: () => void;
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const bgColor = type === 'success' 
    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800/30' 
    : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/30';
  
  const textColor = type === 'success' 
    ? 'text-green-700 dark:text-green-300' 
    : 'text-red-700 dark:text-red-300';

  return (
    <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-right duration-300">
      <div className={`rounded-lg border p-4 shadow-lg ${bgColor} max-w-sm`}>
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 rounded-full p-1 ${type === 'success' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
            {type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            )}
          </div>
          <div className="flex-1">
            <h3 className={`font-semibold ${textColor}`}>{title}</h3>
            <p className={`text-sm mt-1 ${type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Full page loader component
const FullPageLoader = ({ message = "Updating profile..." }: { message?: string }) => (
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
          Please wait while we update your profile...
        </p>
      </div>
    </div>
  </div>
);

const UpdateProfileModal = ({ trigger, onSuccess }: UpdateProfileModalProps) => {
  const { user, userProfile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFullPageLoader, setShowFullPageLoader] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState("Updating profile...");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  // For custom response modal
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseType, setResponseType] = useState<'success' | 'error'>('success');
  const [responseTitle, setResponseTitle] = useState("");
  const [responseMessage, setResponseMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    bio: "",
    dateOfBirth: "",
  });

  useEffect(() => {
    if (userProfile && open) {
      setFormData({
        name: userProfile.name || "",
        email: userProfile.email || "",
        phone: userProfile.phone || "",
        location: userProfile.location || "",
        website: userProfile.website || "",
        bio: userProfile.bio || "",
        dateOfBirth: userProfile.dateOfBirth 
          ? new Date(userProfile.dateOfBirth).toISOString().split('T')[0]
          : "",
      });
    }
  }, [userProfile, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowFullPageLoader(true);
    setError("");
    setSuccess(false);

    const loadingSteps = [
      { message: "Validating your information...", duration: 800 },
      { message: "Saving profile changes...", duration: 1200 },
      { message: "Updating database records...", duration: 1000 },
      { message: "Finalizing updates...", duration: 500 }
    ];

    try {
      for (const step of loadingSteps) {
        setLoaderMessage(step.message);
        await new Promise(resolve => setTimeout(resolve, step.duration));
      }

      const result = await updateProfile({
        name: formData.name,
        phone: formData.phone,
        location: formData.location,
        website: formData.website,
        bio: formData.bio,
        dateOfBirth: formData.dateOfBirth || undefined,
      });

      if (result.success) {
        setLoaderMessage("Profile updated successfully!");
        await new Promise(resolve => setTimeout(resolve, 800));

        // OPTION 1: Show toast (already configured)
        toast({
          title: "Profile Updated",
          description: "Your profile information has been saved successfully.",
          variant: "default",
          duration: 3000,
        });

        // OPTION 2: Show custom modal
        setResponseType('success');
        setResponseTitle("Profile Updated");
        setResponseMessage("Your profile information has been saved successfully.");
        setShowResponseModal(true);

        // Close modal after delay
        setTimeout(() => {
          setOpen(false);
          setShowFullPageLoader(false);
          setLoading(false);
          
          if (onSuccess) {
            onSuccess();
          }
        }, 500);
      } else {
        throw new Error(result.error || "Failed to update profile");
      }
    } catch (err: any) {
      setShowFullPageLoader(false);
      setLoading(false);
      
      const errorMessage = err.message || "An error occurred while updating profile";
      setError(errorMessage);
      
      // OPTION 1: Show error toast
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 4000,
      });

      // OPTION 2: Show custom error modal
      setResponseType('error');
      setResponseTitle("Update Failed");
      setResponseMessage(errorMessage);
      setShowResponseModal(true);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (showFullPageLoader && open) {
    return (
      <>
        <Dialog open={open} onOpenChange={(newOpen) => !showFullPageLoader && setOpen(newOpen)}>
          <DialogTrigger asChild>
            {trigger || (
              <Button variant="outline" size="sm" className="gap-2">
                <Edit className="h-4 w-4" />
                Update Profile
              </Button>
            )}
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-6">
                <OrbitProgress 
                  color="#32cd32" 
                  size="medium" 
                  text="" 
                  textColor=""
                />
              </div>
              <div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-primary via-primary-light to-primary bg-clip-text text-transparent mb-2">
                  {loaderMessage}
                </h2>
                <p className="text-muted-foreground">
                  Please wait while we update your profile information...
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        {showFullPageLoader && <FullPageLoader message={loaderMessage} />}
      </>
    );
  }

  return (
    <>
      {/* Custom Response Modal */}
      <ResponseModal
        type={responseType}
        title={responseTitle}
        message={responseMessage}
        isVisible={showResponseModal}
        onClose={() => setShowResponseModal(false)}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm" className="gap-2">
              <Edit className="h-4 w-4" />
              Update Profile
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Update Profile
            </DialogTitle>
            <DialogDescription>
              Update your personal information and preferences.
            </DialogDescription>
          </DialogHeader>

          {/* Email change notification */}
          <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-500">
                <strong>Note:</strong> Changing your email will require verification.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+254712345678"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Nairobi, Kenya"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Website
                </Label>
                <Input
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date of Birth
                </Label>
                <Input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself..."
                rows={3}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Brief description about yourself. Max 500 characters.
              </p>
            </div>

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
                disabled={loading}
                className="gradient-primary hover:shadow-glow transition-smooth"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <OrbitProgress color="#FFFFFF" size="small" text="" textColor="" />
                    <span>Updating...</span>
                  </div>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Full page loader overlay */}
      {showFullPageLoader && <FullPageLoader message={loaderMessage} />}
    </>
  );
};

export default UpdateProfileModal;