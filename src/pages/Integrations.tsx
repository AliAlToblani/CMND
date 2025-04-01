
import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Instagram,
  Globe,
  Mail,
  Smartphone,
  HelpCircle,
  PlusCircle,
  RefreshCw,
  Check,
  AlertCircle,
  Loader2
} from "lucide-react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const IntegrationsPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Integrations</h1>
          <Button className="glass-button">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Integration
          </Button>
        </div>

        <Card className="glass-card animate-fade-in">
          <CardHeader>
            <CardTitle className="text-xl">Integration Center</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="messaging">
              <TabsList className="glass-card">
                <TabsTrigger value="messaging">Messaging</TabsTrigger>
                <TabsTrigger value="website">Website</TabsTrigger>
                <TabsTrigger value="mobile">Mobile Apps</TabsTrigger>
                <TabsTrigger value="other">Other</TabsTrigger>
              </TabsList>
              <TabsContent value="messaging" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <IntegrationCard 
                    title="WhatsApp" 
                    icon={<MessageSquare className="h-10 w-10 text-green-600" />}
                    status="connected"
                    description="Business account connected for document uploads and verification"
                    details={[
                      { label: "Business Phone", value: "+971 50 123 4567" },
                      { label: "Verification", value: "Approved" },
                      { label: "Business ID", value: "123456789012345" }
                    ]}
                  />
                  
                  <IntegrationCard 
                    title="Instagram" 
                    icon={<Instagram className="h-10 w-10 text-pink-600" />}
                    status="in-progress"
                    description="Account setup in progress, waiting for API approvals"
                    details={[
                      { label: "Handle", value: "@doocommand" },
                      { label: "API Status", value: "Pending Review" },
                      { label: "Progress", value: <Progress value={70} className="mt-1" /> }
                    ]}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="website" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <IntegrationCard 
                    title="Website Widget" 
                    icon={<Globe className="h-10 w-10 text-blue-600" />}
                    status="not-started"
                    description="Embed the chat widget on your website for customer interactions"
                    details={[
                      { label: "Script", value: "Not Generated" },
                      { label: "Installation", value: "Not Started" }
                    ]}
                  />
                  
                  <IntegrationCard 
                    title="Email Integration" 
                    icon={<Mail className="h-10 w-10 text-yellow-600" />}
                    status="error"
                    description="Connect your email service for notifications and communications"
                    details={[
                      { label: "SMTP Setup", value: "Failed" },
                      { label: "Error", value: "Authentication failed" }
                    ]}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="mobile" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <IntegrationCard 
                    title="Mobile SDK" 
                    icon={<Smartphone className="h-10 w-10 text-doo-purple-600" />}
                    status="connected"
                    description="Native SDK for iOS and Android applications"
                    details={[
                      { label: "Platform", value: "React Native" },
                      { label: "Version", value: "2.1.3" },
                      { label: "Last Updated", value: "3 days ago" }
                    ]}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="other" className="mt-4">
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <HelpCircle className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No other integrations yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Connect with additional platforms and services to expand your capabilities.
                  </p>
                  <Button className="glass-button">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Explore Integrations
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

interface IntegrationCardProps {
  title: string;
  icon: React.ReactNode;
  status: "connected" | "in-progress" | "not-started" | "error";
  description: string;
  details: Array<{
    label: string;
    value: React.ReactNode | string;
  }>;
}

const IntegrationCard = ({ title, icon, status, description, details }: IntegrationCardProps) => {
  const getStatusIcon = () => {
    switch (status) {
      case "connected":
        return <Check className="h-5 w-5 text-green-600" />;
      case "in-progress":
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      case "not-started":
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "connected":
        return "Connected";
      case "in-progress":
        return "In Progress";
      case "not-started":
        return "Not Started";
      case "error":
        return "Error";
    }
  };

  return (
    <Card className="glass-card animate-slide-in">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            {icon}
            <div className="ml-4">
              <h3 className="text-lg font-semibold">{title}</h3>
              <div className="flex items-center mt-1">
                {getStatusIcon()}
                <span className="text-sm ml-1">{getStatusText()}</span>
              </div>
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" className={status === "connected" ? "glass-input" : "glass-button"}>
                  {status === "connected" ? <RefreshCw className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="glass-card">
                {status === "connected" ? "Refresh Connection" : "Set Up Integration"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        
        <div className="space-y-2">
          {details.map((detail, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-sm font-medium">{detail.label}:</span>
              <span className="text-sm text-right">{detail.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default IntegrationsPage;
