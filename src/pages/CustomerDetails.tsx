
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Calendar, 
  FileText, 
  User, 
  Building, 
  MapPin,
  DollarSign,
  Activity
} from "lucide-react";
import { customers } from "@/data/mockData";
import { CustomerOwner, CustomerData } from "@/components/customers/CustomerCard";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Customer name must be at least 2 characters.",
  }),
  segment: z.string(),
  region: z.string(),
  stage: z.string(),
  status: z.enum(["not-started", "in-progress", "done", "blocked"]),
  contractSize: z.coerce.number().min(0),
  ownerId: z.string(),
});

const CustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  
  const customer = customers.find(c => c.id === id);
  
  if (!customer) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <h2 className="text-2xl font-bold mb-4">Customer Not Found</h2>
          <Button onClick={() => navigate("/customers")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Customers
          </Button>
        </div>
      </DashboardLayout>
    );
  }
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: customer.name,
      segment: customer.segment,
      region: customer.region,
      stage: customer.stage,
      status: customer.status,
      contractSize: customer.contractSize,
      ownerId: customer.owner.id,
    },
  });
  
  function onSubmit(values: z.infer<typeof formSchema>) {
    // In a real app, you would save this data to your backend
    console.log(values);
    
    // Simulate an API call
    setTimeout(() => {
      setIsEditing(false);
      toast.success("Customer details updated successfully");
    }, 500);
  }
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/customers")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">{customer.name}</h1>
        </div>
        
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Customer Information</CardTitle>
                    <CardDescription>Manage customer details and preferences</CardDescription>
                  </div>
                  {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)}>
                      Edit Details
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {!isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
                          <p className="text-base">{customer.name}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Segment</h3>
                          <p className="text-base">{customer.segment}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Region</h3>
                          <p className="text-base">{customer.region}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Current Stage</h3>
                          <p className="text-base">{customer.stage}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                          <div className="mt-1">
                            <span className={`status-badge status-${customer.status}`}>
                              {customer.status.replace("-", " ")}
                            </span>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Contract Size</h3>
                          <p className="text-base">${customer.contractSize.toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Owner</h3>
                        <div className="flex items-center mt-1">
                          <User className="h-4 w-4 mr-2 text-muted-foreground" />
                          <p className="text-base">{customer.owner.name} ({customer.owner.role})</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Customer name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="segment"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Segment</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select segment" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Enterprise">Enterprise</SelectItem>
                                    <SelectItem value="Mid-Market">Mid-Market</SelectItem>
                                    <SelectItem value="SMB">SMB</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="region"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Region</FormLabel>
                                <FormControl>
                                  <Input placeholder="Region" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="stage"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Current Stage</FormLabel>
                                <FormControl>
                                  <Input placeholder="Current stage" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="not-started">Not Started</SelectItem>
                                    <SelectItem value="in-progress">In Progress</SelectItem>
                                    <SelectItem value="done">Done</SelectItem>
                                    <SelectItem value="blocked">Blocked</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="contractSize"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Contract Size ($)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="Contract size" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="ownerId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Owner</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select owner" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="user-001">Ahmed Abdullah (Account Executive)</SelectItem>
                                  <SelectItem value="user-002">Fatima Hassan (Customer Success Manager)</SelectItem>
                                  <SelectItem value="user-003">Khalid Al-Farsi (Finance Manager)</SelectItem>
                                  <SelectItem value="user-004">Mohammed Rahman (Integration Engineer)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex justify-end">
                          <Button type="submit">Save Changes</Button>
                        </div>
                      </form>
                    </Form>
                  )}
                </CardContent>
              </Card>
              
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-sm font-medium">Customer Since</span>
                        </div>
                        <span>Jan 2023</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-sm font-medium">Annual Value</span>
                        </div>
                        <span>${(customer.contractSize / 12).toLocaleString()} / mo</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Activity className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-sm font-medium">Health Score</span>
                        </div>
                        <span className="text-green-600 font-medium">Good</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="border-l-2 border-primary pl-4 py-2">
                        <p className="text-sm font-medium">Demo Completed</p>
                        <p className="text-xs text-muted-foreground">2 days ago</p>
                      </div>
                      
                      <div className="border-l-2 border-primary pl-4 py-2">
                        <p className="text-sm font-medium">Proposal Sent</p>
                        <p className="text-xs text-muted-foreground">1 week ago</p>
                      </div>
                      
                      <div className="border-l-2 border-primary pl-4 py-2">
                        <p className="text-sm font-medium">Initial Contact</p>
                        <p className="text-xs text-muted-foreground">2 weeks ago</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Customer Activity</CardTitle>
                <CardDescription>View all customer interactions and events</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-8 text-muted-foreground">Coming soon: Activity timeline for this customer</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Documents & Contracts</CardTitle>
                <CardDescription>View and manage customer documents</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-8 text-muted-foreground">Coming soon: Document management for this customer</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default CustomerDetails;
