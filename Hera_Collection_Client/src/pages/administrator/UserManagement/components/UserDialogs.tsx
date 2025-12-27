import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { User } from '../types/users';
import { OrbitProgress } from 'react-loading-indicators';

interface UserDialogsProps {
  selectedUser: User | null;
  isDeleteDialogOpen: boolean;
  isEditDialogOpen: boolean;
  isViewDialogOpen: boolean;
  onDeleteDialogChange: (open: boolean) => void;
  onEditDialogChange: (open: boolean) => void;
  onViewDialogChange: (open: boolean) => void;
  onDeleteUser: () => void;
  onSaveEdit: (updatedUser: Partial<User>) => void;
  isLoading?: boolean;
}

const UserDialogs: React.FC<UserDialogsProps> = ({
  selectedUser,
  isDeleteDialogOpen,
  isEditDialogOpen,
  isViewDialogOpen,
  onDeleteDialogChange,
  onEditDialogChange,
  onViewDialogChange,
  onDeleteUser,
  onSaveEdit,
  isLoading = false
}) => {
  const [editForm, setEditForm] = React.useState<Partial<User>>({});

  React.useEffect(() => {
    if (selectedUser) {
      setEditForm({
        firstName: selectedUser.firstName || '',
        lastName: selectedUser.lastName || '',
        email: selectedUser.email || '',
        role: selectedUser.role || 'USER',
        isActive: selectedUser.isActive !== undefined ? selectedUser.isActive : true,
        isVerified: selectedUser.isVerified || false,
      });
    }
  }, [selectedUser, isEditDialogOpen]);

  const handleSave = () => {
    if (selectedUser && editForm) {
      onSaveEdit(editForm);
    }
  };

  if (!selectedUser) return null;

  return (
    <>
      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={onDeleteDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUser.firstName} {selectedUser.lastName} ({selectedUser.email})?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onDeleteDialogChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onDeleteUser}
              disabled={isLoading}
            >
              {isLoading ? (
                <OrbitProgress color="#ffffff" size="small" text="" textColor="" />
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={onEditDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Make changes to user profile here.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="firstName" className="text-right">
                First Name
              </Label>
              <Input
                id="firstName"
                value={editForm.firstName || ''}
                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                className="col-span-3"
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lastName" className="text-right">
                Last Name
              </Label>
              <Input
                id="lastName"
                value={editForm.lastName || ''}
                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                className="col-span-3"
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={editForm.email || ''}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="col-span-3"
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select
                value={editForm.role || 'USER'}
                onValueChange={(value) => setEditForm({ ...editForm, role: value as any })}
                disabled={isLoading}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">
                Active
              </Label>
              <Switch
                id="isActive"
                checked={editForm.isActive}
                onCheckedChange={(checked) => setEditForm({ ...editForm, isActive: checked })}
                disabled={isLoading}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isVerified" className="text-right">
                Verified
              </Label>
              <Switch
                id="isVerified"
                checked={editForm.isVerified}
                onCheckedChange={(checked) => setEditForm({ ...editForm, isVerified: checked })}
                disabled={isLoading}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onEditDialogChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <OrbitProgress color="#ffffff" size="small" text="" textColor="" />
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={onViewDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View detailed information about {selectedUser.firstName} {selectedUser.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-semibold">Name:</Label>
              <div className="col-span-3">
                {selectedUser.firstName} {selectedUser.lastName}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-semibold">Email:</Label>
              <div className="col-span-3">{selectedUser.email}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-semibold">Role:</Label>
              <div className="col-span-3">{selectedUser.role}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-semibold">Status:</Label>
              <div className="col-span-3">
                <span className={`px-2 py-1 rounded text-xs ${selectedUser.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {selectedUser.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-semibold">Verified:</Label>
              <div className="col-span-3">
                <span className={`px-2 py-1 rounded text-xs ${selectedUser.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {selectedUser.isVerified ? 'Verified' : 'Not Verified'}
                </span>
              </div>
            </div>
            {selectedUser.createdAt && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">Created:</Label>
                <div className="col-span-3">
                  {new Date(selectedUser.createdAt).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => onViewDialogChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserDialogs;