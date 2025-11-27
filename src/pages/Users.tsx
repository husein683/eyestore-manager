import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Shield, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

const Users = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    role: "employee" as "admin" | "employee",
  });

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      toast.error("Access denied. Admin only.");
      navigate("/dashboard");
      return;
    }

    setIsAdmin(true);
    setLoading(false);
    fetchUsers();
  };

  const fetchUsers = async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select(`
        *,
        user_roles(role)
      `)
      .order("created_at", { ascending: false });

    setUsers(profiles || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Use admin API to create user (this requires service role key)
      // Since we can't use service role from client, we'll use standard signup
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
          },
        },
      });

      if (signUpError) {
        toast.error(signUpError.message);
        return;
      }

      if (!authData.user) {
        toast.error("Failed to create user");
        return;
      }

      // Update profile with phone
      if (formData.phone) {
        await supabase
          .from("profiles")
          .update({ phone: formData.phone })
          .eq("id", authData.user.id);
      }

      // Assign role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert([{
          user_id: authData.user.id,
          role: formData.role,
        }]);

      if (roleError) {
        toast.error("User created but role assignment failed: " + roleError.message);
      } else {
        toast.success("User created successfully!");
      }

      setOpen(false);
      setFormData({
        email: "",
        password: "",
        full_name: "",
        phone: "",
        role: "employee",
      });
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage system users</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Password *</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(val: "admin" | "employee") => setFormData({ ...formData, role: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Create User</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No users found. Create your first user!
                  </TableCell>
                </TableRow>
              ) : (
                users.map((userData) => (
                  <TableRow key={userData.id}>
                    <TableCell className="font-medium">{userData.full_name}</TableCell>
                    <TableCell>{userData.email}</TableCell>
                    <TableCell>{userData.phone || "-"}</TableCell>
                    <TableCell>
                      {userData.user_roles?.map((ur: any) => (
                        <Badge
                          key={ur.role}
                          variant={ur.role === "admin" ? "default" : "secondary"}
                          className="mr-1"
                        >
                          {ur.role === "admin" ? (
                            <ShieldAlert className="w-3 h-3 mr-1" />
                          ) : (
                            <Shield className="w-3 h-3 mr-1" />
                          )}
                          {ur.role}
                        </Badge>
                      ))}
                    </TableCell>
                    <TableCell>{new Date(userData.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="p-4 bg-warning/10 border-warning">
        <div className="flex gap-3">
          <ShieldAlert className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-warning">Admin Access Only</p>
            <p className="text-sm text-muted-foreground">
              Only administrators can create new users. Public signups are disabled for security.
              All users must be created by an admin to access the system.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Users;
