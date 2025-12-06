import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, DollarSign, Package, ShoppingCart } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const Analytics = () => {
  const [period, setPeriod] = useState("30");
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalSales: 0,
    totalProducts: 0,
    avgSaleValue: 0,
  });
  const [salesData, setSalesData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [categoryRevenue, setCategoryRevenue] = useState<any[]>([]);

  const COLORS = ["hsl(205, 80%, 48%)", "hsl(180, 65%, 55%)", "hsl(142, 71%, 45%)", "hsl(38, 92%, 50%)", "hsl(0, 72%, 51%)"];

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // Fetch sales data
    const { data: salesData } = await supabase
      .from("sales")
      .select("*, items:sale_items(*)")
      .gte("sale_date", daysAgo.toISOString());

    if (salesData) {
      const revenue = salesData.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
      setStats({
        totalRevenue: revenue,
        totalSales: salesData.length,
        totalProducts: 0,
        avgSaleValue: salesData.length > 0 ? revenue / salesData.length : 0,
      });

      // Process daily sales
      const dailyData = salesData.reduce((acc: any, sale) => {
        const date = new Date(sale.sale_date).toLocaleDateString();
        if (!acc[date]) {
          acc[date] = { date, revenue: 0, sales: 0 };
        }
        acc[date].revenue += Number(sale.total_amount);
        acc[date].sales += 1;
        return acc;
      }, {});

      setSalesData(Object.values(dailyData));

      // Process top products
      const productSales: any = {};
      salesData.forEach((sale) => {
        sale.items?.forEach((item: any) => {
          if (!productSales[item.product_id]) {
            productSales[item.product_id] = { quantity: 0, revenue: 0 };
          }
          productSales[item.product_id].quantity += item.quantity;
          productSales[item.product_id].revenue += Number(item.total_price);
        });
      });

      // Fetch product names
      const { data: products } = await supabase
        .from("products")
        .select("id, name, product_type")
        .in("id", Object.keys(productSales));

      const topProductsData = products?.map((p) => ({
        name: p.name,
        type: p.product_type,
        quantity: productSales[p.id].quantity,
        revenue: productSales[p.id].revenue,
      }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5) || [];

      setTopProducts(topProductsData);

      // Process revenue by category
      const categoryData = topProductsData.reduce((acc: any, product) => {
        const type = product.type.replace("_", " ");
        if (!acc[type]) {
          acc[type] = { name: type, value: 0 };
        }
        acc[type].value += product.revenue;
        return acc;
      }, {});

      setCategoryRevenue(Object.values(categoryData));
    }

    // Fetch total products
    const { count } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });
    
    setStats(prev => ({ ...prev, totalProducts: count || 0 }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Analytics & Reports</h1>
          <p className="text-muted-foreground mt-1">Business insights and performance metrics</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="w-5 h-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">Rs.{stats.totalRevenue.toFixed(0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
            <ShoppingCart className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.totalSales}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Sale Value</CardTitle>
            <TrendingUp className="w-5 h-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">Rs.{stats.avgSaleValue.toFixed(0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
            <Package className="w-5 h-5 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.totalProducts}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }} 
                />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryRevenue}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={100}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {categoryRevenue.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Products</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }} 
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
