
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface CustomerTeamMembersProps {
  customerId: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  email?: string;
}

export function CustomerTeamMembers({ customerId }: CustomerTeamMembersProps) {
  const { data: teamMembers = [], isLoading } = useQuery({
    queryKey: ['customer-team-members', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_team_members')
        .select(`
          staff_id,
          staff:staff_id (id, name, role, avatar, email)
        `)
        .eq('customer_id', customerId);
        
      if (error) {
        console.error("Error fetching team members:", error);
        throw new Error(error.message);
      }
      
      // Extract staff data from the result
      const members: TeamMember[] = data
        .filter(item => item.staff) // Filter out any null staff references
        .map(item => ({
          id: item.staff.id,
          name: item.staff.name,
          role: item.staff.role,
          avatar: item.staff.avatar,
          email: item.staff.email
        }));
        
      return members;
    }
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg font-semibold">
          <Users className="h-5 w-5 mr-2" />
          Team Members
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-pulse">Loading team members...</div>
          </div>
        ) : teamMembers.length > 0 ? (
          <div className="space-y-4">
            {teamMembers.map(member => (
              <div key={member.id} className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage 
                    src={member.avatar || `https://avatar.vercel.sh/${member.name}.png`} 
                    alt={member.name} 
                  />
                  <AvatarFallback className="bg-primary/10">{member.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{member.name}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Badge variant="outline" className="bg-secondary/10">{member.role}</Badge>
                    {member.email && <span>{member.email}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            No team members assigned to this customer yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
