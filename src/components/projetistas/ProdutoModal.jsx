import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EMPTY = { nome: "", descricao: "" };

export default function ProdutoModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initial ? { nome: initial.nome || "", descricao: initial.descricao || "" } : EMPTY);
  }, [initial, open]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handle = async () => {
    if (!form.nome) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">{initial ? "Editar Produto" : "Vincular Novo Produto"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-[#6B6B72]">Nome do Produto *</Label>
            <Input value={form.nome} onChange={set("nome")} placeholder="Ex: Vigas Pré-Moldadas" className="h-9 rounded-lg text-sm" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-[#6B6B72]">Modelo / Descrição</Label>
            <Input value={form.descricao} onChange={set("descricao")} placeholder="Ex: Layout Padrão V1" className="h-9 rounded-lg text-sm" />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-lg h-9 text-sm">Cancelar</Button>
          <Button size="sm" onClick={handle} disabled={saving} className="rounded-lg h-9 text-sm bg-[#3B82F6] hover:bg-[#2563EB]">
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}