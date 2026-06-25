import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EMPTY = { nome: "", razao_social: "", cnpj: "", email: "", especialidade: "" };

export default function ProjetistaModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initial ? { nome: initial.nome || "", razao_social: initial.razao_social || "", cnpj: initial.cnpj || "", email: initial.email || "", especialidade: initial.especialidade || "" } : EMPTY);
  }, [initial, open]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handle = async () => {
    if (!form.nome || !form.razao_social || !form.cnpj || !form.email) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">{initial ? "Editar Projetista" : "Cadastrar Projetista"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label className="text-xs text-[#6B6B72]">Razão Social *</Label>
              <Input value={form.razao_social} onChange={set("razao_social")} placeholder="Ex: Estruturas Apex Ltda." className="h-9 rounded-lg text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-[#6B6B72]">Nome / Apelido *</Label>
              <Input value={form.nome} onChange={set("nome")} placeholder="Ex: Estruturas Apex" className="h-9 rounded-lg text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-[#6B6B72]">CNPJ *</Label>
              <Input value={form.cnpj} onChange={set("cnpj")} placeholder="00.000.000/0001-00" className="h-9 rounded-lg text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-[#6B6B72]">E-mail de Contato *</Label>
              <Input value={form.email} onChange={set("email")} placeholder="contato@empresa.com" className="h-9 rounded-lg text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-[#6B6B72]">Especialidade</Label>
              <Input value={form.especialidade} onChange={set("especialidade")} placeholder="Ex: Vigas e Lajes" className="h-9 rounded-lg text-sm" />
            </div>
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