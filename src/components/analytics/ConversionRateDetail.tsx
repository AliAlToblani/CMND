import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Users, Target, Percent } from "lucide-react";

interface ConversionData {
  totalCustomers: number;
  liveCustomers: number;
  conversionRate: number;
  bySegment: Record<string, { total: number; converted: number; rate: number }>;
  byCountry: Record<string, { total: number; converted: number; rate: number }>;
  byStage: Record<string, { count: number; percentage: number }>;
}

export const ConversionRateDetail = () => {
  const [data, setData] = useState<ConversionData>({
    totalCustomers: 0,
    liveCustomers: 0,
    conversionRate: 0,
    bySegment: {},
    byCountry: {},
    byStage: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversionData = async () => {
      try {
        const { data: customers, error } = await supabase
          .from('customers')
          .select('*');

        if (error) throw error;

        const total = customers?.length || 0;
        const live = customers?.filter(c => c.status === 'done' || c.status === null).length || 0;
        const rate = total > 0 ? (live / total) * 100 : 0;

        // Group by segment
        const segmentGroups = customers?.reduce((acc, customer) => {
          const segment = customer.segment || 'Unknown';
          if (!acc[segment]) acc[segment] = { total: 0, converted: 0, rate: 0 };
          acc[segment].total++;
          if (customer.status === 'done' || customer.status === null) {
            acc[segment].converted++;
          }
          acc[segment].rate = (acc[segment].converted / acc[segment].total) * 100;
          return acc;
        }, {} as Record<string, { total: number; converted: number; rate: number }>) || {};

        // Group by country
        const countryGroups = customers?.reduce((acc, customer) => {
          const country = customer.country || 'Unknown';
          if (!acc[country]) acc[country] = { total: 0, converted: 0, rate: 0 };
          acc[country].total++;
          if (customer.status === 'done' || customer.status === null) {
            acc[country].converted++;
          }
          acc[country].rate = (acc[country].converted / acc[country].total) * 100;
          return acc;
        }, {} as Record<string, { total: number; converted: number; rate: number }>) || {};

        // Group by stage
        const stageGroups = customers?.reduce((acc, customer) => {
          const stage = customer.stage || 'Unknown';
          if (!acc[stage]) acc[stage] = { count: 0, percentage: 0 };
          acc[stage].count++;
          return acc;
        }, {} as Record<string, { count: number; percentage: number }>) || {};

        // Calculate stage percentages
        Object.keys(stageGroups).forEach(stage => {
          stageGroups[stage].percentage = (stageGroups[stage].count / total) * 100;
        });

        setData({
          totalCustomers: total,
          liveCustomers: live,
          conversionRate: rate,
          bySegment: segmentGroups,
          byCountry: countryGroups,
          byStage: stageGroups
        });
      } catch (error) {
        console.error("Error fetching conversion data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversionData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        {Array(6).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Conversion Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Percent className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-3xl font-bold text-primary">{data.conversionRate.toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground">Overall Conversion Rate</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{data.totalCustomers}</p>
            <p className="text-sm text-muted-foreground">Total Customers</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Target className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold text-green-600">{data.liveCustomers}</p>
            <p className="text-sm text-muted-foreground">Converted to Live</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold text-blue-600">{data.totalCustomers - data.liveCustomers}</p>
            <p className="text-sm text-muted-foreground">Still in Pipeline</p>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Customers</span>
              <span className="text-sm font-bold">{data.totalCustomers}</span>
            </div>
            <Progress value={100} className="h-2" />
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Converted to Live</span>
              <span className="text-sm font-bold">{data.liveCustomers}</span>
            </div>
            <Progress value={data.conversionRate} className="h-2" />
            
            <div className="text-center text-sm text-muted-foreground">
              {data.totalCustomers - data.liveCustomers} customers ({(100 - data.conversionRate).toFixed(1)}%) still in pipeline
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversion by Segment */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Rate by Segment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(data.bySegment)
              .sort(([,a], [,b]) => b.rate - a.rate)
              .map(([segment, stats]) => (
                <div key={segment} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{segment}</span>
                      <Badge variant="outline">{stats.total} customers</Badge>
                    </div>
                    <span className="font-bold text-primary">{stats.rate.toFixed(1)}%</span>
                  </div>
                  <Progress value={stats.rate} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {stats.converted} of {stats.total} converted
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Conversion by Country */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Rate by Country</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(data.byCountry)
              .filter(([,stats]) => stats.total >= 2) // Only show countries with at least 2 customers
              .sort(([,a], [,b]) => b.rate - a.rate)
              .slice(0, 10) // Show top 10
              .map(([country, stats]) => (
                <div key={country} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">🌍 {country}</span>
                      <Badge variant="outline">{stats.total} customers</Badge>
                    </div>
                    <span className="font-bold text-primary">{stats.rate.toFixed(1)}%</span>
                  </div>
                  <Progress value={stats.rate} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {stats.converted} of {stats.total} converted
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Customer Distribution by Stage */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Distribution by Stage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(data.byStage)
              .sort(([,a], [,b]) => b.count - a.count)
              .map(([stage, stats]) => (
                <div key={stage} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">📍 {stage}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{stats.count}</span>
                      <span className="text-sm text-muted-foreground">({stats.percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <Progress value={stats.percentage} className="h-2" />
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};