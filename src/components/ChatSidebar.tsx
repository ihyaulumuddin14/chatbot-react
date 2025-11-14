import { useLiveQuery } from "dexie-react-hooks";
import { Moon, MoreHorizontalIcon, Plus, Sun } from "lucide-react";
import { useLayoutEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "~/components/ui/button";
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  Sidebar as SidebarPrimitive,
} from "~/components/ui/sidebar";
import { useTheme } from "./ThemeProvider";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { db } from "~/lib/dexie";
import { toast } from "sonner";

export const ChatSidebar = () => {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [dialogIsOpen, setDialogIsOpen] = useState(false);
  const [threadTitle, setThreadTitle] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [renameId, setRenameId] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const { setTheme, theme } = useTheme();
  const navigate = useNavigate();

  const threads = useLiveQuery(() => {
    return db.getAllThreads();
  }, [])

  const location = useLocation();

  const handleToggleTheme = () => {
    if (theme === "dark") {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  };

  const startRename = (threadId: string, threadTitle: string) => {
    setRenameId(threadId);
    setRenameValue(threadTitle)
  }

  const finishRename = async (threadId: string, threadTitle: string) => {
    if (!renameId || !renameValue) return

    try {
      await db.updateThread(threadId, threadTitle)
      toast.success("Update thread successfully!")
      setRenameId("")
      setRenameValue("")
    } catch (error) {
      toast.error(error as string);
    }
  }

  const handleCreateThread = async () => {
    if (!threadTitle) return
    const threadId = await db.createThread(threadTitle);
    setDialogIsOpen(false)
    setThreadTitle("")
    navigate(`/thread/${threadId}`)
  }

  useLayoutEffect(() => {
    const pathArray = location.pathname.split("/")
    const threadId = pathArray[pathArray.length - 1]

    setActiveChat(threadId)
  }, [location.pathname])

  return (
    <>

      <SidebarPrimitive>
        <SidebarHeader>
          <Button
            onClick={() => setDialogIsOpen(true)}
              className="w-full justify-start" variant="ghost">
              <Plus className="mr-2 h-4 w-4" />
              New Chat
          </Button>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarGroupLabel>Recent Chats</SidebarGroupLabel>
              <SidebarMenu>
                {threads?.map((chat) => (
                  <SidebarMenuItem key={chat.id}>
                    <Link to={`/thread/${chat.id}`}>
                      <DropdownMenu modal={false}>
                        <SidebarMenuButton
                          onDoubleClick={() => startRename(chat.id, chat.title)}
                          className="w-full justify-between"
                          isActive={activeChat === chat.id}
                          >
                            {renameId === chat.id ? (
                              <input
                                className="border rounded px-2 py-1 w-full text-sm bg-background"
                                autoFocus
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onBlur={() => setRenameId("")}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") finishRename(renameId, renameValue);
                                  if (e.key === "Escape") setRenameId("");
                                }}
                              />
                            ) : (
                              <span>{chat.title}</span>
                            )}

                          <DropdownMenuTrigger className="w-fit">
                            <Button variant="outline" aria-label="Open menu" size="sm">
                              <MoreHorizontalIcon />
                            </Button>
                          </DropdownMenuTrigger>
                        </SidebarMenuButton>
                        <DropdownMenuContent>
                          <DropdownMenuGroup>
                            <DropdownMenuItem
                                onSelect={() => {startRename(chat.id, chat.title)}}
                              >
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onSelect={() => {setShowDeleteDialog(true)}}
                              >
                              <span className='text-destructive brightness-200 font-semibold'>Delete</span>                              
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <Button
            onClick={handleToggleTheme}
            variant="ghost"
            className="w-full justify-start"
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />{" "}
            Toggle Theme
          </Button>
        </SidebarFooter>
      </SidebarPrimitive>
      
      <Dialog open={dialogIsOpen} onOpenChange={setDialogIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Thread</DialogTitle>
          </DialogHeader>

          <div className="space-y-1">
            <Label htmlFor="thread-title">Thread Title</Label>
            <Input id="thread-title" onChange={(e) => setThreadTitle(e.target.value)}/>
          </div>

          <DialogFooter>
            <Button
              variant={"secondary"}
              onClick={() => setDialogIsOpen(false)}>
                Cancel
            </Button>
            <Button
              onClick={handleCreateThread}>
                Create Thread
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete This Chat?</DialogTitle>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant={"secondary"}
              onClick={() => setDialogIsOpen(false)}>
                Cancel
            </Button>
            <Button
              variant={"destructive"}
              onClick={() => {}}>
                Delete Thread
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
