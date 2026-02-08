import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface QurobBot {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  icon_color: string;
  system_prompt: string;
  is_public: boolean;
  is_official: boolean;
  category: string;
  uses_count: number;
  user_id: string;
}

interface QurobBotBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editBot: QurobBot | null;
  onSaved: () => void;
}

const ICONS = [
  { value: "sparkles", label: "✨ Sparkles" },
  { value: "code", label: "💻 Code" },
  { value: "book-open", label: "📖 Book" },
  { value: "lightbulb", label: "💡 Idea" },
  { value: "graduation-cap", label: "🎓 Learn" },
  { value: "pen", label: "✍️ Write" },
  { value: "briefcase", label: "💼 Business" },
];

const COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444", "#14b8a6"];

const CATEGORIES = ["general", "coding", "writing", "learning", "creative", "business", "research"];

export function QurobBotBuilder({ open, onOpenChange, editBot, onSaved }: QurobBotBuilderProps) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [icon, setIcon] = useState("sparkles");
  const [iconColor, setIconColor] = useState("#6366f1");
  const [category, setCategory] = useState("general");
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editBot) {
      setName(editBot.name);
      setDescription(editBot.description || "");
      setSystemPrompt(editBot.system_prompt);
      setIcon(editBot.icon);
      setIconColor(editBot.icon_color);
      setCategory(editBot.category);
      setIsPublic(editBot.is_public);
    } else {
      setName(""); setDescription(""); setSystemPrompt(""); setIcon("sparkles");
      setIconColor("#6366f1"); setCategory("general"); setIsPublic(false);
    }
  }, [editBot, open]);

  const handleSave = async () => {
    if (!user || !name.trim() || !systemPrompt.trim()) {
      toast.error("Name and system prompt are required");
      return;
    }
    setSaving(true);

    const botData = {
      name: name.trim(),
      description: description.trim() || null,
      system_prompt: systemPrompt.trim(),
      icon, icon_color: iconColor, category,
      is_public: isPublic,
      user_id: user.id,
    };

    if (editBot) {
      const { error } = await supabase.from("qurob_bots").update(botData).eq("id", editBot.id);
      if (error) { toast.error("Failed to update Qurob"); setSaving(false); return; }
      toast.success("Qurob updated!");
    } else {
      const { error } = await supabase.from("qurob_bots").insert(botData);
      if (error) { toast.error("Failed to create Qurob"); setSaving(false); return; }
      toast.success("Qurob created!");
    }

    setSaving(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editBot ? "Edit Qurob" : "Create a Qurob"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input placeholder="e.g. Code Reviewer" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div>
            <Label>Description</Label>
            <Input placeholder="What does this Qurob do?" value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div>
            <Label>System Prompt</Label>
            <Textarea placeholder="You are an expert at..." value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} className="min-h-[120px]" />
            <p className="text-xs text-muted-foreground mt-1">This tells the AI how to behave. Be specific!</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Icon</Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ICONS.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Color</Label>
            <div className="flex gap-2 mt-1">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setIconColor(c)}
                  className={`w-7 h-7 rounded-full transition-all ${iconColor === c ? "ring-2 ring-offset-2 ring-primary" : ""}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Public</Label>
              <p className="text-xs text-muted-foreground">Others can use this Qurob</p>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>

          <Button onClick={handleSave} disabled={saving || !name.trim() || !systemPrompt.trim()} className="w-full">
            {saving ? "Saving..." : editBot ? "Update Qurob" : "Create Qurob"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
