import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Save } from "lucide-react";

interface SettingsPanelProps {
  onUrlsChange: (orderUrl: string, adminUrl: string) => void;
}

export const SettingsPanel = ({ onUrlsChange }: SettingsPanelProps) => {
  const [orderApiUrl, setOrderApiUrl] = useState<string>(() => localStorage.getItem("orderApiUrl") || "http://localhost:5000");
  const [adminApiUrl, setAdminApiUrl] = useState<string>(() => localStorage.getItem("adminApiUrl") || "http://localhost:5080");

  useEffect(() => {
    onUrlsChange(orderApiUrl, adminApiUrl);
  }, []);

  const handleSave = () => {
    localStorage.setItem("orderApiUrl", orderApiUrl);
    localStorage.setItem("adminApiUrl", adminApiUrl);
    onUrlsChange(orderApiUrl, adminApiUrl);
    toast.success("URLs salvas");
  };

  return (
    <Card className="fixed bottom-6 right-6 w-[380px] p-4 bg-gradient-card shadow-card border-border/50">
      <h3 className="text-sm font-semibold text-foreground mb-3">Configurações</h3>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="orderUrl">Order API URL</Label>
          <Input id="orderUrl" value={orderApiUrl} onChange={(e) => setOrderApiUrl(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="adminUrl">Admin API URL</Label>
          <Input id="adminUrl" value={adminApiUrl} onChange={(e) => setAdminApiUrl(e.target.value)} />
        </div>
        <Button onClick={handleSave} className="w-full">
          <Save className="h-4 w-4 mr-2" /> Salvar
        </Button>
      </div>
    </Card>
  );
};
