import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Package, Check, X, Trash2 } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

const PurchaseOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [orderItems, setOrderItems] = useState<any[]>([{ product_id: "", quantity: "", unit_price: "" }]);
  const [formData, setFormData] = useState({
    supplier_id: "",
    order_date: new Date().toISOString().split("T")[0],
    expected_delivery_date: "",
    notes: "",
  });

  useEffect(() => {
    fetchOrders();
    fetchSuppliers();
    fetchProducts();
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("purchase_orders")
      .select(`
        *,
        supplier:suppliers(name),
        items:purchase_order_items(
          *,
          product:products(name)
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch orders");
    } else {
      setOrders(data || []);
    }
  };

  const fetchSuppliers = async () => {
    const { data } = await supabase.from("suppliers").select("*");
    setSuppliers(data || []);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("id, name, cost_price");
    setProducts(data || []);
  };

  const addItemRow = () => {
    setOrderItems([...orderItems, { product_id: "", quantity: "", unit_price: "" }]);
  };

  const removeItemRow = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const updateItemRow = (index: number, field: string, value: string) => {
    const newItems = [...orderItems];
    newItems[index][field] = value;
    
    // Auto-fill unit price when product is selected
    if (field === "product_id") {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].unit_price = product.cost_price;
      }
    }
    
    setOrderItems(newItems);
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unit_price) || 0;
      return sum + (quantity * price);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Generate order number
    const orderNumber = `PO-${Date.now()}`;
    const totalAmount = calculateTotal();

    // Create purchase order
    const { data: order, error: orderError } = await supabase
      .from("purchase_orders")
      .insert([{
        ...formData,
        order_number: orderNumber,
        total_amount: totalAmount,
        created_by: user.id,
        status: "pending",
      }])
      .select()
      .single();

    if (orderError) {
      toast.error(orderError.message);
      return;
    }

    // Create order items
    const items = orderItems
      .filter(item => item.product_id && item.quantity)
      .map(item => ({
        purchase_order_id: order.id,
        product_id: item.product_id,
        quantity: parseInt(item.quantity),
        unit_price: parseFloat(item.unit_price),
        total_price: parseInt(item.quantity) * parseFloat(item.unit_price),
      }));

    const { error: itemsError } = await supabase
      .from("purchase_order_items")
      .insert(items);

    if (itemsError) {
      toast.error(itemsError.message);
    } else {
      toast.success("Purchase order created successfully!");
      setOpen(false);
      resetForm();
      fetchOrders();
    }
  };

  const resetForm = () => {
    setFormData({
      supplier_id: "",
      order_date: new Date().toISOString().split("T")[0],
      expected_delivery_date: "",
      notes: "",
    });
    setOrderItems([{ product_id: "", quantity: "", unit_price: "" }]);
  };

  const markAsReceived = async (orderId: string, items: any[]) => {
    // Update order status
    const { error: orderError } = await supabase
      .from("purchase_orders")
      .update({ status: "received" })
      .eq("id", orderId);

    if (orderError) {
      toast.error("Failed to update order");
      return;
    }

    // Update product stock quantities
    for (const item of items) {
      const { data: product } = await supabase
        .from("products")
        .select("stock_quantity")
        .eq("id", item.product_id)
        .single();

      if (product) {
        await supabase
          .from("products")
          .update({ stock_quantity: product.stock_quantity + item.quantity })
          .eq("id", item.product_id);
      }
    }

    toast.success("Order marked as received and stock updated!");
    fetchOrders();
  };

  const cancelOrder = async (orderId: string) => {
    const { error } = await supabase
      .from("purchase_orders")
      .update({ status: "cancelled" })
      .eq("id", orderId);

    if (error) {
      toast.error("Failed to cancel order");
    } else {
      toast.success("Order cancelled");
      fetchOrders();
    }
  };

  const handleDeleteOrder = async (orderId: string, orderStatus: string, items: any[]) => {
    // If order was received, we need to subtract from stock
    if (orderStatus === "received") {
      for (const item of items) {
        const { data: product } = await supabase
          .from("products")
          .select("stock_quantity")
          .eq("id", item.product_id)
          .single();

        if (product) {
          await supabase
            .from("products")
            .update({ stock_quantity: Math.max(0, product.stock_quantity - item.quantity) })
            .eq("id", item.product_id);
        }
      }
    }

    // Delete order items first
    await supabase.from("purchase_order_items").delete().eq("purchase_order_id", orderId);
    
    // Delete order
    const { error } = await supabase.from("purchase_orders").delete().eq("id", orderId);
    
    if (error) {
      toast.error("Failed to delete order: " + error.message);
    } else {
      toast.success("Order deleted!" + (orderStatus === "received" ? " Stock adjusted." : ""));
      fetchOrders();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      pending: "outline",
      received: "default",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "outline"} className={
      status === "received" ? "bg-success text-white" : ""
    }>{status.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Purchase Orders</h1>
          <p className="text-muted-foreground mt-1">Manage orders from suppliers</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Purchase Order</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Supplier *</Label>
                  <Select
                    value={formData.supplier_id}
                    onValueChange={(val) => setFormData({ ...formData, supplier_id: val })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Order Date *</Label>
                  <Input
                    type="date"
                    value={formData.order_date}
                    onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expected Delivery</Label>
                  <Input
                    type="date"
                    value={formData.expected_delivery_date}
                    onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                  />
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
                  <Label>Order Items</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addItemRow}>
                    <Plus className="w-4 h-4 mr-1" /> Add Item
                  </Button>
                </div>
                <div className="space-y-2">
                  {orderItems.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Select
                        value={item.product_id}
                        onValueChange={(val) => updateItemRow(index, "product_id", val)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
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
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        className="w-24"
                        value={item.unit_price}
                        onChange={(e) => updateItemRow(index, "unit_price", e.target.value)}
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        onClick={() => removeItemRow(index)}
                        disabled={orderItems.length === 1}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="text-right font-semibold text-lg">
                  Total: Rs.{calculateTotal().toFixed(0)}
                </div>
              </div>

              <Button type="submit" className="w-full">Create Order</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id} className="p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-lg">{order.order_number}</h3>
                  {getStatusBadge(order.status)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Supplier: <span className="font-medium">{order.supplier?.name}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Order Date: {new Date(order.order_date).toLocaleDateString()}
                </p>
                {order.expected_delivery_date && (
                  <p className="text-sm text-muted-foreground">
                    Expected: {new Date(order.expected_delivery_date).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">Rs.{Number(order.total_amount).toFixed(0)}</p>
                <div className="flex gap-2 mt-2 justify-end">
                  {order.status === "pending" && (
                    <>
                      <Button size="sm" onClick={() => markAsReceived(order.id, order.items)}>
                        <Check className="w-4 h-4 mr-1" /> Receive
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => cancelOrder(order.id)}>
                        <X className="w-4 h-4 mr-1" /> Cancel
                      </Button>
                    </>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Purchase Order?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete {order.order_number}.
                          {order.status === "received" && " The stock quantities will be adjusted accordingly."}
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteOrder(order.id, order.status, order.items || [])} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items?.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.product?.name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>Rs.{Number(item.unit_price).toFixed(0)}</TableCell>
                    <TableCell className="font-semibold">Rs.{Number(item.total_price).toFixed(0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ))}
        {orders.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">
            No purchase orders yet. Create your first order!
          </Card>
        )}
      </div>
    </div>
  );
};

export default PurchaseOrders;
