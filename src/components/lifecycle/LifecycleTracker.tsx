
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LifecycleStage, LifecycleStageProps } from "./LifecycleStage";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface LifecycleTrackerProps {
  customerId: string;
  customerName: string;
  stages: LifecycleStageProps[];
}

export function LifecycleTracker({
  customerId,
  customerName,
  stages,
}: LifecycleTrackerProps) {
  return (
    <Card className="w-full glass-card">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-xl">Lifecycle Tracker: {customerName}</CardTitle>
        <Button size="sm" className="glass-button animate-fade-in">
          <Plus className="h-4 w-4 mr-1" /> Add Stage
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stages.map((stage, index) => (
            <div key={stage.id} className="animate-slide-in" style={{ animationDelay: `${index * 0.05}s` }}>
              <LifecycleStage {...stage} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
