import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '@/utils/axiosClient';
import { 
  Loader2, 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  LayoutGrid, 
  List as ListIcon, 
  Package, 
  Filter, 
  MoreVertical,
  ExternalLink,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import productService from '@/api/product.service';
import { useToast } from '@/hooks/use-toast';
import ConfirmModal from '@/components/ui/ConfirmModal';
import ProductEditModal from './ProductEditModal';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const ProductsDisplay = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user } = useAuth();
    
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
    const [searchQuery, setSearchQuery] = useState('');
    
    // Modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Edit Modal state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState(null);
    
    // Fetch products
    const fetchProducts = async () => {
        setLoading(true);
        try {
            const data = await productService.getAllProducts();
            setProducts(data.items || []);
        } catch (error) {
            console.error("Fetch products error:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load products. Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleDeleteClick = (product) => {
        setProductToDelete(product);
        setIsDeleteModalOpen(true);
    };

    const handleEditClick = (product) => {
        setProductToEdit(product);
        setIsEditModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!productToDelete) return;
        
        setIsDeleting(true);
        try {
            await productService.deleteProduct(productToDelete.id);
            toast({
                title: "Deleted",
                description: "Product has been removed successfully.",
            });
            fetchProducts();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to delete product.",
            });
        } finally {
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
            setProductToDelete(null);
        }
    };

    const filteredProducts = useMemo(() => {
        return products.filter(p => 
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.brand?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [products, searchQuery]);

const formatPrice = (price) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
    }).format(price);
};

    const getPriceRange = (variants) => {
        if (!variants || variants.length === 0) return 'N/A';
        const prices = variants.map(v => parseFloat(v.price));
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        if (min === max) return formatPrice(min);
        return `${formatPrice(min)} - ${formatPrice(max)}`;
    };

    const getTotalStock = (variants) => {
        if (!variants) return 0;
        return variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);
    };

    return (
        <div className="space-y-8 p-6 lg:p-10 pb-20 animate-fade-in max-w-[1600px] mx-auto">
            {/* Header Section */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
                <div className="space-y-3">
                    <Badge variant="outline" className="px-4 py-1.5 border-primary/20 bg-primary/5 text-primary text-xs font-bold uppercase tracking-widest animate-scale-in">
                        Inventory Management
                    </Badge>
                    <h2 className="text-4xl lg:text-6xl font-black tracking-tight gradient-text leading-tight">
                        Product Collection
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl font-medium">
                        Manage your luxury catalog, monitor stock levels, and update product information in real-time.
                    </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex bg-white/10 dark:bg-zinc-900/40 p-1.5 rounded-2xl border border-white/10 backdrop-blur-xl shadow-elegant">
                        <Button 
                            variant={viewMode === 'table' ? 'secondary' : 'ghost'} 
                            size="sm" 
                            onClick={() => setViewMode('table')}
                            className={`rounded-xl px-4 ${viewMode === 'table' ? 'shadow-soft' : ''}`}
                        >
                            <ListIcon className="h-4 w-4 mr-2" />
                            Table
                        </Button>
                        <Button 
                            variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                            size="sm" 
                            onClick={() => setViewMode('grid')}
                            className={`rounded-xl px-4 ${viewMode === 'grid' ? 'shadow-soft' : ''}`}
                        >
                            <LayoutGrid className="h-4 w-4 mr-2" />
                            Grid
                        </Button>
                    </div>
                    
                    <Button 
                        onClick={() => navigate('/admin/addproducts')} 
                        className="btn-primary flex items-center gap-2 px-8 h-14 text-base font-bold group"
                    >
                        <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-500" />
                        New Product
                    </Button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row items-center gap-6 bg-white/5 dark:bg-zinc-900/30 p-6 rounded-3xl border border-white/10 backdrop-blur-2xl shadow-strong">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-all duration-300" />
                    <Input 
                        placeholder="Search by title, SKU, or brand..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-14 h-14 bg-background/50 focus:bg-background border-white/20 focus:border-primary/50 focus:ring-primary/20 rounded-2xl text-base transition-all shadow-inner"
                    />
                </div>
                
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="flex-1 md:flex-none flex items-center justify-center gap-3 px-6 py-4 bg-primary/5 border border-primary/10 rounded-2xl">
                        <Package className="h-5 w-5 text-primary" />
                        <span className="text-base font-bold text-primary">{filteredProducts.length}</span>
                        <span className="text-sm text-muted-foreground font-semibold uppercase tracking-wider">Products</span>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div 
                        key="loader"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-40 gap-6"
                    >
                        <div className="relative">
                            <Loader2 className="h-16 w-16 animate-spin text-primary" />
                            <div className="absolute inset-0 h-16 w-16 animate-ping rounded-full bg-primary/20" />
                        </div>
                        <p className="text-xl font-bold text-muted-foreground animate-pulse">Synchronizing Inventory...</p>
                    </motion.div>
                ) : filteredProducts.length === 0 ? (
                    <motion.div 
                        key="empty"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-40 gap-8 bg-white/5 dark:bg-zinc-900/20 rounded-[3rem] border border-dashed border-white/10"
                    >
                        <div className="p-10 bg-muted/50 rounded-full shadow-inner relative group">
                            <Search className="h-20 w-20 text-muted-foreground/30 group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute -top-2 -right-2 bg-primary h-8 w-8 rounded-full flex items-center justify-center text-white font-bold">0</div>
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-3xl font-black text-foreground">No matches found</h3>
                            <p className="text-muted-foreground text-lg font-medium">Try adjusting your filters or creating a new product.</p>
                        </div>
                        <Button onClick={() => setSearchQuery('')} variant="outline" className="rounded-2xl px-10 h-14 font-bold border-white/20 hover:bg-white/5">
                            Clear All Filters
                        </Button>
                    </motion.div>
                ) : viewMode === 'table' ? (
                    <motion.div 
                        key="table"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="glass-card !p-0 overflow-hidden shadow-strong border-white/10 dark:border-white/5 rounded-[2rem]"
                    >
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow className="hover:bg-transparent border-white/10">
                                        <TableHead className="py-7 px-8 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Product</TableHead>
                                        <TableHead className="py-7 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Status</TableHead>
                                        <TableHead className="py-7 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Price</TableHead>
                                        <TableHead className="py-7 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Inventory</TableHead>
                                        <TableHead className="py-7 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Category</TableHead>
                                        <TableHead className="text-right py-7 px-8 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredProducts.map((product) => (
                                        <TableRow 
                                            key={product.id} 
                                            className="group border-white/5 hover:bg-primary/[0.03] dark:hover:bg-primary/[0.06] transition-all duration-300"
                                        >
                                            <TableCell className="py-6 px-8">
                                                <div className="flex items-center gap-5">
                                                    <div className="h-16 w-16 rounded-2xl bg-muted overflow-hidden flex-shrink-0 border border-white/10 shadow-soft group-hover:scale-105 transition-transform duration-500">
                                                        {product.photos?.[0] ? (
                                                            <img 
                                                                src={`${API_BASE_URL}${product.photos[0].url}`} 
                                                                alt={product.title} 
                                                                className="h-full w-full object-cover"
                                                                onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=Product'; }}
                                                            />
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center bg-primary/5">
                                                                <Package className="h-8 w-8 text-primary/30" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-black text-lg group-hover:text-primary transition-colors line-clamp-1">{product.title}</span>
                                                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{product.variants?.[0]?.sku || 'No SKU'}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-6">
                                                <Badge variant={getTotalStock(product.variants) > 0 ? "outline" : "destructive"} className={`rounded-lg px-3 py-1 font-bold ${getTotalStock(product.variants) > 0 ? 'border-green-500/20 bg-green-500/5 text-green-500' : ''}`}>
                                                    {getTotalStock(product.variants) > 0 ? 'Active' : 'Out of Stock'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-6">
                                                <span className="font-black text-xl text-primary">{getPriceRange(product.variants)}</span>
                                            </TableCell>
                                            <TableCell className="py-6">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-1">
                                                        <span>In Stock</span>
                                                        <span className={getTotalStock(product.variants) < 5 ? 'text-red-500' : 'text-muted-foreground'}>{getTotalStock(product.variants)} units</span>
                                                    </div>
                                                    <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full transition-all duration-1000 ${getTotalStock(product.variants) < 5 ? 'bg-red-500' : 'bg-primary'}`} 
                                                            style={{ width: `${Math.min(getTotalStock(product.variants), 20) * 5}%` }} 
                                                        />
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-6">
                                                <span className="category-badge text-xs font-black uppercase tracking-widest">
                                                    {product.category?.name || 'General'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-6 px-8 text-right">
                                                <div className="flex justify-end gap-3 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => handleEditClick(product)}
                                                        className="h-12 w-12 rounded-2xl hover:bg-primary/20 hover:text-primary dark:hover:bg-primary/10 transition-bounce"
                                                    >
                                                        <Pencil className="h-5 w-5" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => handleDeleteClick(product)}
                                                        className="h-12 w-12 rounded-2xl hover:bg-red-500/20 hover:text-red-500 dark:hover:bg-red-500/10 transition-bounce"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="grid"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8"
                    >
                        {filteredProducts.map((product) => (
                            <Card key={product.id} className="bag-card border-white/10 overflow-hidden relative group">
                                <div className="aspect-[4/5] relative overflow-hidden bg-muted">
                                    {product.photos?.[0] ? (
                                        <img 
                                            src={`${API_BASE_URL}${product.photos[0].url}`} 
                                            alt={product.title} 
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center bg-primary/5">
                                            <Package className="h-16 w-16 text-primary/20" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                                        <Badge className="bg-black/60 backdrop-blur-md border border-white/10 rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                                            {product.category?.name || 'General'}
                                        </Badge>
                                        {product.quantity < 5 && (
                                            <Badge variant="destructive" className="animate-pulse rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                                                Low Stock
                                            </Badge>
                                        )}
                                    </div>
                                    
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
                                        <div className="flex gap-3 w-full">
                                            <Button 
                                                variant="secondary" 
                                                className="flex-1 rounded-xl h-12 font-bold bg-primary text-white hover:bg-primary/90"
                                                onClick={() => handleEditClick(product)}
                                            >
                                                <Pencil className="h-4 w-4 mr-2" />
                                                Edit
                                            </Button>
                                            <Button 
                                                variant="destructive" 
                                                size="icon" 
                                                className="h-12 w-12 rounded-xl"
                                                onClick={() => handleDeleteClick(product)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">{product.brand || 'Luxury Bag'}</span>
                                        <h3 className="text-xl font-black line-clamp-1 bg-primary text-white px-3 py-1.5 rounded-xl shadow-soft">{product.title}</h3>
                                    </div>
                                    <div className="flex items-end justify-between">
                                        <span className="text-2xl font-black text-primary">{getPriceRange(product.variants)}</span>
                                        <span className={`text-xs font-bold uppercase tracking-widest ${getTotalStock(product.variants) === 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                                            {getTotalStock(product.variants)} in stock
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* Simple Pagination/Footer */}
            {!loading && filteredProducts.length > 0 && (
                <div className="flex items-center justify-between py-10 border-t border-white/5">
                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">
                        Showing <span className="text-foreground font-bold">{filteredProducts.length}</span> luxury items
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" disabled className="h-12 w-12 rounded-2xl border-white/10 opacity-50"><ChevronLeft className="h-5 w-5" /></Button>
                        <Button variant="outline" size="icon" disabled className="h-12 w-12 rounded-2xl border-white/10 opacity-50"><ChevronRight className="h-5 w-5" /></Button>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                isLoading={isDeleting}
                title="Archive Product?"
                description="This will permanently remove this item from the digital vault. This structural change cannot be reversed."
                confirmText="Archive Item"
            >
                {productToDelete && (
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-xl overflow-hidden bg-muted border border-white/10 shrink-0">
                            {productToDelete.photos?.[0] ? (
                                <img 
                                    src={`${API_BASE_URL}${productToDelete.photos[0].url}`} 
                                    className="h-full w-full object-cover" 
                                    alt="" 
                                />
                            ) : (
                                <Package className="h-full w-full p-4 text-muted-foreground/20" />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black text-foreground break-words">{productToDelete.title}</span>
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{productToDelete.sku || 'No SKU'}</span>
                        </div>
                    </div>
                )}
            </ConfirmModal>

            <ProductEditModal 
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setProductToEdit(null);
                }}
                product={productToEdit}
                onUpdateSuccess={fetchProducts}
            />
        </div>
    );
};

export default ProductsDisplay;
