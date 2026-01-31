import { createFileRoute } from '@tanstack/react-router';
import { Building2, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

export const Route = createFileRoute('/dashboard/clients')({
  component: ClientManagement,
});

function ClientManagement() {
  const [clients, setClients] = useState<any[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchClients = useCallback(async () => {
    const { data } = await api.clients.index.get();
    if (data) setClients(data);
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleDelete = async (id: number) => {
    if (
      !confirm(
        'Are you sure you want to delete this company? This might fail if they have active applications.',
      )
    )
      return;

    try {
      const { error } = await api.clients({ id: id.toString() }).delete();
      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete company. Ensure they have no active applications.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Company deleted successfully',
        });
        fetchClients();
      }
    } catch (_e) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Company Management</CardTitle>
            <CardDescription>Manage registered client companies</CardDescription>
          </div>
          <AddClientDialog onAdd={fetchClients} />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>CAC Number</TableHead>
                <TableHead className="text-right">Applications</TableHead>
                {user?.role === 'DIRECTOR' && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    {c.company_name}
                  </TableCell>
                  <TableCell>{c.cac_number}</TableCell>
                  <TableCell className="text-right font-medium text-slate-700">
                    {c.applications?.length || 0}
                  </TableCell>
                  {user?.role === 'DIRECTOR' && (
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(c.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function AddClientDialog({ onAdd }: { onAdd: () => void }) {
  const [name, setName] = useState('');
  const [cac, setCac] = useState('');
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    setLoading(true);
    const { error } = await api.clients.index.post({
      company_name: name,
      cac_number: cac,
    });
    setLoading(false);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to add company',
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Success', description: 'Company added successfully' });
      setOpen(false);
      setName('');
      setCac('');
      onAdd();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Company
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Company</DialogTitle>
          <DialogDescription>Register a new client company in the system.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. HealthPlus Ltd"
            />
          </div>
          <div className="space-y-2">
            <Label>CAC Number</Label>
            <Input value={cac} onChange={(e) => setCac(e.target.value)} placeholder="RC..." />
          </div>
          <Button className="w-full" onClick={handleAdd} disabled={!name || !cac || loading}>
            {loading ? 'Adding...' : 'Add Company'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
