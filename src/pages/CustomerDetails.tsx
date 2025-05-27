
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Building, DollarSign, Calendar, Tag, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LifecycleTracker } from "@/components/lifecycle/LifecycleTracker";
import { CustomerTimeline } from "@/components/customers/CustomerTimeline";
import { CustomerFeedback } from "@/components/customers/CustomerFeedback";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { findCustomerById } from "@/utils/customerUtils";
import { CustomerData } from "@/components/customers/CustomerCard";

const CustomerDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  console.log("CustomerDetails component loaded with ID:", id);

  const { data: customer, isLoading, error } = useQuery({
    queryKey: ['customer-details', id],
    queryFn: async () => {
      if (!id) return null;
      
      console.log("Fetching customer details for ID:", id);
      
      try {
        // First try to get from database
        const { data: dbCustomer, error: dbError } = await supabase
          .from('customers')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (dbError) {
          console.error("Database error:", dbError);
        }

        if (dbCustomer) {
          console.log("Found customer in database:", dbCustomer);
          return dbCustomer;
        }

        // If not found in database, try findCustomerById utility
        console.log("Customer not found in database, trying utility function");
        const foundCustomer = await findCustomerById(id);
        if (foundCustomer) {
          console.log("Found customer via utility:", foundCustomer);
          return foundCustomer;
        }

        console.log("Customer not found anywhere");
        return null;
      } catch (err) {
        console.error("Error fetching customer:", err);
        return null;
      }
    },
    enabled: !!id
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse">Loading customer details...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">Error loading customer details</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!customer) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div>Customer not found</div>
        </div>
      </DashboardLayout>
    );
  }

  // Create a consistent customer data object for components that expect CustomerData type
  const customerCardData: CustomerData = {
    id: customer.id,
    name: customer.name,
    logo: customer.logo || undefined,
    segment: customer.segment || "Unknown Segment",
    region: customer.region || "Unknown Region", 
    stage: customer.stage || "New",
    status: (customer.status as "not-started" | "in-progress" | "done" | "blocked") || "not-started",
    contractSize: customer.contract_size || customer.contractSize || 0,
    description: customer.description || undefined,
    owner: {
      id: customer.owner_id || "unknown",
      name: "Account Manager",
      role: "Sales"
    },
    owner_id: customer.owner_id || undefined,
    contract_size: customer.contract_size || customer.contractSize || undefined
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "not-started":
        return "bg-gray-100 text-gray-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "done":
        return "bg-green-100 text-green-800";
      case "blocked":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate("/customers")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Customers
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{customer.name}</h1>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={getStatusColor(customer.status || "not-started")}>
                  {(customer.status || "not-started").replace("-", " ")}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {customer.segment} • {customer.region}
                </span>
              </div>
            </div>
          </div>
          <Button onClick={() => navigate(`/customers/${id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Customer
          </Button>
        </div>

        {/* Customer Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Segment</p>
                  <p className="font-medium">{customer.segment || "Unknown"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Contract Size</p>
                  <p className="font-medium">${(customer.contract_size || customer.contractSize || 0).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Current Stage</p>
                  <p className="font-medium">{customer.stage || "New"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Account Manager</p>
                  <p className="font-medium">{customer.owner_id ? "Account Manager" : "Unassigned"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Description Card */}
        {customer.description && (
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{customer.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="lifecycle" className="space-y-4">
          <TabsList>
            <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="lifecycle" className="space-y-4">
            <LifecycleTracker customerId={id || null} />
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <CustomerTimeline customerId={id || null} />
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4">
            <CustomerFeedback customerId={id || null} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default CustomerDetails;
