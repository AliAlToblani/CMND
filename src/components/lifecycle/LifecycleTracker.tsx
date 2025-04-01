import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LifecycleStageComponent, LifecycleStageProps } from "./LifecycleStage";
import { AddEditStage } from "./AddEditStage";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LifecycleStage, LifecycleStageWithOwner } from "@/types/customers";
import { createNotification } from "@/utils/notificationHelpers";
import { MessageSquare, Instagram, Globe, Mail, Smartphone } from "lucide-react";

interface LifecycleTrackerProps {
  customerId: string;
  customerName: string;
  stages: LifecycleStageProps[];
  onStagesUpdate?: (stages: LifecycleStageProps[]) => void;
}

const defaultFallbackStages: LifecycleStageProps[] = [
  {
    id: "fallback-stage-1",
    name: "Chat Integration",
    status: "not-started",
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    },
    notes: "Implement customer chat integration for real-time support.",
    icon: <MessageSquare className="h-5 w-5" />
  },
  {
    id: "fallback-stage-2",
    name: "Social Media Connect",
    status: "not-started",
    owner: {
      id: "00000000-0000-0000-0000-000000000004",
      name: "Mohammed Rahman",
      role: "Integration Engineer"
    },
    notes: "Set up Instagram business account connection for the customer.",
    icon: <Instagram className="h-5 w-5" />
  }
];

export function LifecycleTracker({
  customerId,
  customerName,
  stages: initialStages,
  onStagesUpdate,
}: LifecycleTrackerProps) {
  const [stages, setStages] = useState<LifecycleStageProps[]>(initialStages && initialStages.length > 0 ? initialStages : []);
  const [hasFetchedStages, setHasFetchedStages] = useState(false);

  const getDbCustomerId = () => {
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(customerId)) {
      return customerId;
    }
    return `00000000-0000-0000-0000-${customerId.replace(/\D/g, '').padStart(12, '0')}`;
  };

  const handleAddStage = async (newStage: Partial<LifecycleStageProps>) => {
    try {
      const stageWithId: LifecycleStageProps = {
        id: `stage-${Date.now()}`,
        name: newStage.name || "",
        status: newStage.status || "not-started",
        owner: newStage.owner || {
          id: "user-001",
          name: "Ahmed Abdullah",
          role: "Account Executive"
        },
        deadline: newStage.deadline,
        notes: newStage.notes,
      };

      const { data, error } = await supabase
        .from('lifecycle_stages')
        .insert({
          customer_id: getDbCustomerId(),
          name: stageWithId.name,
          status: stageWithId.status,
          owner_id: stageWithId.owner.id,
          deadline: stageWithId.deadline,
          notes: stageWithId.notes
        })
        .select();

      if (error) {
        console.error("Error details:", error);
        throw error;
      }

      if (data && data.length > 0) {
        const newStageData: LifecycleStageProps = {
          id: data[0].id,
          name: data[0].name,
          status: data[0].status as "not-started" | "in-progress" | "done" | "blocked",
          owner: stageWithId.owner,
          deadline: data[0].deadline,
          notes: data[0].notes,
        };

        const updatedStages = [...stages, newStageData];
        setStages(updatedStages);
        
        if (onStagesUpdate) {
          onStagesUpdate(updatedStages);
        }

        await createNotification({
          type: 'lifecycle',
          title: 'New Lifecycle Stage Added',
          message: `A new stage "${newStageData.name}" has been added for ${customerName}`,
          related_id: data[0].id,
          related_type: 'lifecycle_stage'
        });

        if (newStageData.owner) {
          await createNotification({
            type: 'lifecycle',
            title: 'Lifecycle Stage Assigned',
            message: `"${newStageData.name}" for ${customerName} has been assigned to ${newStageData.owner.name}`,
            related_id: data[0].id,
            related_type: 'lifecycle_stage'
          });
        }

        if (newStageData.deadline) {
          await createNotification({
            type: 'deadline',
            title: 'New Deadline Added',
            message: `A deadline has been set for "${newStageData.name}" (${customerName}) - ${new Date(newStageData.deadline).toLocaleDateString()}`,
            related_id: data[0].id,
            related_type: 'lifecycle_stage'
          });
        }
      }

      toast.success("Stage added successfully");
    } catch (error) {
      console.error("Error adding stage:", error);
      toast.error("Failed to add stage");
    }
  };

  const handleUpdateStage = async (stageId: string, updatedStage: Partial<LifecycleStageProps>) => {
    try {
      const updateData: any = {};
      if (updatedStage.name) updateData.name = updatedStage.name;
      if (updatedStage.status) updateData.status = updatedStage.status;
      if (updatedStage.owner?.id) updateData.owner_id = updatedStage.owner.id;
      if (updatedStage.deadline !== undefined) updateData.deadline = updatedStage.deadline;
      if (updatedStage.notes !== undefined) updateData.notes = updatedStage.notes;

      const { error } = await supabase
        .from('lifecycle_stages')
        .update(updateData)
        .eq('id', stageId);

      if (error) {
        console.error("Error details:", error);
        throw error;
      }

      const currentStage = stages.find(stage => stage.id === stageId);
      
      const updatedStages = stages.map(stage => {
        if (stage.id === stageId) {
          return { ...stage, ...updatedStage };
        }
        return stage;
      });
      
      setStages(updatedStages);
      
      if (onStagesUpdate) {
        onStagesUpdate(updatedStages);
      }

      await createNotification({
        type: 'lifecycle',
        title: 'Lifecycle Stage Updated',
        message: `Stage "${updatedStage.name || currentStage?.name}" for ${customerName} has been updated`,
        related_id: stageId,
        related_type: 'lifecycle_stage'
      });

      if (updatedStage.owner && (!currentStage?.owner || currentStage.owner.id !== updatedStage.owner.id)) {
        await createNotification({
          type: 'lifecycle',
          title: 'Lifecycle Stage Assigned',
          message: `"${updatedStage.name || currentStage?.name}" for ${customerName} has been assigned to ${updatedStage.owner.name}`,
          related_id: stageId,
          related_type: 'lifecycle_stage'
        });
      }

      if (updatedStage.status === 'done' && currentStage?.status !== 'done') {
        await createNotification({
          type: 'lifecycle',
          title: 'Lifecycle Stage Completed',
          message: `"${updatedStage.name || currentStage?.name}" for ${customerName} has been marked as complete`,
          related_id: stageId,
          related_type: 'lifecycle_stage'
        });
      }

      if (updatedStage.deadline && (!currentStage?.deadline || currentStage.deadline !== updatedStage.deadline)) {
        await createNotification({
          type: 'deadline',
          title: 'Deadline Updated',
          message: `Deadline for "${updatedStage.name || currentStage?.name}" (${customerName}) has been updated to ${new Date(updatedStage.deadline).toLocaleDateString()}`,
          related_id: stageId,
          related_type: 'lifecycle_stage'
        });
      }

      toast.success("Stage updated successfully");
    } catch (error) {
      console.error("Error updating stage:", error);
      toast.error("Failed to update stage");
    }
  };

  useEffect(() => {
    const fetchLifecycleStages = async () => {
      if (!customerId || hasFetchedStages) return;
      
      try {
        const dbCustomerId = getDbCustomerId();
        console.log("Fetching lifecycle stages for customer ID:", customerId, "DB ID:", dbCustomerId);

        const { data, error } = await supabase
          .from('lifecycle_stages')
          .select(`
            *,
            staff(id, name, role)
          `)
          .eq('customer_id', dbCustomerId);

        if (error) {
          console.error("Error details:", error);
          throw error;
        }

        if (data) {
          console.log("Fetched lifecycle stages:", data);
          const formattedStages: LifecycleStageProps[] = data.map((stage: any) => ({
            id: stage.id,
            name: stage.name,
            status: stage.status as "not-started" | "in-progress" | "done" | "blocked",
            owner: stage.staff ? {
              id: stage.staff.id,
              name: stage.staff.name,
              role: stage.staff.role
            } : {
              id: "00000000-0000-0000-0000-000000000001",
              name: "Ahmed Abdullah",
              role: "Account Executive"
            },
            deadline: stage.deadline,
            notes: stage.notes,
          }));

          setStages(formattedStages);
          setHasFetchedStages(true);
          
          if (onStagesUpdate) {
            onStagesUpdate(formattedStages);
          }
        }
      } catch (error) {
        console.error("Error fetching lifecycle stages:", error);
        toast.error("Failed to load lifecycle stages");
      }
    };

    if (customerId) {
      fetchLifecycleStages();
    }
  }, [customerId, onStagesUpdate, hasFetchedStages]);
  
  useEffect(() => {
    if (hasFetchedStages && stages.length === 0) {
      console.log("No stages found after fetch, using fallback stages");
      setStages(defaultFallbackStages);
      if (onStagesUpdate) {
        onStagesUpdate(defaultFallbackStages);
      }
    }
  }, [hasFetchedStages, stages.length, onStagesUpdate]);

  return (
    <Card className="w-full glass-card">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-xl">Lifecycle Tracker: {customerName}</CardTitle>
        <AddEditStage 
          onSave={handleAddStage} 
          customerId={customerId}
        />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stages.map((stage, index) => (
            <div key={stage.id} className="animate-slide-in" style={{ animationDelay: `${index * 0.05}s` }}>
              <LifecycleStageComponent 
                {...stage} 
                onUpdate={handleUpdateStage}
              />
            </div>
          ))}
          
          {stages.length === 0 && (
            <div className="col-span-3 text-center py-8">
              <p className="text-muted-foreground">No lifecycle stages defined. Add your first stage!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
