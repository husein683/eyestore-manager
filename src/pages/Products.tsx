import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const Products = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [categories, setCategories] = useState<any>({ brands: [], types: [], genders: [], materials: [] });
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<any>({
    sku: "",
    name: "",
    product_type: "eyeglasses",
    cost_price: "",
    selling_price: "",
    stock_quantity: "",
    reorder_level: "10",
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchSuppliers();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [search, filterType, products]);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        brand:brand_id(name),
        type:type_id(name),
        gender:gender_id(name),
        material:material_id(name),
        supplier:supplier_id(name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch products");
    } else {
      setProducts(data || []);
    }
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from("product_categories").select("*");
    const grouped = {
      brands: data?.filter((c) => c.category_type === "brand") || [],
      types: data?.filter((c) => c.category_type === "type") || [],
      genders: data?.filter((c) => c.category_type === "gender") || [],
      materials: data?.filter((c) => c.category_type === "material") || [],
    };
    setCategories(grouped);
  };

  const fetchSuppliers = async () => {
    const { data } = await supabase.from("suppliers").select("*");
    setSuppliers(data || []);
  };

  const filterProducts = () => {
    let filtered = products;

    if (search) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.sku.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter((p) => p.product_type === filterType);
    }

    setFilteredProducts(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from("products").insert([formData]);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Product added successfully!");
      setOpen(false);
      setFormData({
        sku: "",
        name: "",
        product_type: "eyeglasses",
        cost_price: "",
        selling_price: "",
        stock_quantity: "",
        reorder_level: "10",
      });
      fetchProducts();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your optical inventory</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SKU *</Label>
                  <Input
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Product Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Product Type *</Label>
                  <Select
                    value={formData.product_type}
                    onValueChange={(val) => setFormData({ ...formData, product_type: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eyeglasses">Eyeglasses</SelectItem>
                      <SelectItem value="sunglasses">Sunglasses</SelectItem>
                      <SelectItem value="contact_lenses">Contact Lenses</SelectItem>
                      <SelectItem value="accessories">Accessories</SelectItem>
                      <SelectItem value="cleaning_solutions">Cleaning Solutions</SelectItem>
                      <SelectItem value="custom_eyesight">Custom Eyesight</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cost Price *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Selling Price *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stock Quantity *</Label>
                  <Input
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reorder Level</Label>
                  <Input
                    type="number"
                    value={formData.reorder_level}
                    onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">Add Product</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-4">
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="eyeglasses">Eyeglasses</SelectItem>
              <SelectItem value="sunglasses">Sunglasses</SelectItem>
              <SelectItem value="contact_lenses">Contact Lenses</SelectItem>
              <SelectItem value="accessories">Accessories</SelectItem>
              <SelectItem value="cleaning_solutions">Cleaning Solutions</SelectItem>
              <SelectItem value="custom_eyesight">Custom Eyesight</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No products found. Add your first product!
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="capitalize">{product.product_type.replace("_", " ")}</TableCell>
                    <TableCell>${Number(product.cost_price).toFixed(2)}</TableCell>
                    <TableCell className="font-semibold">${Number(product.selling_price).toFixed(2)}</TableCell>
                    <TableCell>{product.stock_quantity}</TableCell>
                    <TableCell>
                      {product.stock_quantity <= product.reorder_level ? (
                        <Badge variant="outline" className="text-warning border-warning">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Low Stock
                        </Badge>
                      ) : (
                        <Badge className="bg-success text-white">In Stock</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default Products;
