import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Sparkles, Zap, Code, Lock, Check, Clock, Crown, Image } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface ModelSelectorProps {
  currentModel: string;
  onModelChange: (model: string) => void;
}

interface ModelOption {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  free: boolean;
  badge?: string;
  color: string;
}

const models: ModelOption[] = [
  {
    id: "Qurob 2",
    name: "Qurob 2",
    description: "Classic • 300B+ params",
    icon: Clock,
    free: true,
    badge: "LEGACY",
    color: "text-muted-foreground",
  },
  {
    id: "Qurob 3.2",
    name: "Qurob 3.2",
    description: "Fast & free • 600B+ params",
    icon: Zap,
    free: true,
    badge: "FREE",
    color: "text-muted-foreground",
  },
  {
    id: "Qurob 5",
    name: "Qurob 5",
    description: "Ultimate Agent • ₹1289/mo",
    icon: Crown,
    free: false,
    badge: "ULTIMATE",
    color: "text-yellow-500",
  },
  {
    id: "ArticQuro",
    name: "ArticQuro",
    description: "Image creation only • FLUX schnell",
    icon: Image,
    free: true,
    badge: "IMAGE",
    color: "text-primary",
  },
  {
    id: "Qurob 4",
    name: "Qurob 4",
    description: "Deep reasoning • ₹289/mo",
    icon: Sparkles,
    free: false,
    badge: "PRO",
    color: "text-primary",
  },
  {
    id: "Q-06",
    name: "Q-06",
    description: "Code specialist • ₹320/mo",
    icon: Code,
    free: false,
    badge: "CODE",
    color: "text-accent-foreground",
  },
];

export function ModelSelector({ currentModel, onModelChange }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [subscribedModel, setSubscribedModel] = useState<string>("Qurob 3.2");
  const [isAdmin, setIsAdmin] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      supabase.rpc("get_user_model", { user_id: user.id }).then(({ data }) => {
        setSubscribedModel(data || "Qurob 3.2");
      });
      supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
        setIsAdmin(!!data);
      });
    }
  }, [user]);

  const current = models.find(m => m.id === currentModel) || models[1];
  const CurrentIcon = current.icon;

  const canUseModel = (model: ModelOption): boolean => {
    if (isAdmin) return true; // admin = unlimited everything
    if (model.free) return true;
    return subscribedModel === model.id;
  };

  const handleSelect = (model: ModelOption) => {
    if (!canUseModel(model)) {
      navigate("/subscribe");
      setOpen(false);
      return;
    }
    onModelChange(model.id);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/60 hover:bg-secondary border border-border/40 hover:border-border/60 transition-all text-sm btn-3d touch-manipulation">
          <CurrentIcon className={cn("w-3.5 h-3.5", current.color)} />
          <span className="font-medium text-xs">{current.name}</span>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-1.5" align="end" side="top" sideOffset={8}>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold px-2.5 py-1.5">
          Select Model
        </div>
        {models.map((model) => {
          const Icon = model.icon;
          const isSelected = currentModel === model.id;
          const isLocked = !canUseModel(model);

          return (
            <button
              key={model.id}
              onClick={() => handleSelect(model)}
              className={cn(
                "w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg transition-all text-left",
                isSelected 
                  ? "bg-primary/10 border border-primary/20" 
                  : "hover:bg-muted/60 border border-transparent",
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                isSelected ? "bg-primary/15" : "bg-muted/60"
              )}>
                <Icon className={cn("w-4 h-4", model.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium">{model.name}</span>
                  {model.badge && (
                    <span className={cn(
                      "text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                      model.free 
                        ? "bg-muted text-muted-foreground" 
                        : "bg-primary/10 text-primary"
                    )}>
                      {model.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground">{model.description}</span>
              </div>
              <div className="shrink-0">
                {isSelected ? (
                  <Check className="w-4 h-4 text-primary" />
                ) : isLocked ? (
                  <Lock className="w-3.5 h-3.5 text-muted-foreground/50" />
                ) : null}
              </div>
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
