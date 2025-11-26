import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, ShoppingCart, X, Trash2 } from "lucide-react";
import { toast } from "sonner";

const Sales = () => {
  const [sales, setSales] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [saleItems, setSaleItems] = useState<any[]>([{ product_id: "", quantity: "", discount: "0" }]);
  const [formData, setFormData] = useState({
    customer_id: "",
    payment_method: "cash",
    notes: "",
  });

  useEffect(() => {
    fetchSales();
    fetchCustomers();
    fetchProducts();
  }, []);

  const fetchSales = async () => {
    const { data, error } = await supabase
      .from("sales")
      .select(`
        *,
        customer:customers(name),
        items:sale_items(
          *,
          product:products(name)
        )
      `)
      .order("sale_date", { ascending: false });

    if (error) {
      toast.error("Failed to fetch sales");
    } else {
      setSales(data || []);
    }
  };

  const fetchCustomers = async () => {
    const { data } = await supabase.from("customers").select("*");
    setCustomers(data || []);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("id, name, selling_price, stock_quantity");
    setProducts(data || []);
  };

  const addItemRow = () => {
    setSaleItems([...saleItems, { product_id: "", quantity: "", discount: "0" }]);
  };

  const removeItemRow = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  const updateItemRow = (index: number, field: string, value: string) => {
    const newItems = [...saleItems];
    newItems[index][field] = value;
    setSaleItems(newItems);
  };

  const getItemTotal = (item: any) => {
    const product = products.find(p => p.id === item.product_id);
    if (!product) return 0;
    const quantity = parseFloat(item.quantity) || 0;
    const discount = parseFloat(item.discount) || 0;
    const subtotal = quantity * Number(product.selling_price);
    return subtotal - discount;
  };

  const calculateTotal = () => {
    return saleItems.reduce((sum, item) => sum + getItemTotal(item), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Validate stock
    for (const item of saleItems) {
      if (!item.product_id || !item.quantity) continue;
      const product = products.find(p => p.id === item.product_id);
      if (product && product.stock_quantity < parseInt(item.quantity)) {
        toast.error(`Insufficient stock for ${product.name}`);
        return;
      }
    }

    const saleNumber = `SALE-${Date.now()}`;
    const totalAmount = calculateTotal();

    // Create sale
    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .insert([{
        sale_number: saleNumber,
        customer_id: formData.customer_id || null,
        payment_method: formData.payment_method,
        total_amount: totalAmount,
        notes: formData.notes,
        created_by: user.id,
      }])
      .select()
      .single();

    if (saleError) {
      toast.error(saleError.message);
      return;
    }

    // Create sale items and update stock
    const items = saleItems
      .filter(item => item.product_id && item.quantity)
      .map(item => {
        const product = products.find(p => p.id === item.product_id);
        return {
          sale_id: sale.id,
          product_id: item.product_id,
          quantity: parseInt(item.quantity),
          unit_price: Number(product?.selling_price || 0),
          discount: parseFloat(item.discount) || 0,
          total_price: getItemTotal(item),
        };
      });

    const { error: itemsError } = await supabase
      .from("sale_items")
      .insert(items);

    if (itemsError) {
      toast.error(itemsError.message);
      return;
    }

    // Update product stock
    for (const item of items) {
      const product = products.find(p => p.id === item.product_id);
      if (product) {
        await supabase
          .from("products")
          .update({ stock_quantity: product.stock_quantity - item.quantity })
          .eq("id", item.product_id);
      }
    }

    toast.success("Sale recorded successfully!");
    setOpen(false);
    resetForm();
    fetchSales();
    fetchProducts();
  };

  const resetForm = () => {
    setFormData({
      customer_id: "",
      payment_method: "cash",
      notes: "",
    });
    setSaleItems([{ product_id: "", quantity: "", discount: "0" }]);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Sales</h1>
          <p className="text-muted-foreground mt-1">Record and manage sales transactions</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Sale
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record New Sale</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer (Optional)</Label>
                  <Select
                    value={formData.customer_id}
                    onValueChange={(val) => setFormData({ ...formData, customer_id: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Payment Method *</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(val) => setFormData({ ...formData, payment_method: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Sale Items</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addItemRow}>
                    <Plus className="w-4 h-4 mr-1" /> Add Item
                  </Button>
                </div>
                <div className="space-y-2">
                  {saleItems.map((item, index) => {
                    const product = products.find(p => p.id === item.product_id);
                    return (
                      <div key={index} className="flex gap-2 items-center">
                        <Select
                          value={item.product_id}
                          onValueChange={(val) => updateItemRow(index, "product_id", val)}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name} (Stock: {p.stock_quantity})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          placeholder="Qty"
                          className="w-20"
                          value={item.quantity}
                          onChange={(e) => updateItemRow(index, "quantity", e.target.value)}
                        />
                        {product && (
                          <div className="text-sm font-medium w-20">
                            ${Number(product.selling_price).toFixed(2)}
                          </div>
                        )}
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Discount"
                          className="w-24"
                          value={item.discount}
                          onChange={(e) => updateItemRow(index, "discount", e.target.value)}
                        />
                        <div className="text-sm font-semibold w-24">
                          ${getItemTotal(item).toFixed(2)}
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          onClick={() => removeItemRow(index)}
                          disabled={saleItems.length === 1}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
                <div className="text-right font-bold text-2xl text-primary">
                  Total: ${calculateTotal().toFixed(2)}
                </div>
              </div>

              <Button type="submit" className="w-full">Record Sale</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {sales.map((sale) => (
          <Card key={sale.id} className="p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-lg">{sale.sale_number}</h3>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Customer: <span className="font-medium">{sale.customer?.name || "Walk-in"}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Date: {new Date(sale.sale_date).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground capitalize">
                  Payment: {sale.payment_method}
                </p>
              </div>
              <p className="text-2xl font-bold text-success">${Number(sale.total_amount).toFixed(2)}</p>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sale.items?.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.product?.name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>${Number(item.unit_price).toFixed(2)}</TableCell>
                    <TableCell>${Number(item.discount || 0).toFixed(2)}</TableCell>
                    <TableCell className="font-semibold">${Number(item.total_price).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ))}
        {sales.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">
            No sales recorded yet. Record your first sale!
          </Card>
        )}
      </div>
    </div>
  );
};

export default Sales;
