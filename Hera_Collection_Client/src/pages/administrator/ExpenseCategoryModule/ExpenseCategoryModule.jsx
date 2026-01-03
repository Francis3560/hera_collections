import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import ExpenseCategoryService from '@/api/expenseCategory.service';
import { 
  Loader2, 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  FolderTree, 
  Info, 
  Palette, 
  Type,
  LayoutGrid
} from 'lucide-react';
import { motion } from 'framer-motion';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import * as Icons from 'lucide-react';

// Schema
const expenseCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  description: z.string().max(500).optional().or(z.literal('')),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color').optional().or(z.literal('')),
  icon: z.string().max(50).optional().or(z.literal('')),
});

const ExpenseCategoryModule = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(expenseCategorySchema),
    defaultValues: {
      name: '',
      description: '',
      color: '#6366f1',
      icon: 'FolderTree',
    },
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await ExpenseCategoryService.getAllCategories({ search: searchQuery });
      setCategories(response.data);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch expense categories.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCategories();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const onSubmit = async (data) => {
    try {
      if (isEditing && currentCategory) {
        await ExpenseCategoryService.updateCategory(currentCategory.id, data);
        toast({ title: 'Success', description: 'Expense category updated successfully.' });
      } else {
        await ExpenseCategoryService.createCategory(data);
        toast({ title: 'Success', description: 'Expense category created successfully.' });
      }
      setIsDialogOpen(false);
      resetForm();
      fetchCategories();
    } catch (error) {
        const message = error.response?.data?.message || 'Something went wrong.';
        toast({
            variant: 'destructive',
            title: 'Error',
            description: message,
        });
    }
  };

  const handleEdit = (category) => {
    setIsEditing(true);
    setCurrentCategory(category);
    form.reset({
      name: category.name,
      description: category.description || '',
      color: category.color || '#6366f1',
      icon: category.icon || 'FolderTree',
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      await ExpenseCategoryService.deleteCategory(categoryToDelete.id);
      toast({ title: 'Success', description: 'Expense category deleted successfully.' });
      fetchCategories();
    } catch (error) {
        const message = error.response?.data?.message || 'Failed to delete category.';
        toast({
            variant: 'destructive',
            title: 'Error',
            description: message,
        });
    } finally {
        setIsDeleting(false);
        setIsDeleteModalOpen(false);
        setCategoryToDelete(null);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentCategory(null);
    form.reset({
      name: '',
      description: '',
      color: '#6366f1',
      icon: 'FolderTree',
    });
  };

  const handleDialogChange = (open) => {
    setIsDialogOpen(open);
    if (!open) resetForm();
  };

  // Helper to render icon
  const renderIcon = (iconName, size = 20, className = "") => {
    const IconComponent = Icons[iconName] || Icons.FolderTree;
    return <IconComponent size={size} className={className} />;
  };

  return (
    <div className="space-y-8 p-6 lg:p-8 pb-20 animate-fade-in max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
        <div className="space-y-3">
          <Badge variant="outline" className="px-4 py-1.5 border-primary/20 bg-primary/5 text-primary text-xs font-bold uppercase tracking-widest animate-scale-in">
            Financial Infrastructure
          </Badge>
          <h2 className="text-4xl lg:text-6xl font-black tracking-tight gradient-text leading-tight">
            Expense Categories
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl font-medium">
            Classify and track your operational expenditures with precision.
          </p>
        </div>
        <Button 
          onClick={() => setIsDialogOpen(true)} 
          className="btn-primary flex items-center gap-2 px-8 h-14 text-base font-bold group"
        >
          <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-500" />
          Create Category
        </Button>
      </div>

      {/* Search and Stats Section */}
      <div className="flex flex-col md:flex-row items-center gap-6 bg-white/5 dark:bg-zinc-900/30 p-6 rounded-3xl border border-white/10 backdrop-blur-2xl shadow-strong">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-all duration-300" />
          <Input 
            placeholder="Search expense classifications..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-14 h-14 bg-background/50 focus:bg-background border-white/20 focus:border-primary/50 focus:ring-primary/20 rounded-2xl text-base transition-all shadow-inner"
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex-1 md:flex-none flex items-center justify-center gap-3 px-6 py-4 bg-primary/5 border border-primary/10 rounded-2xl">
            <FolderTree className="h-5 w-5 text-primary" />
            <span className="text-base font-bold text-primary">{categories.length}</span>
            <span className="text-sm text-muted-foreground font-semibold uppercase tracking-wider">Categories</span>
          </div>
        </div>
      </div>

      {/* Categories Table */}
      <div className="glass-card !p-0 overflow-hidden shadow-strong border-white/10 dark:border-white/5 animate-slide-up">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50 border-white/10">
              <TableRow className="hover:bg-transparent border-white/10">
                <TableHead className="w-[80px] text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground py-6 px-8">ID</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground py-6">Identity</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground py-6">Usage</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground py-6 hidden md:table-cell">Overview</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground py-6 px-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
                      <p className="text-sm font-medium text-muted-foreground">Loading Classifications...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 opacity-50">
                      <div className="p-4 bg-muted rounded-full">
                        <Search className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-lg font-medium text-muted-foreground">No matches found in finance records</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow 
                    key={category.id} 
                    className="group border-white/5 hover:bg-primary/[0.02] dark:hover:bg-primary/[0.05] transition-colors"
                  >
                    <TableCell className="py-6 px-8 font-mono text-[10px] font-bold text-muted-foreground/60">
                      #{category.id.toString().padStart(3, '0')}
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="flex items-center gap-4">
                        <div 
                           className="h-12 w-12 rounded-xl flex items-center justify-center border border-white/10 shadow-soft group-hover:scale-110 transition-transform duration-500"
                           style={{ backgroundColor: `${category.color}20`, color: category.color }}
                        >
                          {renderIcon(category.icon, 20)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-lg group-hover:text-primary transition-colors">{category.name}</span>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{category.icon || 'DefaultIcon'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold px-3 py-1 bg-white/5 border border-white/10 rounded-lg w-fit">
                          {category._count?.expenses || 0} Expenses Linked
                        </span>
                        <div className="flex items-center gap-1.5 ml-1">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: category.color }} />
                          <span className="text-[10px] font-mono text-muted-foreground uppercase">{category.color}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 text-muted-foreground font-medium text-sm max-w-[300px] truncate hidden md:table-cell">
                      {category.description || 'Global operational category'}
                    </TableCell>
                    <TableCell className="py-6 px-8 text-right">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEdit(category)} 
                          className="h-12 w-12 rounded-2xl hover:bg-primary/20 hover:text-primary dark:hover:bg-primary/10 transition-bounce text-foreground"
                        >
                          <Pencil className="h-5 w-5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteClick(category)} 
                          className="h-12 w-12 rounded-2xl hover:bg-red-500/20 hover:text-red-500 dark:hover:bg-red-500/10 transition-bounce"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Dialog for Create/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-[900px] p-0 overflow-hidden border-none glass-card shadow-strong animate-scale-in text-foreground">
          <div className="flex flex-col h-[90vh] md:h-auto max-h-[90vh]">
            {/* Header */}
            <div className="p-8 pb-0">
              <DialogHeader>
                <div className="flex items-center gap-4 mb-2">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <FolderTree className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-3xl font-black tracking-tight gradient-text">
                      {isEditing ? 'Refine Classification' : 'New Classification'}
                    </DialogTitle>
                    <DialogDescription className="text-base font-medium text-muted-foreground">
                      {isEditing 
                        ? 'Adjust the financial identity of this expense segment.' 
                        : 'Define a new structural element for your expenditure tracking.'
                      }
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
            </div>

            <ScrollArea className="flex-1 px-8 py-6">
              <Form {...form}>
                <form id="expense-category-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Core Identity */}
                    <div className="space-y-6">
                      <Card className="bg-white/5 border-white/10 shadow-soft overflow-hidden border-none">
                        <CardHeader className="pb-4 bg-primary/5 border-b border-white/5">
                          <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
                            <Type className="h-4 w-4 text-primary" /> Metadata
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-wider opacity-70">Category Name</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="e.g., Marketing & Growth" 
                                    {...field} 
                                    className="bg-background/50 focus:bg-background border-white/10 h-12 rounded-xl transition-all font-bold text-base"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-wider opacity-70">Contextual Narrative</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Define the scope of expenditures for this segment..." 
                                    {...field} 
                                    className="resize-none bg-background/50 focus:bg-background border-white/10 rounded-xl transition-all min-h-[140px] font-medium" 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>
                    </div>

                    {/* Right Column: Visual Brand */}
                    <div className="space-y-6">
                      <Card className="bg-white/5 border-white/10 shadow-soft overflow-hidden h-full border-none">
                        <CardHeader className="pb-4 bg-primary/5 border-b border-white/5">
                          <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
                            <Palette className="h-4 w-4 text-primary" /> Visual Brand
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                          <div className="grid grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="color"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-black uppercase tracking-wider opacity-70">Signature Color</FormLabel>
                                  <div className="flex items-center gap-3">
                                    <FormControl>
                                      <div className="relative h-12 w-full">
                                        <Input 
                                          type="color" 
                                          {...field} 
                                          className="h-12 w-full p-1 bg-background/50 border-white/10 rounded-xl cursor-pointer"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                          <div className="h-4 w-4 rounded-full shadow-glow" style={{ backgroundColor: field.value }} />
                                        </div>
                                      </div>
                                    </FormControl>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="icon"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-black uppercase tracking-wider opacity-70">Identifier Icon</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary opacity-50">
                                         {renderIcon(field.value, 18)}
                                      </div>
                                      <Input 
                                        placeholder="Lucide Icon Name" 
                                        {...field} 
                                        className="pl-10 bg-background/50 focus:bg-background border-white/10 h-12 rounded-xl transition-all font-mono text-xs"
                                      />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="space-y-3">
                            <FormLabel className="text-xs font-black uppercase tracking-wider opacity-70">Category Preview</FormLabel>
                            <div 
                               className="aspect-video rounded-3xl border border-white/10 flex flex-col items-center justify-center gap-4 transition-all duration-500 overflow-hidden relative group"
                               style={{ backgroundColor: `${form.watch('color')}15` }}
                            >
                              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />
                              <div 
                                className="h-20 w-20 rounded-2xl flex items-center justify-center shadow-strong animate-float"
                                style={{ backgroundColor: `${form.watch('color')}40`, color: form.watch('color') }}
                              >
                                {renderIcon(form.watch('icon'), 36)}
                              </div>
                              <div className="text-center z-10">
                                <p className="font-black text-xl" style={{ color: form.watch('color') }}>{form.watch('name') || 'New Category'}</p>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Preview Identification</p>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex gap-3 items-start">
                            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                              Choose a high-contrast color and a semantic Lucide icon (e.g., Receipt, CreditCard, ShoppingBag) for clear visual tracking.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </form>
              </Form>
            </ScrollArea>

            {/* Footer Actions */}
            <div className="p-8 pt-6 border-t border-white/5 bg-black/20">
              <DialogFooter className="flex-row sm:justify-end gap-3 items-center">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsDialogOpen(false)} 
                  className="h-14 rounded-2xl px-8 font-black text-xs uppercase tracking-widest border-white/10 hover:bg-white/5"
                >
                  Discard
                </Button>
                <Button 
                  form="expense-category-form"
                  type="submit" 
                  disabled={form.formState.isSubmitting}
                  className="h-14 rounded-2xl px-12 btn-primary font-black text-xs uppercase tracking-widest shadow-glow min-w-[200px]"
                >
                  {form.formState.isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : isEditing ? 'Update Registry' : 'Initialize Category'}
                </Button>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          isLoading={isDeleting}
          title="Archive Classification?"
          description="This will permanently delete this expense classification. It can only be removed if no expenditures are assigned to it."
          confirmText="Delete Registry"
      >
          {categoryToDelete && (
              <div className="flex items-center gap-4">
                  <div 
                    className="h-16 w-16 rounded-xl flex items-center justify-center border border-white/10 shrink-0 shadow-soft"
                    style={{ backgroundColor: `${categoryToDelete.color}20`, color: categoryToDelete.color }}
                  >
                      {renderIcon(categoryToDelete.icon, 24)}
                  </div>
                  <div className="flex flex-col">
                      <span className="font-black text-foreground break-words">{categoryToDelete.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: categoryToDelete.color }} />
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{categoryToDelete.color}</span>
                      </div>
                  </div>
              </div>
          )}
      </ConfirmModal>
    </div>
  );
};

export default ExpenseCategoryModule;
