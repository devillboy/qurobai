import { useState, useEffect, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  MessageSquarePlus,
  Settings,
  Sparkles,
  Shield,
  Code,
  Search,
  Moon,
  LogOut,
  CreditCard,
  Bell,
  HelpCircle,
  Keyboard,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNewChat?: () => void;
  onOpenSettings?: () => void;
  onToggleSidebar?: () => void;
}

export const CommandPalette = memo(({
  open,
  onOpenChange,
  onNewChat,
  onOpenSettings,
  onToggleSidebar,
}: CommandPaletteProps) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      checkAdmin();
    }
  }, [user]);

  const checkAdmin = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    setIsAdmin(!!data);
  };

  const runCommand = useCallback(
    (command: () => void) => {
      onOpenChange(false);
      command();
    },
    [onOpenChange]
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <Command className="rounded-lg border shadow-md">
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => runCommand(() => onNewChat?.())}>
              <MessageSquarePlus className="mr-2 h-4 w-4" />
              <span>New Chat</span>
              <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span className="text-xs">⌘</span>N
              </kbd>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => onToggleSidebar?.())}>
              <Search className="mr-2 h-4 w-4" />
              <span>Toggle Sidebar</span>
              <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span className="text-xs">⌘</span>/
              </kbd>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => onOpenSettings?.())}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
              <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span className="text-xs">⌘</span>,
              </kbd>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => runCommand(() => navigate("/subscribe"))}>
              <Sparkles className="mr-2 h-4 w-4 text-primary" />
              <span>Upgrade to Premium</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/api-access"))}>
              <Code className="mr-2 h-4 w-4" />
              <span>API Access</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/subscription-history"))}>
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Subscription History</span>
            </CommandItem>
            {isAdmin && (
              <CommandItem onSelect={() => runCommand(() => navigate("/admin"))}>
                <Shield className="mr-2 h-4 w-4 text-amber-500" />
                <span>Admin Panel</span>
              </CommandItem>
            )}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Help">
            <CommandItem onSelect={() => runCommand(() => {})}>
              <Keyboard className="mr-2 h-4 w-4" />
              <span>Keyboard Shortcuts</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/privacy"))}>
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Privacy Policy</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/security"))}>
              <Shield className="mr-2 h-4 w-4" />
              <span>Security</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Account">
            <CommandItem
              onSelect={() => runCommand(signOut)}
              className="text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
});

CommandPalette.displayName = "CommandPalette";
