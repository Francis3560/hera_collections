import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { User } from '../types/users';

interface UserSearchFiltersProps {
  filters: {
    role: string;
    status: string;
    verification: string;
    search: string;
  };
  onFilterChange: (filters: Partial<{
    role: string;
    status: string;
    verification: string;
    search: string;
  }>) => void;
  filteredUsers: User[];
}

const UserSearchFilters: React.FC<UserSearchFiltersProps> = ({ 
  filters, 
  onFilterChange, 
  filteredUsers 
}) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search users..."
              value={filters.search}
              onChange={(e) => onFilterChange({ search: e.target.value })}
              className="pl-9"
            />
          </div>
          
          <div className="space-y-3">
            <div>
              <Label className="text-sm">Role</Label>
              <Select
                value={filters.role}
                onValueChange={(value) => onFilterChange({ role: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="STAFF">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => onFilterChange({ status: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm">Verification</Label>
              <Select
                value={filters.verification}
                onValueChange={(value) => onFilterChange({ verification: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserSearchFilters;