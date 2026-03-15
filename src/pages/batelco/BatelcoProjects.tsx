import { useState, useEffect, useCallback, useMemo } from "react";
import { BatelcoLayout } from "@/components/batelco/BatelcoLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ClipboardCheck,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Sparkles,
  Play,
  RefreshCw,
  Flame,
  AlertTriangle,
  Minus,
  Clock,
  ChevronDown,
  ChevronRight,
  Search,
  ExternalLink,
  Eye,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";

type Priority = "high" | "moderate" | "low";

interface SubTask {
  id: string;
  label: string;
  checked: boolean;
  deadline?: string;
  stage?: string;
  owner?: string;
}

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  subtasks?: SubTask[];
  expanded?: boolean;
  deadline?: string;
  stage?: string;
  owner?: string;
}

interface TestingLink {
  id: string;
  label: string;
  url: string;
}

interface ProjectCustomer {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_logo?: string;
  service_type?: string | null;
  project_manager: string;
  secondary_project_manager?: string;
  service_description: string;
  checklist_items: ChecklistItem[];
  notes: string;
  status: "ongoing" | "completed" | "demo";
  priority: Priority;
  start_date?: string;
  deadline?: string;
  demo_date?: string;
  demo_delivered?: boolean;
  testing_links?: TestingLink[];
  created_at: string;
  completed_at?: string;
}

const getDeadlineInfo = (deadline?: string) => {
  if (!deadline) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0)
    return { label: `${Math.abs(diffDays)}d overdue`, color: "bg-red-600 text-white" };
  if (diffDays === 0) return { label: "Due today", color: "bg-red-500 text-white" };
  if (diffDays <= 3)
    return { label: `${diffDays}d left`, color: "bg-red-500/20 text-red-500 border border-red-500/30" };
  if (diffDays <= 7)
    return { label: `${diffDays}d left`, color: "bg-orange-500/20 text-orange-500 border border-orange-500/30" };
  if (diffDays <= 14)
    return { label: `${diffDays}d left`, color: "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30" };
  return { label: `${diffDays}d left`, color: "bg-green-500/20 text-green-500 border border-green-500/30" };
};

const stageLabelMap: Record<string, { label: string; color: string }> = {
  not_started: { label: "Not Started", color: "bg-muted text-muted-foreground" },
  in_progress: { label: "In Progress", color: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  client_review: { label: "Client Review", color: "bg-purple-500/15 text-purple-600 dark:text-purple-400" },
  internal_revision: { label: "Revision", color: "bg-orange-500/15 text-orange-600 dark:text-orange-400" },
  blocked: { label: "Blocked", color: "bg-red-500/15 text-red-600 dark:text-red-400" },
  done: { label: "Done", color: "bg-green-500/15 text-green-600 dark:text-green-400" },
};

const priorityConfig = {
  high: { color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
  moderate: { color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
  low: { color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
};

export default function BatelcoProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectCustomer[]>([]);
  const [batelcoCustomerIds, setBatelcoCustomerIds] = useState<Set<string>>(new Set());
  const [selectedProject, setSelectedProject] = useState<ProjectCustomer | null>(null);
  const [activeTab, setActiveTab] = useState<"demo" | "ongoing" | "completed">("demo");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const { data: allCustomers } = await supabase
        .from("customers")
        .select("id, partner_label");

      const batelcoIds = new Set(
        (allCustomers || [])
          .filter((c: any) => c.partner_label && String(c.partner_label).toLowerCase() === "batelco")
          .map((c: any) => c.id)
      );
      setBatelcoCustomerIds(batelcoIds);

      const { data, error } = await supabase
        .from("project_manager" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading projects:", error);
        return;
      }

      const formatted: ProjectCustomer[] = ((data || []) as any[])
        .filter((p: any) => batelcoIds.has(p.customer_id))
        .map((p: any) => ({
          id: p.id,
          customer_id: p.customer_id,
          customer_name: p.customer_name,
          customer_logo: p.customer_logo || undefined,
          service_type: p.service_type,
          project_manager: p.project_manager || "",
          secondary_project_manager: p.secondary_project_manager || undefined,
          service_description: p.service_description || "",
          checklist_items: (p.checklist_items as ChecklistItem[]) || [],
          notes: p.notes || "",
          status: p.status as "ongoing" | "completed" | "demo",
          priority: (p.priority as Priority) || "moderate",
          start_date: p.start_date || undefined,
          deadline: p.deadline || undefined,
          demo_date: p.demo_date || undefined,
          demo_delivered: p.demo_delivered || false,
          testing_links: (p.testing_links as TestingLink[]) || [],
          created_at: p.created_at,
          completed_at: p.completed_at || undefined,
        }));

      setProjects(formatted);

      if (selectedProject) {
        const updated = formatted.find((p) => p.id === selectedProject.id);
        if (updated) setSelectedProject(updated);
        else setSelectedProject(null);
      }
    } catch (error) {
      console.error("Error loading projects:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedProject?.id]);

  useEffect(() => {
    loadData();
  }, []);

  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => p.status === activeTab)
      .filter((p) =>
        searchQuery ? p.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) : true
      );
  }, [projects, activeTab, searchQuery]);

  const demoCount = projects.filter((p) => p.status === "demo").length;
  const ongoingCount = projects.filter((p) => p.status === "ongoing").length;
  const completedCount = projects.filter((p) => p.status === "completed").length;

  const groupByPriority = (list: ProjectCustomer[]) => ({
    high: list.filter((p) => p.priority === "high"),
    moderate: list.filter((p) => p.priority === "moderate"),
    low: list.filter((p) => p.priority === "low"),
  });

  const grouped = groupByPriority(filteredProjects);

  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) next.delete(phaseId);
      else next.add(phaseId);
      return next;
    });
  };

  const getProgress = (items: ChecklistItem[]) => {
    if (items.length === 0) return 0;
    const done = items.filter((i) => i.checked).length;
    return Math.round((done / items.length) * 100);
  };

  if (loading) {
    return (
      <BatelcoLayout>
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-12 w-64 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-[600px]" />
            <Skeleton className="h-[600px] lg:col-span-2" />
          </div>
        </div>
      </BatelcoLayout>
    );
  }

  const renderProjectCard = (project: ProjectCustomer) => {
    const progress = getProgress(project.checklist_items);
    return (
      <Card
        key={project.id}
        className={`cursor-pointer transition-all hover:shadow-md ${
          selectedProject?.id === project.id
            ? "border-red-500 bg-red-500/5 shadow-md"
            : "border-border hover:border-red-500/50"
        }`}
        onClick={() => {
          setSelectedProject(project);
          setExpandedPhases(new Set());
        }}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src={project.customer_logo} alt={project.customer_name} />
              <AvatarFallback className="bg-gradient-to-br from-red-500/20 to-red-500/10 text-red-600 text-xs font-semibold">
                {project.customer_name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-semibold text-sm truncate">{project.customer_name}</h4>
                {activeTab !== "completed" && (
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5 shrink-0">
                    {project.checklist_items.filter((i) => i.checked).length}/
                    {project.checklist_items.length}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                  {project.service_type || "N/A"}
                </Badge>
                {project.status === "demo" && project.demo_delivered && (
                  <Badge className="text-[10px] h-4 px-1.5 bg-green-600">Demo Delivered</Badge>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 mt-1.5">
                <span className="text-[10px] text-muted-foreground truncate">
                  {project.project_manager || "No lead"}
                  {project.secondary_project_manager && " +1"}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  {project.start_date && activeTab !== "completed" && (
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(project.start_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                  {project.start_date && project.deadline && activeTab !== "completed" && (
                    <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
                  )}
                  {project.deadline && activeTab !== "completed" && (
                    <Badge className={`text-[10px] h-4 px-1.5 ${getDeadlineInfo(project.deadline)?.color}`}>
                      {getDeadlineInfo(project.deadline)?.label}
                    </Badge>
                  )}
                  {activeTab === "demo" && project.demo_date && !project.deadline && !project.start_date && (
                    <span className="text-[10px] text-blue-500">
                      {new Date(project.demo_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              {activeTab !== "completed" && (
                <Progress value={progress} className="h-1 mt-2" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderPriorityGroup = (
    label: string,
    icon: React.ReactNode,
    config: { color: string; bg: string; border: string },
    items: ProjectCustomer[]
  ) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-4">
        <div className={`flex items-center gap-2 mb-2 px-2 py-1.5 rounded-md ${config.bg} ${config.border} border`}>
          {icon}
          <span className={`text-sm font-semibold ${config.color}`}>{label}</span>
          <Badge variant="secondary" className="ml-auto text-xs">
            {items.length}
          </Badge>
        </div>
        <div className="space-y-2">
          {items.map((project) => renderProjectCard(project))}
        </div>
      </div>
    );
  };

  const renderProjectDetails = () => {
    if (!selectedProject) {
      return (
        <Card className="lg:col-span-2 border-2 border-dashed border-border/50">
          <CardContent className="flex flex-col items-center justify-center h-[600px] text-muted-foreground">
            <Eye className="h-16 w-16 mb-4 opacity-30" />
            <h3 className="text-lg font-medium mb-2">Select a Project</h3>
            <p className="text-sm text-center max-w-sm">
              Choose a project from the list to view its details
            </p>
          </CardContent>
        </Card>
      );
    }

    const progress = getProgress(selectedProject.checklist_items);

    return (
      <Card className="lg:col-span-2 border-2 border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-start gap-3">
            <Avatar
              className="h-12 w-12 shrink-0 cursor-pointer hover:ring-2 hover:ring-red-500 transition-all"
              onClick={() => navigate(`/batelco/customers/${selectedProject.customer_id}`)}
            >
              <AvatarImage src={selectedProject.customer_logo} alt={selectedProject.customer_name} />
              <AvatarFallback className="bg-gradient-to-br from-red-500/20 to-red-500/10 text-red-600 text-lg font-semibold">
                {selectedProject.customer_name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <CardTitle
                className="text-xl cursor-pointer hover:text-red-600 transition-colors inline-block"
                onClick={() => navigate(`/batelco/customers/${selectedProject.customer_id}`)}
              >
                {selectedProject.customer_name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge
                  variant={
                    selectedProject.status === "completed"
                      ? "default"
                      : selectedProject.status === "demo"
                      ? "secondary"
                      : "outline"
                  }
                >
                  {selectedProject.status === "ongoing" && "Ongoing"}
                  {selectedProject.status === "completed" && "Completed"}
                  {selectedProject.status === "demo" && "Demo Scheduled"}
                </Badge>
                {selectedProject.status === "demo" && selectedProject.demo_delivered && (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Demo Delivered
                  </Badge>
                )}
                {selectedProject.service_type && (
                  <Badge variant="secondary">
                    Service: {selectedProject.service_type.charAt(0).toUpperCase() + selectedProject.service_type.slice(1)}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  <Eye className="h-3 w-3 mr-1" />
                  Read Only
                </Badge>
              </div>
            </div>
          </div>

          {/* Meta info row */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/30 flex-wrap text-sm text-muted-foreground">
            {selectedProject.project_manager && (
              <span>Lead: <span className="text-foreground font-medium">{selectedProject.project_manager}</span></span>
            )}
            {selectedProject.secondary_project_manager && (
              <span>Secondary: <span className="text-foreground font-medium">{selectedProject.secondary_project_manager}</span></span>
            )}
            {selectedProject.start_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Start: {new Date(selectedProject.start_date).toLocaleDateString()}
              </span>
            )}
            {selectedProject.deadline && (
              <Badge className={`${getDeadlineInfo(selectedProject.deadline)?.color}`}>
                <Clock className="h-3 w-3 mr-1" />
                {getDeadlineInfo(selectedProject.deadline)?.label}
              </Badge>
            )}
            {selectedProject.demo_date && (
              <span className="flex items-center gap-1">
                <Play className="h-3.5 w-3.5" />
                Demo: {new Date(selectedProject.demo_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Overall Progress */}
          <div>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="font-medium">Overall Progress</span>
              <span className="text-muted-foreground">
                {selectedProject.checklist_items.filter((i) => i.checked).length}/
                {selectedProject.checklist_items.length} phases complete ({progress}%)
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Service Description */}
          {selectedProject.service_description && (
            <div>
              <h4 className="text-sm font-medium mb-1">Service Description</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 rounded-md p-3">
                {selectedProject.service_description}
              </p>
            </div>
          )}

          {/* Checklist / Phases */}
          <div>
            <h4 className="text-sm font-medium mb-3">Project Phases</h4>
            <div className="space-y-2">
              {selectedProject.checklist_items.map((phase) => {
                const isExpanded = expandedPhases.has(phase.id);
                const subtasksDone = phase.subtasks?.filter((s) => s.checked).length || 0;
                const subtasksTotal = phase.subtasks?.length || 0;
                const stageInfo = stageLabelMap[phase.stage || "not_started"] || stageLabelMap.not_started;
                return (
                  <div key={phase.id} className="border border-border/30 rounded-md bg-background/50">
                    <div
                      className="flex items-center gap-2 p-2.5 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => togglePhase(phase.id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      {phase.checked ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                      )}
                      <span className={`text-sm font-medium flex-1 ${phase.checked ? "line-through text-muted-foreground" : ""}`}>
                        {phase.label}
                      </span>
                      <Badge className={`text-[10px] h-5 px-1.5 ${stageInfo.color}`}>
                        {stageInfo.label}
                      </Badge>
                      {subtasksTotal > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {subtasksDone}/{subtasksTotal}
                        </span>
                      )}
                    </div>
                    {isExpanded && phase.subtasks && phase.subtasks.length > 0 && (
                      <div className="border-t border-border/20 px-3 py-2 space-y-1.5 bg-muted/20">
                        {phase.subtasks.map((sub) => {
                          const subStage = stageLabelMap[sub.stage || "not_started"] || stageLabelMap.not_started;
                          return (
                            <div key={sub.id} className="flex items-center gap-2 py-1 px-2">
                              {sub.checked ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                              ) : (
                                <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                              )}
                              <span className={`text-xs flex-1 ${sub.checked ? "line-through text-muted-foreground" : ""}`}>
                                {sub.label}
                              </span>
                              <Badge className={`text-[9px] h-4 px-1 ${subStage.color}`}>
                                {subStage.label}
                              </Badge>
                              {sub.owner && (
                                <span className="text-[10px] text-muted-foreground">{sub.owner}</span>
                              )}
                              {sub.deadline && (
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(sub.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Testing Links */}
          {selectedProject.testing_links && selectedProject.testing_links.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Testing Links</h4>
              <div className="space-y-1.5">
                {selectedProject.testing_links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline bg-muted/30 rounded-md px-3 py-2"
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    {link.label || link.url}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {selectedProject.notes && (
            <div>
              <h4 className="text-sm font-medium mb-1">Notes</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 rounded-md p-3">
                {selectedProject.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <BatelcoLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-red-500 to-orange-500 bg-clip-text text-transparent">
            Projects Overview
          </h1>
          <p className="text-muted-foreground mt-2">
            View your project implementations and demo progress
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v as "demo" | "ongoing" | "completed");
            setSelectedProject(null);
          }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <TabsList>
              <TabsTrigger value="demo" className="gap-2">
                <Play className="h-4 w-4" />
                Demos
                <Badge variant="secondary" className="ml-1">{demoCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="ongoing" className="gap-2">
                <ClipboardCheck className="h-4 w-4" />
                Ongoing
                <Badge variant="secondary" className="ml-1">{ongoingCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="completed" className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Completed
                <Badge variant="secondary" className="ml-1">{completedCount}</Badge>
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial sm:w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
              <Button variant="outline" size="sm" onClick={() => loadData()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          <TabsContent value={activeTab} className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Project List */}
              <Card className="lg:col-span-1 border-2 border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">
                    {activeTab === "demo" && "Demos"}
                    {activeTab === "ongoing" && "Ongoing Projects"}
                    {activeTab === "completed" && "Completed Projects"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[550px]">
                    <div className="space-y-2 p-4">
                      {filteredProjects.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <ClipboardCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">No {activeTab} projects</p>
                        </div>
                      ) : (
                        <>
                          {renderPriorityGroup("High Priority", <Flame className="h-4 w-4 text-red-500" />, priorityConfig.high, grouped.high)}
                          {renderPriorityGroup("Moderate Priority", <AlertTriangle className="h-4 w-4 text-yellow-500" />, priorityConfig.moderate, grouped.moderate)}
                          {renderPriorityGroup("Low Priority", <Minus className="h-4 w-4 text-blue-500" />, priorityConfig.low, grouped.low)}
                        </>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Project Details */}
              {renderProjectDetails()}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </BatelcoLayout>
  );
}
