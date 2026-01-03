import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import discountService from '@/api/discount.service';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Calendar, Tag, Percent } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';

export default function DiscountList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: discounts, isLoading } = useQuery({
    queryKey: ['discounts'],
    queryFn: () => discountService.getAllDiscounts(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => discountService.deleteDiscount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      toast.success('Discount deleted successfully');
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete discount');
    },
  });

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  const isActive = (start: string, end: string, active: boolean) => {
    if (!active) return false;
    const now = new Date();
    return now >= new Date(start) && now <= new Date(end);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Discounts & Offers</h2>
          <p className="text-muted-foreground">Manage promo offers and product discounts.</p>
        </div>
        <Button onClick={() => navigate('/admin/discounts/new')} className="gap-2">
          <Plus className="h-4 w-4" /> Create Discount
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {discounts?.data?.map((discount: any) => {
          const active = isActive(discount.startDate, discount.endDate, discount.isActive);
          
          return (
            <div key={discount.id} className="group relative bg-card rounded-xl border shadow-sm hover:shadow-md transition-all duration-300">
              <div className="absolute top-4 right-4 flex gap-2">
                  <Badge variant={active ? "default" : "secondary"} className={active ? "bg-green-500 hover:bg-green-600" : ""}>
                    {active ? "Active" : "Inactive"}
                  </Badge>
              </div>
              
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Percent className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg line-clamp-1">{discount.name}</h3>
                    <p className="text-sm text-primary font-bold">{discount.discountPercentage}% OFF</p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-6 line-clamp-2 h-10">
                  {discount.description || "No description provided."}
                </p>

                <div className="space-y-3 text-sm text-muted-foreground border-t pt-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(discount.startDate), 'MMM dd')} - {format(new Date(discount.endDate), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    <span>{discount._count?.products || 0} Products Linked</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/discounts/${discount.id}`)}>
                    <Pencil className="h-4 w-4 mr-2" /> Edit
                  </Button>
                  
                  <AlertDialog open={deleteId === discount.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteId(discount.id)}>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the discount "{discount.name}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          );
        })}

        {(!discounts?.data || discounts.data.length === 0) && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-center border-2 border-dashed rounded-xl">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Tag className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No discounts found</h3>
                <p className="text-muted-foreground mb-4">Create your first discount offer to start boosting sales.</p>
                <Button onClick={() => navigate('/admin/discounts/new')}>Create Discount</Button>
            </div>
        )}
      </div>
    </div>
  );
}
