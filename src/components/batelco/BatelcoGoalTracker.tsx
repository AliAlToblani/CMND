import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DollarSign,
  Star,
  Trophy,
  Rocket,
  TrendingUp,
  PartyPopper,
  Settings2,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const BATELCO_REVENUE_KEY = "batelco-revenue-goal";

export function BatelcoGoalTracker() {
  const [revenueGoal, setRevenueGoal] = useState(() => {
    const saved = localStorage.getItem(BATELCO_REVENUE_KEY);
    return saved ? Number(saved) : 250000;
  });
  const [currentRevenue, setCurrentRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [animatedRevenuePercent, setAnimatedRevenuePercent] = useState(0);
  const [editRevGoal, setEditRevGoal] = useState("");

  useEffect(() => {
    fetchGoalData();
  }, []);

  const fetchGoalData = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let totalRevenue = 0;

      try {
        const { data: allCustomers } = await supabase
          .from("customers")
          .select("id, status, partner_label");

        const batelcoCustomers = (allCustomers || []).filter(
          (c: any) => c.partner_label && String(c.partner_label).toLowerCase() === "batelco"
        );

        const batelcoIds = batelcoCustomers.map((c: any) => c.id);
        const churnedIds = new Set(
          batelcoCustomers.filter((c: any) => c.status === "churned").map((c: any) => c.id)
        );

        if (batelcoIds.length > 0) {
          const { data: contracts } = await supabase
            .from("contracts")
            .select("value, annual_rate, setup_fee, status, customer_id")
            .in("customer_id", batelcoIds);

          totalRevenue = (contracts || []).reduce((sum: number, c: any) => {
            if (churnedIds.has(c.customer_id)) return sum;
            const st = c.status || "";
            if (st !== "active" && st !== "pending" && st !== "") return sum;
            const v = (c.setup_fee || 0) + (c.annual_rate || 0);
            return sum + (v > 0 ? v : c.value || 0);
          }, 0);
        }
      } catch {
        // Fallback — show zeros
      }

      setCurrentRevenue(totalRevenue);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  const revenuePercentage = Math.min((currentRevenue / revenueGoal) * 100, 100);

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setAnimatedRevenuePercent(revenuePercentage), 100);
      return () => clearTimeout(t);
    }
  }, [loading, revenuePercentage]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
  };

  const handleSaveGoals = useCallback(() => {
    const rev = Number(editRevGoal) || revenueGoal;
    setRevenueGoal(rev);
    localStorage.setItem(BATELCO_REVENUE_KEY, String(rev));
  }, [editRevGoal, revenueGoal]);

  if (loading) {
    return (
      <Card className="glass-card animate-pulse">
        <CardContent className="p-6">
          <div className="h-32 bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const isRevenueGoalMet = revenuePercentage >= 100;

  return (
    <Card className="glass-card overflow-hidden relative border-red-200/50 dark:border-red-800/30">
      {isRevenueGoalMet && (
        <div className="absolute top-4 right-4 pointer-events-none">
          <PartyPopper className="h-6 w-6 text-yellow-500 animate-bounce" />
        </div>
      )}

      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm text-foreground">Revenue Target</h3>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => {
                  setEditRevGoal(String(revenueGoal));
                }}
              >
                <Settings2 className="h-3.5 w-3.5" />
                Adjust Target
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 space-y-3" align="end">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Revenue Target ($)
                </label>
                <Input
                  type="number"
                  value={editRevGoal}
                  onChange={(e) => setEditRevGoal(e.target.value)}
                  className="h-8 text-xs"
                  placeholder="250000"
                />
              </div>
              <Button size="sm" className="w-full h-8 text-xs bg-red-600 hover:bg-red-700" onClick={handleSaveGoals}>
                Save Target
              </Button>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${isRevenueGoalMet ? "bg-green-500/20" : "bg-red-500/10"}`}>
                <DollarSign className={`h-4 w-4 ${isRevenueGoalMet ? "text-green-500" : "text-red-600"}`} />
              </div>
              <div>
                <p className="font-medium text-sm">Total Revenue</p>
                <p className="text-[11px] text-muted-foreground">Target: {formatCurrency(revenueGoal)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-red-600">{formatCurrency(currentRevenue)}</p>
              <p className="text-[11px] text-muted-foreground">{revenuePercentage.toFixed(1)}%</p>
            </div>
          </div>
          <div className="relative">
            <Progress value={animatedRevenuePercent} className="h-3 bg-muted rounded-full" />
            <div
              className={`absolute top-0 left-0 h-3 rounded-full transition-all duration-1000 ease-out ${
                isRevenueGoalMet
                  ? "bg-gradient-to-r from-green-500 to-emerald-400 animate-pulse"
                  : "bg-gradient-to-r from-red-500 to-red-400"
              }`}
              style={{ width: `${animatedRevenuePercent}%` }}
            />
            {isRevenueGoalMet && (
              <div className="absolute -right-1 -top-1">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 animate-spin" style={{ animationDuration: "3s" }} />
              </div>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-border mt-4">
          <div className="flex items-center justify-center gap-2 text-xs">
            {revenuePercentage < 50 ? (
              <>
                <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-muted-foreground">Keep building momentum!</span>
              </>
            ) : revenuePercentage < 100 ? (
              <>
                <Rocket className="h-3.5 w-3.5 text-red-500" />
                <span className="text-muted-foreground">Great progress, keep pushing!</span>
              </>
            ) : (
              <>
                <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                <span className="font-medium text-yellow-600">Target achieved!</span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
