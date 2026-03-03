import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  GanttChart as GanttIcon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Play,
  Minus,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Types (mirror ProjectManager's types) ───────────────────────────────────

type Priority = "high" | "moderate" | "low";
type ProjectStatus = "ongoing" | "completed" | "demo";
type TaskStage =
  | "not_started"
  | "in_progress"
  | "client_review"
  | "internal_revision"
  | "blocked"
  | "done";

interface SubTask {
  id: string;
  label: string;
  checked: boolean;
  deadline?: string;
  stage?: TaskStage;
  owner?: string;
}

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  subtasks?: SubTask[];
  deadline?: string;
  stage?: TaskStage;
  owner?: string;
}

export interface GanttProject {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_logo?: string;
  project_manager: string;
  secondary_project_manager?: string;
  service_description: string;
  checklist_items: ChecklistItem[];
  notes: string;
  status: ProjectStatus;
  priority: Priority;
  start_date?: string;
  deadline?: string;
  demo_date?: string;
  demo_delivered?: boolean;
  created_at: string;
  completed_at?: string;
}

interface GanttRow {
  id: string;
  label: string;
  type: "project" | "task" | "subtask";
  projectId: string;
  status: ProjectStatus;
  taskStage?: TaskStage;
  priority: Priority;
  owner?: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  children?: GanttRow[];
  depth: number;
}

type ViewMode = "gantt" | "blocks";
type TimeScale = "day" | "week" | "month";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DAY_MS = 86_400_000;

const parseDate = (d?: string): Date | null => {
  if (!d) return null;
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
};

const daysBetween = (a: Date, b: Date) =>
  Math.round((b.getTime() - a.getTime()) / DAY_MS);

const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY_MS);

const startOfDay = (d: Date) => {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
};

const startOfWeek = (d: Date) => {
  const r = startOfDay(d);
  r.setDate(r.getDate() - r.getDay());
  return r;
};

const formatDateShort = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

const stageToProgress = (stage?: TaskStage, checked?: boolean): number => {
  if (checked) return 1;
  switch (stage) {
    case "done":
      return 1;
    case "in_progress":
    case "client_review":
    case "internal_revision":
      return 0.5;
    case "blocked":
      return 0.25;
    default:
      return 0;
  }
};

const STAGE_COLORS: Record<string, string> = {
  not_started: "bg-gray-400",
  in_progress: "bg-blue-500",
  client_review: "bg-purple-500",
  internal_revision: "bg-amber-500",
  blocked: "bg-red-500",
  done: "bg-green-500",
};

const STATUS_COLORS: Record<ProjectStatus, string> = {
  demo: "bg-violet-500",
  ongoing: "bg-blue-500",
  completed: "bg-green-500",
};

const PRIORITY_COLORS: Record<Priority, string> = {
  high: "text-red-500",
  moderate: "text-amber-500",
  low: "text-green-500",
};

const STAGE_LABELS: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  client_review: "Client Review",
  internal_revision: "Revision",
  blocked: "Blocked",
  done: "Done",
};

// ─── Build flat rows from projects ───────────────────────────────────────────

function buildGanttRows(projects: GanttProject[]): GanttRow[] {
  const rows: GanttRow[] = [];
  const now = startOfDay(new Date());

  for (const p of projects) {
    const pStart = parseDate(p.start_date) ?? parseDate(p.created_at) ?? now;
    const pEnd =
      parseDate(p.deadline) ??
      parseDate(p.demo_date) ??
      parseDate(p.completed_at) ??
      addDays(pStart, 30);

    const taskRows: GanttRow[] = [];
    let totalProgress = 0;
    let taskCount = 0;

    for (const task of p.checklist_items) {
      const tStart = parseDate(task.deadline)
        ? addDays(parseDate(task.deadline)!, -7)
        : pStart;
      const tEnd = parseDate(task.deadline) ?? pEnd;

      const subtaskRows: GanttRow[] = [];
      let subProgress = 0;
      let subCount = 0;

      for (const sub of task.subtasks ?? []) {
        const sStart = parseDate(sub.deadline)
          ? addDays(parseDate(sub.deadline)!, -3)
          : tStart;
        const sEnd = parseDate(sub.deadline) ?? tEnd;
        const prog = stageToProgress(sub.stage, sub.checked);
        subProgress += prog;
        subCount++;

        subtaskRows.push({
          id: sub.id,
          label: sub.label,
          type: "subtask",
          projectId: p.id,
          status: p.status,
          taskStage: sub.stage ?? "not_started",
          priority: p.priority,
          owner: sub.owner,
          startDate: startOfDay(sStart),
          endDate: startOfDay(sEnd),
          progress: prog,
          depth: 2,
        });
      }

      const taskProgress =
        subCount > 0
          ? subProgress / subCount
          : stageToProgress(task.stage, task.checked);
      totalProgress += taskProgress;
      taskCount++;

      taskRows.push({
        id: task.id,
        label: task.label,
        type: "task",
        projectId: p.id,
        status: p.status,
        taskStage: task.stage ?? "not_started",
        priority: p.priority,
        owner: task.owner,
        startDate: startOfDay(tStart),
        endDate: startOfDay(tEnd),
        progress: taskProgress,
        children: subtaskRows,
        depth: 1,
      });
    }

    const projectProgress =
      taskCount > 0 ? totalProgress / taskCount : p.status === "completed" ? 1 : 0;

    rows.push({
      id: p.id,
      label: p.customer_name,
      type: "project",
      projectId: p.id,
      status: p.status,
      priority: p.priority,
      owner: p.project_manager,
      startDate: startOfDay(pStart),
      endDate: startOfDay(pEnd),
      progress: projectProgress,
      children: taskRows,
      depth: 0,
    });
  }

  return rows;
}

// ─── GanttTimeline ───────────────────────────────────────────────────────────

const COL_W_DAY = 36;
const COL_W_WEEK = 120;
const COL_W_MONTH = 180;
const ROW_H = 36;
const LABEL_W = 280;

function GanttTimeline({
  rows,
  expanded,
  toggleExpand,
  timeScale,
}: {
  rows: GanttRow[];
  expanded: Set<string>;
  toggleExpand: (id: string) => void;
  timeScale: TimeScale;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const flatRows = useMemo(() => {
    const result: GanttRow[] = [];
    const walk = (items: GanttRow[]) => {
      for (const r of items) {
        result.push(r);
        if (r.children && expanded.has(r.id)) walk(r.children);
      }
    };
    walk(rows);
    return result;
  }, [rows, expanded]);

  const { rangeStart, rangeEnd, colWidth, columns } = useMemo(() => {
    if (flatRows.length === 0) {
      const now = startOfDay(new Date());
      return {
        rangeStart: now,
        rangeEnd: addDays(now, 30),
        colWidth: COL_W_DAY,
        columns: [] as { label: string; subLabel?: string; date: Date }[],
      };
    }

    let minD = flatRows[0].startDate;
    let maxD = flatRows[0].endDate;
    for (const r of flatRows) {
      if (r.startDate < minD) minD = r.startDate;
      if (r.endDate > maxD) maxD = r.endDate;
    }

    const padStart = addDays(startOfWeek(minD), -7);
    const padEnd = addDays(maxD, 14);

    const cols: { label: string; subLabel?: string; date: Date }[] = [];
    let cw: number;

    if (timeScale === "day") {
      cw = COL_W_DAY;
      let d = padStart;
      while (d <= padEnd) {
        cols.push({
          label: d.getDate().toString(),
          subLabel:
            d.getDay() === 0
              ? d.toLocaleDateString("en-US", { month: "short" })
              : undefined,
          date: new Date(d),
        });
        d = addDays(d, 1);
      }
    } else if (timeScale === "week") {
      cw = COL_W_WEEK;
      let d = startOfWeek(padStart);
      while (d <= padEnd) {
        const end = addDays(d, 6);
        cols.push({
          label: `${formatDateShort(d)} – ${formatDateShort(end)}`,
          date: new Date(d),
        });
        d = addDays(d, 7);
      }
    } else {
      cw = COL_W_MONTH;
      let d = new Date(padStart.getFullYear(), padStart.getMonth(), 1);
      while (d <= padEnd) {
        cols.push({
          label: d.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
          date: new Date(d),
        });
        d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      }
    }

    return { rangeStart: padStart, rangeEnd: padEnd, colWidth: cw, columns: cols };
  }, [flatRows, timeScale]);

  const totalDays = Math.max(daysBetween(rangeStart, rangeEnd), 1);
  const chartWidth = columns.length * colWidth;

  const getX = (d: Date) => {
    const days = daysBetween(rangeStart, d);
    return (days / totalDays) * chartWidth;
  };

  useEffect(() => {
    if (scrollRef.current) {
      const todayX = getX(startOfDay(new Date()));
      scrollRef.current.scrollLeft = Math.max(0, todayX - 300);
    }
  }, [columns.length]);

  const onBodyScroll = () => {
    if (headerRef.current && scrollRef.current) {
      headerRef.current.scrollLeft = scrollRef.current.scrollLeft;
    }
  };

  const todayX = getX(startOfDay(new Date()));

  return (
    <div className="flex flex-col border rounded-lg overflow-hidden bg-card">
      {/* Header */}
      <div className="flex border-b bg-muted/30">
        <div
          className="shrink-0 border-r px-3 py-2 font-medium text-xs text-muted-foreground uppercase tracking-wider flex items-center"
          style={{ width: LABEL_W, minWidth: LABEL_W }}
        >
          Project / Task
        </div>
        <div ref={headerRef} className="overflow-hidden flex-1">
          <div className="flex" style={{ width: chartWidth }}>
            {columns.map((col, i) => (
              <div
                key={i}
                className="shrink-0 border-r border-border/40 px-1 py-2 text-center"
                style={{ width: colWidth }}
              >
                {col.subLabel && (
                  <div className="text-[10px] text-muted-foreground leading-none mb-0.5">
                    {col.subLabel}
                  </div>
                )}
                <div className="text-[11px] font-medium">{col.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Labels */}
        <div
          className="shrink-0 border-r overflow-y-auto"
          style={{ width: LABEL_W, minWidth: LABEL_W }}
        >
          {flatRows.map((row) => (
            <div
              key={row.id}
              className={`flex items-center gap-1.5 px-2 border-b border-border/30 hover:bg-accent/30 transition-colors ${
                row.type === "project" ? "font-medium" : ""
              }`}
              style={{ height: ROW_H, paddingLeft: 8 + row.depth * 16 }}
            >
              {row.children && row.children.length > 0 ? (
                <button
                  onClick={() => toggleExpand(row.id)}
                  className="p-0.5 rounded hover:bg-accent"
                >
                  {expanded.has(row.id) ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </button>
              ) : (
                <span className="w-4" />
              )}

              {row.type === "project" ? (
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${STATUS_COLORS[row.status]}`}
                />
              ) : (
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    STAGE_COLORS[row.taskStage ?? "not_started"]
                  }`}
                />
              )}

              <span className="truncate text-xs" title={row.label}>
                {row.label}
              </span>

              {row.owner && (
                <span
                  className="ml-auto text-[10px] text-muted-foreground truncate max-w-[60px]"
                  title={row.owner}
                >
                  {row.owner.split(" ").pop()}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Chart */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-auto"
          onScroll={onBodyScroll}
        >
          <div
            className="relative"
            style={{ width: chartWidth, height: flatRows.length * ROW_H }}
          >
            {columns.map((_, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 border-r border-border/20"
                style={{ left: i * colWidth, width: colWidth }}
              />
            ))}

            {/* Today line */}
            <div
              className="absolute top-0 bottom-0 w-px bg-red-500/70 z-10"
              style={{ left: todayX }}
            />
            <div
              className="absolute top-0 z-10 bg-red-500 text-white text-[9px] px-1 rounded-b"
              style={{ left: todayX - 14 }}
            >
              Today
            </div>

            {/* Weekend shading */}
            {timeScale === "day" &&
              columns.map((col, i) => {
                const dow = col.date.getDay();
                if (dow === 0 || dow === 6) {
                  return (
                    <div
                      key={`we-${i}`}
                      className="absolute top-0 bottom-0 bg-muted/30"
                      style={{ left: i * colWidth, width: colWidth }}
                    />
                  );
                }
                return null;
              })}

            {/* Bars */}
            {flatRows.map((row, rowIdx) => {
              const barLeft = getX(row.startDate);
              const barRight = getX(row.endDate);
              const barWidth = Math.max(barRight - barLeft, 4);
              const barTop = rowIdx * ROW_H + 8;
              const barHeight = ROW_H - 16;
              const barColor =
                row.type === "project"
                  ? STATUS_COLORS[row.status]
                  : STAGE_COLORS[row.taskStage ?? "not_started"];
              const isOverdue =
                row.endDate < startOfDay(new Date()) && row.progress < 1;

              return (
                <div key={row.id}>
                  <div
                    className={`absolute rounded-sm ${
                      row.type === "project" ? "opacity-30" : "opacity-20"
                    } ${barColor}`}
                    style={{
                      left: barLeft,
                      top: barTop,
                      width: barWidth,
                      height: barHeight,
                    }}
                  />
                  <div
                    className={`absolute rounded-sm ${barColor} ${
                      isOverdue ? "opacity-90" : "opacity-80"
                    }`}
                    style={{
                      left: barLeft,
                      top: barTop,
                      width: barWidth * row.progress,
                      height: barHeight,
                    }}
                  />
                  {isOverdue && (
                    <div
                      className="absolute rounded-sm bg-red-500/30 border border-red-500/50"
                      style={{
                        left: barLeft,
                        top: barTop,
                        width: barWidth,
                        height: barHeight,
                      }}
                    />
                  )}
                  {row.type === "project" && barWidth > 60 && (
                    <div
                      className="absolute text-[10px] font-medium text-white truncate px-1 pointer-events-none"
                      style={{
                        left: barLeft + 4,
                        top: barTop,
                        width: barWidth - 8,
                        height: barHeight,
                        lineHeight: `${barHeight}px`,
                      }}
                    >
                      {row.label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── BlockView ───────────────────────────────────────────────────────────────

function BlockView({
  rows,
  expanded,
  toggleExpand,
}: {
  rows: GanttRow[];
  expanded: Set<string>;
  toggleExpand: (id: string) => void;
}) {
  const now = startOfDay(new Date());

  const flatRows = useMemo(() => {
    const result: GanttRow[] = [];
    const walk = (items: GanttRow[]) => {
      for (const r of items) {
        result.push(r);
        if (r.children && expanded.has(r.id)) walk(r.children);
      }
    };
    walk(rows);
    return result;
  }, [rows, expanded]);

  const getDeadlineColor = (endDate: Date, progress: number) => {
    if (progress >= 1) return "text-green-500";
    const diff = daysBetween(now, endDate);
    if (diff < 0) return "text-red-500";
    if (diff <= 3) return "text-red-500";
    if (diff <= 7) return "text-orange-500";
    if (diff <= 14) return "text-yellow-500";
    return "text-muted-foreground";
  };

  const getDeadlineLabel = (endDate: Date, progress: number) => {
    if (progress >= 1) return "Complete";
    const diff = daysBetween(now, endDate);
    if (diff < 0) return `${Math.abs(diff)}d overdue`;
    if (diff === 0) return "Due today";
    return `${diff}d left`;
  };

  const StageIcon = ({ stage }: { stage?: TaskStage }) => {
    switch (stage) {
      case "done":
        return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
      case "in_progress":
        return <Play className="h-3.5 w-3.5 text-blue-500" />;
      case "client_review":
        return <Clock className="h-3.5 w-3.5 text-purple-500" />;
      case "internal_revision":
        return <RefreshCw className="h-3.5 w-3.5 text-amber-500" />;
      case "blocked":
        return <AlertTriangle className="h-3.5 w-3.5 text-red-500" />;
      default:
        return <Minus className="h-3.5 w-3.5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-1">
      {flatRows.map((row) => {
        const isProject = row.type === "project";
        const hasChildren = row.children && row.children.length > 0;
        const deadlineColor = getDeadlineColor(row.endDate, row.progress);
        const deadlineLabel = getDeadlineLabel(row.endDate, row.progress);
        const progressPct = Math.round(row.progress * 100);

        return (
          <div
            key={row.id}
            className={`rounded-lg border transition-colors ${
              isProject
                ? "bg-card border-border shadow-sm"
                : row.type === "task"
                ? "bg-muted/30 border-border/50"
                : "bg-muted/10 border-border/30"
            }`}
            style={{ marginLeft: row.depth * 20 }}
          >
            <div className="flex items-center gap-2 px-3 py-2">
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(row.id)}
                  className="p-0.5 rounded hover:bg-accent shrink-0"
                >
                  {expanded.has(row.id) ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </button>
              ) : (
                <span className="w-5 shrink-0" />
              )}

              {isProject ? (
                <div
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_COLORS[row.status]}`}
                />
              ) : (
                <StageIcon stage={row.taskStage} />
              )}

              <span
                className={`truncate ${isProject ? "font-medium text-sm" : "text-sm"}`}
                title={row.label}
              >
                {row.label}
              </span>

              {isProject && (
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 h-4 shrink-0 ${PRIORITY_COLORS[row.priority]}`}
                >
                  {row.priority}
                </Badge>
              )}

              {!isProject && row.taskStage && (
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {STAGE_LABELS[row.taskStage] ?? row.taskStage}
                </span>
              )}

              <div className="flex-1" />

              {row.owner && (
                <span
                  className="text-[11px] text-muted-foreground shrink-0 max-w-[80px] truncate"
                  title={row.owner}
                >
                  {row.owner.split(" ").pop()}
                </span>
              )}

              <span className="text-[11px] text-muted-foreground shrink-0 hidden sm:inline">
                {formatDateShort(row.startDate)} – {formatDateShort(row.endDate)}
              </span>

              <span className={`text-[11px] font-medium shrink-0 ${deadlineColor}`}>
                {deadlineLabel}
              </span>

              <div className="flex items-center gap-1.5 shrink-0" style={{ width: 80 }}>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      progressPct >= 100
                        ? "bg-green-500"
                        : progressPct > 0
                        ? "bg-blue-500"
                        : "bg-gray-400"
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground w-7 text-right">
                  {progressPct}%
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Embeddable Component ───────────────────────────────────────────────

interface GanttChartViewProps {
  projects: GanttProject[];
  loading: boolean;
  onRefresh?: () => void;
}

export function GanttChartView({ projects, loading, onRefresh }: GanttChartViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("gantt");
  const [timeScale, setTimeScale] = useState<TimeScale>("week");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<"all" | ProjectStatus>("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [showCompleted, setShowCompleted] = useState(false);
  const [hasAutoExpanded, setHasAutoExpanded] = useState(false);

  // Auto-expand projects on first data load
  useEffect(() => {
    if (!hasAutoExpanded && projects.length > 0) {
      setExpanded(new Set(projects.map((p) => p.id)));
      setHasAutoExpanded(true);
    }
  }, [projects, hasAutoExpanded]);

  const assignees = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p.project_manager) set.add(p.project_manager);
      if (p.secondary_project_manager) set.add(p.secondary_project_manager);
    });
    return Array.from(set).sort();
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (!showCompleted && p.status === "completed") return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (
        assigneeFilter !== "all" &&
        p.project_manager !== assigneeFilter &&
        p.secondary_project_manager !== assigneeFilter
      )
        return false;
      return true;
    });
  }, [projects, statusFilter, assigneeFilter, showCompleted]);

  const ganttRows = useMemo(() => buildGanttRows(filteredProjects), [filteredProjects]);

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = () => {
    const allIds = new Set<string>();
    const walk = (rows: GanttRow[]) => {
      for (const r of rows) {
        if (r.children?.length) {
          allIds.add(r.id);
          walk(r.children);
        }
      }
    };
    walk(ganttRows);
    setExpanded(allIds);
  };

  const collapseAll = () => setExpanded(new Set());

  const stats = useMemo(() => {
    const demos = filteredProjects.filter((p) => p.status === "demo").length;
    const ongoing = filteredProjects.filter((p) => p.status === "ongoing").length;
    const completed = filteredProjects.filter((p) => p.status === "completed").length;
    const overdue = filteredProjects.filter((p) => {
      const dl = parseDate(p.deadline) ?? parseDate(p.demo_date);
      return dl && dl < new Date() && p.status !== "completed";
    }).length;
    return { demos, ongoing, completed, overdue, total: filteredProjects.length };
  }, [filteredProjects]);

  const activeFilterCount =
    (statusFilter !== "all" ? 1 : 0) +
    (assigneeFilter !== "all" ? 1 : 0) +
    (showCompleted ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {stats.total} project{stats.total !== 1 ? "s" : ""} on timeline
          {stats.overdue > 0 && (
            <span className="text-red-500 ml-1">({stats.overdue} overdue)</span>
          )}
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          <Tabs
            value={viewMode}
            onValueChange={(v) => setViewMode(v as ViewMode)}
            className="h-9"
          >
            <TabsList className="h-9">
              <TabsTrigger value="gantt" className="gap-1.5 text-xs h-7">
                <GanttIcon className="h-3.5 w-3.5" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="blocks" className="gap-1.5 text-xs h-7">
                <LayoutGrid className="h-3.5 w-3.5" />
                Blocks
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {viewMode === "gantt" && (
            <Select
              value={timeScale}
              onValueChange={(v) => setTimeScale(v as TimeScale)}
            >
              <SelectTrigger className="w-[100px] h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Filter className="h-3.5 w-3.5" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 space-y-3" align="end">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Filters</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => {
                    setStatusFilter("all");
                    setAssigneeFilter("all");
                    setShowCompleted(false);
                  }}
                >
                  Clear
                </Button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Project Type</label>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as any)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="demo">Demos</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Assignee</label>
                <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Assignees</SelectItem>
                    {assignees.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCompleted}
                  onChange={(e) => setShowCompleted(e.target.checked)}
                  className="rounded border-border"
                />
                Show completed projects
              </label>
            </PopoverContent>
          </Popover>

          <Button variant="outline" size="sm" onClick={expandAll} title="Expand all">
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll} title="Collapse all">
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>

          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          )}
        </div>
      </div>

      {/* Summary badges */}
      <div className="flex gap-2 flex-wrap">
        <Badge
          variant={statusFilter === "demo" ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setStatusFilter(statusFilter === "demo" ? "all" : "demo")}
        >
          <Play className="h-3 w-3 mr-1" />
          {stats.demos} Demos
        </Badge>
        <Badge
          variant={statusFilter === "ongoing" ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() =>
            setStatusFilter(statusFilter === "ongoing" ? "all" : "ongoing")
          }
        >
          <Clock className="h-3 w-3 mr-1" />
          {stats.ongoing} Ongoing
        </Badge>
        {showCompleted && (
          <Badge
            variant={statusFilter === "completed" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() =>
              setStatusFilter(statusFilter === "completed" ? "all" : "completed")
            }
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {stats.completed} Completed
          </Badge>
        )}
        {stats.overdue > 0 && (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {stats.overdue} Overdue
          </Badge>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
        </div>
      ) : ganttRows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <GanttIcon className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-lg font-medium">No projects to display</p>
          <p className="text-sm mt-1">
            Adjust your filters or add projects in the other tabs.
          </p>
        </div>
      ) : viewMode === "gantt" ? (
        <div style={{ height: "calc(100vh - 340px)" }}>
          <GanttTimeline
            rows={ganttRows}
            expanded={expanded}
            toggleExpand={toggleExpand}
            timeScale={timeScale}
          />
        </div>
      ) : (
        <ScrollArea style={{ height: "calc(100vh - 340px)" }}>
          <BlockView
            rows={ganttRows}
            expanded={expanded}
            toggleExpand={toggleExpand}
          />
        </ScrollArea>
      )}
    </div>
  );
}
