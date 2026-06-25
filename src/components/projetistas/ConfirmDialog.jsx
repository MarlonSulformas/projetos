import React from "react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

export default function ConfirmDialog({ open, onClose, onConfirm, title = "Confirmar exclusão", description = "Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita." }) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base font-semibold">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-[#6B6B72]">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-lg h-9 text-sm">Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="rounded-lg h-9 text-sm bg-red-500 hover:bg-red-600 text-white">
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}