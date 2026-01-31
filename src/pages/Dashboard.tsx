import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Package, Users, ShoppingCart, AlertTriangle, TrendingUp, DollarSign } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockProducts: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    totalSales: 0,
    monthlyRevenue: 0,
  });

  const [lowStockItems, setLowStockItems] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    // Fetch total products
    const { count: productCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    // Fetch low stock products (where stock_quantity <= reorder_level)
    const { data: lowStock } = await supabase
      .from("products")
      .select("name, stock_quantity, reorder_level")
      .order("stock_quantity", { ascending: true })
      .limit(100);

    // Filter low stock items on client side
    const filteredLowStock = lowStock?.filter(
      (item) => item.stock_quantity <= item.reorder_level
    ).slice(0, 5) || [];

    // Fetch total customers
    const { count: customerCount } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true });

    // Fetch pending purchase orders
    const { count: pendingOrdersCount } = await supabase
      .from("purchase_orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    // Fetch total sales count
    const { count: salesCount } = await supabase
      .from("sales")
      .select("*", { count: "exact", head: true });

    // Fetch monthly revenue
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthlySales } = await supabase
      .from("sales")
      .select("total_amount")
      .gte("sale_date", startOfMonth.toISOString());

    const monthlyRevenue = monthlySales?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;

    setStats({
      totalProducts: productCount || 0,
      lowStockProducts: filteredLowStock.length,
      totalCustomers: customerCount || 0,
      pendingOrders: pendingOrdersCount || 0,
      totalSales: salesCount || 0,
      monthlyRevenue,
    });

    setLowStockItems(filteredLowStock);
  };

  const statCards = [
    { title: "Total Products", value: stats.totalProducts, icon: Package, color: "text-primary" },
    { title: "Low Stock Items", value: stats.lowStockProducts, icon: AlertTriangle, color: "text-warning" },
    { title: "Total Customers", value: stats.totalCustomers, icon: Users, color: "text-accent" },
    { title: "Pending Orders", value: stats.pendingOrders, icon: ShoppingCart, color: "text-primary" },
    { title: "Total Sales", value: stats.totalSales, icon: TrendingUp, color: "text-success" },
    { title: "Monthly Revenue", value: `Rs.${stats.monthlyRevenue.toFixed(0)}`, icon: DollarSign, color: "text-success" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of Naeem Optics inventory</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {lowStockItems.length > 0 && (
        <Alert className="border-warning bg-warning/10">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <AlertDescription>
            <div className="font-semibold mb-2 text-warning">Low Stock Alert!</div>
            <div className="space-y-2">
              {lowStockItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.name}</span>
                  <Badge variant="outline" className="text-warning border-warning">
                    {item.stock_quantity} / {item.reorder_level} units
                  </Badge>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default Dashboard;
