import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { API_BASE_URL } from '@/utils/axiosClient';
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
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import CategoryService from '@/api/categories.service';
import { Loader2, Plus, Pencil, Trash2, Search, Upload, X, Tag, Info, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

// Schema
const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
});

const CategoryModule = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  
  // Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
    },
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await CategoryService.getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch categories.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Auto-generate slug from name if slug is untouched/empty
  const handleNameChange = (e) => {
    const name = e.target.value;
    form.setValue('name', name);
    
    // Only auto-generate if we are creating new or if user hasn't manually edited slug significantly
    if (!isEditing || !currentCategory) {
       const slug = name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
       form.setValue('slug', slug);
    }
  };

  const onSubmit = async (data) => {
    try {
      if (isEditing && currentCategory) {
        await CategoryService.updateCategory(currentCategory.id, data, coverPhoto);
        toast({ title: 'Success', description: 'Category updated successfully.' });
      } else {
        await CategoryService.createCategory(data, coverPhoto);
        toast({ title: 'Success', description: 'Category created successfully.' });
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
      slug: category.slug,
      description: category.description || '',
    });
    if (category.coverPhoto) {
      setPhotoPreview(category.coverPhoto.startsWith('http') ? category.coverPhoto : `${API_BASE_URL}${category.coverPhoto}`);
    }
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
      await CategoryService.deleteCategory(categoryToDelete.id);
      toast({ title: 'Success', description: 'Category deleted successfully.' });
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
    setCoverPhoto(null);
    setPhotoPreview(null);
    form.reset({
      name: '',
      slug: '',
      description: '',
    });
  };

  const handleDialogChange = (open) => {
    setIsDialogOpen(open);
    if (!open) resetForm();
  };

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    cat.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 p-6 lg:p-8 pb-20 animate-fade-in max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
        <div className="space-y-3">
          <Badge variant="outline" className="px-4 py-1.5 border-primary/20 bg-primary/5 text-primary text-xs font-bold uppercase tracking-widest animate-scale-in">
            Catalog Management
          </Badge>
          <h2 className="text-4xl lg:text-6xl font-black tracking-tight gradient-text leading-tight">
            Categories
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl font-medium">
            Define your store's taxonomy with high-performance category structures.
          </p>
        </div>
        <Button 
          onClick={() => setIsDialogOpen(true)} 
          className="btn-primary flex items-center gap-2 px-8 h-14 text-base font-bold group"
        >
          <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-500" />
          Add Category
        </Button>
      </div>

      {/* Search and Stats Section */}
      <div className="flex flex-col md:flex-row items-center gap-6 bg-white/5 dark:bg-zinc-900/30 p-6 rounded-3xl border border-white/10 backdrop-blur-2xl shadow-strong">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-all duration-300" />
          <Input 
            placeholder="Search catalog taxonomy..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-14 h-14 bg-background/50 focus:bg-background border-white/20 focus:border-primary/50 focus:ring-primary/20 rounded-2xl text-base transition-all shadow-inner"
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex-1 md:flex-none flex items-center justify-center gap-3 px-6 py-4 bg-primary/5 border border-primary/10 rounded-2xl">
            <Tag className="h-5 w-5 text-primary" />
            <span className="text-base font-bold text-primary">{filteredCategories.length}</span>
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
                <TableHead className="w-[120px] text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground py-6">Media</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground py-6">Identity</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground py-6">Taxonomy</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground py-6 hidden md:table-cell">Overview</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground py-6 px-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
                      <p className="text-sm font-medium text-muted-foreground">Loading Categories...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 opacity-50">
                      <div className="p-4 bg-muted rounded-full">
                        <Search className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-lg font-medium text-muted-foreground">No categories match your search</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCategories.map((category) => (
                  <TableRow 
                    key={category.id} 
                    className="group border-white/5 hover:bg-primary/[0.02] dark:hover:bg-primary/[0.05] transition-colors"
                  >
                    <TableCell className="py-6 px-8 font-mono text-[10px] font-bold text-muted-foreground/60">
                      ID-{category.id.toString().padStart(4, '0')}
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="h-16 w-16 rounded-2xl overflow-hidden bg-muted flex items-center justify-center border border-white/10 shadow-soft group-hover:scale-110 transition-transform duration-500">
                        {category.coverPhoto ? (
                          <img 
                            src={category.coverPhoto.startsWith('http') ? category.coverPhoto : `${API_BASE_URL}${category.coverPhoto}`} 
                            alt={category.name} 
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.target.src = 'https://placehold.co/100x100?text=' + category.name.charAt(0);
                            }}
                          />
                        ) : (
                          <Package className="h-6 w-6 text-muted-foreground/20" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-6 font-black text-lg group-hover:text-primary transition-colors">
                      {category.name}
                    </TableCell>
                    <TableCell className="py-6">
                      <span className="text-xs font-bold px-3 py-1 bg-white/5 border border-white/10 rounded-lg group-hover:border-primary/30 transition-colors">
                        /categories/{category.slug}
                      </span>
                    </TableCell>
                    <TableCell className="py-6 text-muted-foreground font-medium text-sm max-w-[300px] truncate hidden md:table-cell">
                      {category.description || 'No description provided'}
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
                    <Tag className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-3xl font-black tracking-tight gradient-text">
                      {isEditing ? 'Refine Category' : 'New Taxonomy'}
                    </DialogTitle>
                    <DialogDescription className="text-base font-medium text-muted-foreground">
                      {isEditing 
                        ? 'Optimize the identity and structure of your product segment.' 
                        : 'Initialize a new structural element for your collection.'
                      }
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
            </div>

            <ScrollArea className="flex-1 px-8 py-6">
              <Form {...form}>
                <form id="category-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Form Details */}
                    <div className="space-y-6">
                      <Card className="bg-white/5 border-white/10 shadow-soft overflow-hidden">
                        <CardHeader className="pb-4 bg-primary/5 border-b border-white/5">
                          <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
                            <Tag className="h-4 w-4 text-primary" /> Identity
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
                                    placeholder="e.g., Luxury Handbags" 
                                    {...field} 
                                    onChange={handleNameChange} 
                                    className="bg-background/50 focus:bg-background border-white/10 h-12 rounded-xl transition-all font-bold text-base"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="slug"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-wider opacity-70">SEO Path</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-xs opacity-50">/</span>
                                    <Input 
                                      {...field} 
                                      className="pl-8 bg-background/50 focus:bg-background border-white/10 h-12 rounded-xl transition-all font-mono text-sm"
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>

                      <Card className="bg-white/5 border-white/10 shadow-soft overflow-hidden">
                        <CardHeader className="pb-4 bg-primary/5 border-b border-white/5">
                          <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
                            <Info className="h-4 w-4 text-primary" /> Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-wider opacity-70">Context</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Provide detail context for this segment..." 
                                    {...field} 
                                    className="resize-none bg-background/50 focus:bg-background border-white/10 rounded-xl transition-all min-h-[120px] font-medium" 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>
                    </div>

                    {/* Right Column: Visual Identity */}
                    <div className="space-y-6">
                      <Card className="bg-white/5 border-white/10 shadow-soft overflow-hidden h-full">
                        <CardHeader className="pb-4 bg-primary/5 border-b border-white/5">
                          <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
                            <Package className="h-4 w-4 text-primary" /> Visual Identity
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                          <div 
                            className={`
                              relative aspect-video rounded-[1.5rem] border-2 border-dashed border-white/10 overflow-hidden group
                              ${photoPreview ? 'bg-transparent' : 'bg-background/50'} transition-all
                              hover:border-primary/50 hover:bg-primary/5
                            `}
                          >
                            {photoPreview ? (
                              <div className="h-full w-full relative">
                                <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() => {
                                      setCoverPhoto(null);
                                      setPhotoPreview(null);
                                    }}
                                    className="h-12 w-12 rounded-full p-0 shadow-strong scale-90 group-hover:scale-100 transition-transform"
                                  >
                                    <X className="h-6 w-6" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <label className="h-full w-full flex flex-col items-center justify-center cursor-pointer p-6 text-center space-y-3">
                                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                  <Upload className="h-6 w-6 text-primary" />
                                </div>
                                <div className="space-y-1">
                                  <p className="text-sm font-black text-foreground">Upload Media</p>
                                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">High performance cover</p>
                                </div>
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  className="hidden" 
                                  onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                      setCoverPhoto(file);
                                      setPhotoPreview(URL.createObjectURL(file));
                                    }
                                  }}
                                />
                              </label>
                            )}
                          </div>

                          <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex gap-3 items-start">
                            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                              Supported formats: JPG, WEBP, PNG. Recommended 16:9 aspect ratio for optimal desktop and mobile rendering.
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
                  form="category-form"
                  type="submit" 
                  disabled={form.formState.isSubmitting}
                  className="h-14 rounded-2xl px-12 btn-primary font-black text-xs uppercase tracking-widest shadow-glow min-w-[200px]"
                >
                  {form.formState.isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : isEditing ? 'Sync Changes' : 'Publish Segment'}
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
          title="Archive Taxonomy?"
          description="This will permanently delete this category segment and remove it from your structural hierarchy."
          confirmText="Delete Segment"
      >
          {categoryToDelete && (
              <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-xl overflow-hidden bg-muted border border-white/10 shrink-0">
                      {categoryToDelete.coverPhoto ? (
                          <img 
                              src={categoryToDelete.coverPhoto.startsWith('http') ? categoryToDelete.coverPhoto : `${API_BASE_URL}${categoryToDelete.coverPhoto}`} 
                              className="h-full w-full object-cover" 
                              alt="" 
                          />
                      ) : (
                          <Package className="h-full w-full p-4 text-muted-foreground/20" />
                      )}
                  </div>
                  <div className="flex flex-col">
                      <span className="font-black text-foreground break-words">{categoryToDelete.name}</span>
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{categoryToDelete.slug}</span>
                  </div>
              </div>
          )}
      </ConfirmModal>
    </div>
  );
};

export default CategoryModule;
