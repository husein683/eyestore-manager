import { Button } from "@/components/ui/button";
import { Eye, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/supabase";
import { useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-accent to-primary/80 p-4">
      <div className="text-center space-y-8 max-w-2xl">
        <div className="inline-block p-4 bg-white rounded-full shadow-2xl">
          <Eye className="w-16 h-16 text-primary" />
        </div>
        <h1 className="text-6xl font-bold text-white drop-shadow-lg">
          Naeem Optics Inventory
        </h1>
        <p className="text-xl text-white/90 drop-shadow">
          A complete optical store management solution
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            variant="secondary"
            className="text-lg px-8 py-6"
            onClick={() => navigate("/auth")}
          >
            Get Started
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
