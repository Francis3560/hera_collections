import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical, Eye, Edit, Ban, CheckCircle, Trash2 } from 'lucide-react';
import { User } from '../types/user.types';

interface UserActionsDropdownProps {
  user: User;
  onView: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}

const UserActionsDropdown: React.FC<UserActionsDropdownProps> = ({
  user,
  onView,
  onEdit,
  onToggleStatus,
  onDelete
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onView}>
          <Eye className="w-4 h-4 mr-2" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>
          <Edit className="w-4 h-4 mr-2" />
          Edit User
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={onToggleStatus}
          className={user.isActive ? "text-red-600" : "text-green-600"}
        >
          {user.isActive ? (
            <>
              <Ban className="w-4 h-4 mr-2" />
              Deactivate
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Activate
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={onDelete}
          className="text-red-600"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete User
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserActionsDropdown;