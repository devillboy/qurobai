import { useState, useEffect } from "react";
import { X, AlertTriangle, Info, CheckCircle, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
}

export function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    loadAnnouncement();
  }, []);

  const loadAnnouncement = async () => {
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      const dismissedIds = JSON.parse(localStorage.getItem("dismissed_announcements") || "[]");
      if (!dismissedIds.includes(data.id)) {
        setAnnouncement(data);
      }
    }
  };

  const dismiss = () => {
    if (announcement) {
      const dismissedIds = JSON.parse(localStorage.getItem("dismissed_announcements") || "[]");
      dismissedIds.push(announcement.id);
      localStorage.setItem("dismissed_announcements", JSON.stringify(dismissedIds));
      setAnnouncement(null);
    }
  };

  if (!announcement) return null;

  const icons = {
    info: Info,
    warning: AlertTriangle,
    success: CheckCircle,
    maintenance: Wrench,
  };

  const colors = {
    info: "bg-primary/10 border-primary/20 text-primary",
    warning: "bg-warning/10 border-warning/20 text-warning",
    success: "bg-success/10 border-success/20 text-success",
    maintenance: "bg-muted border-border text-muted-foreground",
  };

  const Icon = icons[announcement.type as keyof typeof icons] || Info;
  const colorClass = colors[announcement.type as keyof typeof colors] || colors.info;

  return (
    <div className={cn("border-b px-4 py-2 flex items-center gap-3", colorClass)}>
      <Icon className="w-4 h-4 shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="font-medium text-sm">{announcement.title}</span>
        <span className="text-sm opacity-80 ml-2">{announcement.message}</span>
      </div>
      <button onClick={dismiss} className="shrink-0 p-1 hover:opacity-70">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
