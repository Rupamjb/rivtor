import { motion } from "framer-motion";
import {
  Activity,
  Bot,
  Brain,
  ChevronLeft,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Plus,
  Settings,
  Sparkles,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { WorkflowHistoryItem } from "@/types/founderos-dashboard";


const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "knowledge", label: "Knowledge", icon: Brain },
  { id: "agents", label: "Agents", icon: Bot },
  { id: "outputs", label: "Outputs", icon: Sparkles },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "settings", label: "Settings", icon: Settings },
];

function SidebarBody({
  collapsed,
  onCollapse,
  onNewWorkflow,
  workflows,
  activeNav,
  onSelectNav,
  activeWorkflowId,
  onOpenWorkflow,
  userEmail,
  onSignOut,
}: {
  collapsed: boolean;
  onCollapse: () => void;
  onNewWorkflow: () => void;
  workflows: WorkflowHistoryItem[];
  activeNav: string;
  onSelectNav: (id: string) => void;
  activeWorkflowId: string;
  onOpenWorkflow: (id: string) => void;
  userEmail: string;
  onSignOut: () => Promise<void>;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-3 py-3">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900">
              <Sparkles className="h-4 w-4" />
            </span>
            {!collapsed ? <span className="text-sm font-semibold tracking-tight text-zinc-100">FounderOS</span> : null}
          </div>
          <Button size="icon" variant="ghost" className="hidden lg:inline-flex" onClick={onCollapse}>
            <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </Button>
        </div>

        <Button className="mt-3 w-full justify-start gap-2" onClick={onNewWorkflow}>
          <Plus className="h-4 w-4" /> {!collapsed ? "New Workflow" : ""}
        </Button>
      </div>

      <nav className="space-y-1 px-2 py-3">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => onSelectNav(item.id)}
              className={`group flex w-full items-center justify-between rounded-xl border px-2.5 py-2 text-sm transition ${
                activeNav === item.id
                  ? "border-white/20 bg-white/[0.06] text-zinc-100"
                  : "border-transparent text-zinc-300 hover:border-white/10 hover:bg-white/[0.03] hover:text-zinc-100"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {!collapsed ? item.label : null}
              </span>
              {!collapsed ? <MoreHorizontal className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" /> : null}
            </motion.button>
          );
        })}
      </nav>

      <div className="px-2">
        {!collapsed ? <p className="px-2 pb-1 text-[11px] uppercase tracking-[0.08em] text-zinc-500">Recent Workflows</p> : null}
        <div className="space-y-1">
          {workflows.map((item) => (
            <button
              key={item.id}
              onClick={() => onOpenWorkflow(item.id)}
              className={`group flex w-full items-center justify-between rounded-xl border px-2.5 py-2 text-left text-xs transition ${
                activeWorkflowId === item.id
                  ? "border-white/20 bg-white/[0.06] text-zinc-200"
                  : "border-transparent text-zinc-400 hover:border-white/10 hover:bg-white/[0.03] hover:text-zinc-200"
              }`}
            >
              <span className="line-clamp-1">{collapsed ? "Workflow" : item.title}</span>
              {!collapsed ? <span className="text-[10px] text-zinc-500">{item.timestamp}</span> : null}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto border-t border-white/10 p-3">
        <div className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2 text-left text-xs text-zinc-300">
          <Avatar className="h-7 w-7">
            <AvatarFallback>{userEmail.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          {!collapsed ? (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] text-zinc-200">{userEmail}</p>
              <p className="text-[10px] text-zinc-500">Founder Workspace</p>
            </div>
          ) : null}
          {!collapsed ? <Settings className="h-3.5 w-3.5 text-zinc-500" /> : null}
        </div>
        {!collapsed ? (
          <Button size="sm" variant="outline" className="mt-2 w-full justify-start border-white/10 bg-white/[0.02] text-xs" onClick={() => void onSignOut()}>
            <LogOut className="mr-1 h-3.5 w-3.5" /> Sign out
          </Button>
        ) : (
          <Button
            size="icon"
            variant="outline"
            aria-label="Quick sign out"
            className="mt-2 w-full border-white/10 bg-white/[0.02]"
            onClick={() => void onSignOut()}
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function FounderosSidebar({
  collapsed,
  mobileOpen,
  onMobileOpen,
  onCollapse,
  onNewWorkflow,
  workflows,
  activeNav,
  onSelectNav,
  activeWorkflowId,
  onOpenWorkflow,
  userEmail,
  onSignOut,
}: {
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileOpen: (value: boolean) => void;
  onCollapse: () => void;
  onNewWorkflow: () => void;
  workflows: WorkflowHistoryItem[];
  activeNav: string;
  onSelectNav: (id: string) => void;
  activeWorkflowId: string;
  onOpenWorkflow: (id: string) => void;
  userEmail: string;
  onSignOut: () => Promise<void>;
}) {
  return (
    <>
      <motion.aside
        animate={{ width: collapsed ? 92 : 260 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="hidden h-full shrink-0 border-r border-white/10 bg-[radial-gradient(circle_at_top,#1b1d28_0%,#12141d_48%,#0b0d12_100%)] lg:block"
      >
        <SidebarBody
          collapsed={collapsed}
          onCollapse={onCollapse}
          onNewWorkflow={onNewWorkflow}
          workflows={workflows}
          activeNav={activeNav}
          onSelectNav={onSelectNav}
          activeWorkflowId={activeWorkflowId}
          onOpenWorkflow={onOpenWorkflow}
          userEmail={userEmail}
          onSignOut={onSignOut}
        />
      </motion.aside>

      <Sheet open={mobileOpen} onOpenChange={onMobileOpen}>
        <SheetContent side="left" className="w-[86vw] max-w-[320px] border-white/10 bg-[#0f1117] p-0">
          <SidebarBody
            collapsed={false}
            onCollapse={onCollapse}
            onNewWorkflow={onNewWorkflow}
            workflows={workflows}
            activeNav={activeNav}
            onSelectNav={onSelectNav}
            activeWorkflowId={activeWorkflowId}
            onOpenWorkflow={onOpenWorkflow}
            userEmail={userEmail}
            onSignOut={onSignOut}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
