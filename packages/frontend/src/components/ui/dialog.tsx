import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

// Context pour gérer le stack des dialogs
const DialogStackContext = React.createContext({ 
  dialogCount: 0, 
  incrementDialog: () => {}, 
  decrementDialog: () => {} 
});

export const DialogStackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dialogCount, setDialogCount] = React.useState(0);
  
  const incrementDialog = React.useCallback(() => {
    setDialogCount(prev => prev + 1);
  }, []);
  
  const decrementDialog = React.useCallback(() => {
    setDialogCount(prev => Math.max(0, prev - 1));
  }, []);
  
  return (
    <DialogStackContext.Provider value={{ dialogCount, incrementDialog, decrementDialog }}>
      {children}
    </DialogStackContext.Provider>
  );
};

const useDialogStack = () => React.useContext(DialogStackContext);

function Dialog({
  onOpenChange,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  const { incrementDialog, decrementDialog } = useDialogStack();
  
  const handleOpenChange = React.useCallback((open: boolean) => {
    if (open) {
      incrementDialog();
    } else {
      decrementDialog();
    }
    onOpenChange?.(open);
  }, [incrementDialog, decrementDialog, onOpenChange]);
  
  return <DialogPrimitive.Root data-slot="dialog" onOpenChange={handleOpenChange} {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  const { dialogCount } = useDialogStack();
  const [currentLevel, setCurrentLevel] = React.useState(0);
  
  React.useEffect(() => {
    setCurrentLevel(dialogCount - 1);
  }, [dialogCount]);
  
  // Calculer le décalage basé sur le niveau du dialog
  const offset = currentLevel * 30; // 30px de décalage par niveau
  const scale = Math.max(0.8, 1 - currentLevel * 0.08); // Réduction de taille plus importante (8% par niveau)
  const zIndex = 50 + currentLevel; // Z-index croissant
  
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed grid max-w-[calc(100%-1rem)] gap-4 rounded-lg border p-6 shadow-lg duration-200 w-full",
          className
        )}
        style={{
          top: `calc(50% + ${offset}px)`,
          left: `calc(50% + ${offset}px)`,
          transform: `translate(-50%, -50%) scale(${scale})`,
          zIndex: zIndex,
          boxShadow: `0 ${4 + currentLevel * 2}px ${8 + currentLevel * 4}px rgba(0, 0, 0, ${0.1 + currentLevel * 0.05})`
        }}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
          <XIcon />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
