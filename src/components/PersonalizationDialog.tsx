import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Check, ChevronLeft, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface PersonalizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TONE_OPTIONS = [
  { value: "default", label: "Default", description: "Preset style and tone" },
  { value: "professional", label: "Professional", description: "Polished and precise" },
  { value: "friendly", label: "Friendly", description: "Warm and chatty" },
  { value: "candid", label: "Candid", description: "Direct and encouraging" },
  { value: "quirky", label: "Quirky", description: "Playful and imaginative" },
  { value: "efficient", label: "Efficient", description: "Concise and plain" },
  { value: "nerdy", label: "Nerdy", description: "Exploratory and enthusiastic" },
  { value: "cynical", label: "Cynical", description: "Critical and sarcastic" },
];

export const PersonalizationDialog = ({ open, onOpenChange }: PersonalizationDialogProps) => {
  const { user } = useAuth();
  const [baseTone, setBaseTone] = useState("professional");
  const [customInstructions, setCustomInstructions] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && open) {
      fetchSettings();
    }
  }, [user, open]);

  const fetchSettings = async () => {
    if (!user) return;
    setIsLoading(true);

    const { data, error } = await supabase
      .from("user_settings")
      .select("base_tone, custom_instructions")
      .eq("user_id", user.id)
      .single();

    if (!error && data) {
      setBaseTone(data.base_tone || "professional");
      setCustomInstructions(data.custom_instructions || "");
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    const { error } = await supabase
      .from("user_settings")
      .update({
        base_tone: baseTone,
        custom_instructions: customInstructions || null,
      })
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to save settings");
    } else {
      toast.success("Personalization saved");
      onOpenChange(false);
    }
    setIsSaving(false);
  };

  const selectedTone = TONE_OPTIONS.find(t => t.value === baseTone);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border/50 p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b border-border/30 flex flex-row items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2 rounded-full"
            onClick={() => onOpenChange(false)}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <DialogTitle className="flex-1 text-center pr-10">Personalization</DialogTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Check className="w-5 h-5" />
          </Button>
        </DialogHeader>

        <div className="p-4 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              {/* Base Style and Tone */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="p-4 rounded-xl bg-secondary/50 border border-border/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-sm">Base style and tone</h3>
                      <p className="text-xs text-muted-foreground">{selectedTone?.label}</p>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-2 mb-3">
                    Set the style and tone for how QurobAi responds to you. This doesn't impact QurobAi's ability.
                  </p>

                  <Select value={baseTone} onValueChange={setBaseTone}>
                    <SelectTrigger className="w-full bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TONE_OPTIONS.map((tone) => (
                        <SelectItem key={tone.value} value={tone.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{tone.label}</span>
                            <span className="text-xs text-muted-foreground">{tone.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>

              {/* Custom Instructions */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-3"
              >
                <div className="p-4 rounded-xl bg-secondary/50 border border-border/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <h3 className="font-medium text-sm">Custom instructions</h3>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-3">
                    Add specific instructions that QurobAi will follow in every conversation.
                  </p>

                  <Textarea
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="e.g., Always explain code step by step. Use bullet points for clarity. Prefer TypeScript examples."
                    className="min-h-[150px] bg-background/50 resize-none text-sm"
                    maxLength={2000}
                  />
                  <p className="text-xs text-muted-foreground mt-2 text-right">
                    {customInstructions.length}/2000
                  </p>
                </div>
              </motion.div>

              {/* Save Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Button 
                  className="w-full" 
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </motion.div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};