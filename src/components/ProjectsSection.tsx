import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FolderPlus, Folder, ChevronDown, ChevronRight, 
  MoreHorizontal, Edit2, Trash2, Check, X 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Project {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface ProjectsSectionProps {
  collapsed: boolean;
  selectedProject: string | null;
  onSelectProject: (projectId: string | null) => void;
}

export const ProjectsSection = ({ 
  collapsed, 
  selectedProject, 
  onSelectProject 
}: ProjectsSectionProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    if (user) fetchProjects();
  }, [user]);

  const fetchProjects = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setProjects(data);
    }
  };

  const createProject = async () => {
    if (!user || !newProjectName.trim()) return;

    const { data, error } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        name: newProjectName.trim(),
        color: getRandomColor(),
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: "Failed to create project", variant: "destructive" });
    } else if (data) {
      setProjects([data, ...projects]);
      setNewProjectName("");
      setShowCreateDialog(false);
      toast({ title: "Project created", description: `"${data.name}" created successfully` });
    }
  };

  const updateProject = async (id: string) => {
    if (!editName.trim()) return;

    const { error } = await supabase
      .from("projects")
      .update({ name: editName.trim() })
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: "Failed to update project", variant: "destructive" });
    } else {
      setProjects(projects.map(p => p.id === id ? { ...p, name: editName.trim() } : p));
      setEditingProject(null);
    }
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: "Failed to delete project", variant: "destructive" });
    } else {
      setProjects(projects.filter(p => p.id !== id));
      if (selectedProject === id) onSelectProject(null);
      toast({ title: "Project deleted" });
    }
  };

  const getRandomColor = () => {
    const colors = ["#5a9fd4", "#b8956a", "#6bbf7a", "#d4735a", "#9b6fd4", "#d4b75a"];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  if (collapsed) {
    return (
      <div className="px-3 mb-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowCreateDialog(true)}
          className="w-full h-9"
        >
          <FolderPlus className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="px-3 mb-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full py-2 px-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-sidebar-accent/50"
      >
        {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        <span className="font-medium">Projects</span>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            setShowCreateDialog(true);
          }}
        >
          <FolderPlus className="w-3 h-3" />
        </Button>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <button
              onClick={() => onSelectProject(null)}
              className={`w-full flex items-center gap-2 py-2 px-3 text-sm rounded-lg transition-colors ${
                selectedProject === null 
                  ? "bg-sidebar-accent text-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <Folder className="w-4 h-4" />
              <span>All Chats</span>
            </button>

            {projects.map((project) => (
              <div
                key={project.id}
                className={`group flex items-center gap-2 py-2 px-3 text-sm rounded-lg transition-colors ${
                  selectedProject === project.id 
                    ? "bg-sidebar-accent text-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                {editingProject === project.id ? (
                  <div className="flex items-center gap-1 flex-1">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-6 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") updateProject(project.id);
                        if (e.key === "Escape") setEditingProject(null);
                      }}
                    />
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateProject(project.id)}>
                      <Check className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingProject(null)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => onSelectProject(project.id)}
                      className="flex items-center gap-2 flex-1"
                    >
                      <div 
                        className="w-3 h-3 rounded-sm" 
                        style={{ backgroundColor: project.color }} 
                      />
                      <span className="truncate">{project.name}</span>
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                        >
                          <MoreHorizontal className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setEditingProject(project.id);
                          setEditName(project.name);
                        }}>
                          <Edit2 className="w-3 h-3 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => deleteProject(project.id)}
                        >
                          <Trash2 className="w-3 h-3 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
          </DialogHeader>
          <Input
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="Project name"
            onKeyDown={(e) => e.key === "Enter" && createProject()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createProject} disabled={!newProjectName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};