import { createFileRoute } from '@tanstack/react-router';
import { Copy, Trash2, UserPlus } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

export const Route = createFileRoute('/dashboard/team')({
  component: TeamManagement,
});

function TeamManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const { user } = useAuth();

  const fetchUsers = useCallback(async () => {
    const { data } = await api.admin.users.get();
    if (data) setUsers(data);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Team Management</CardTitle>
            <CardDescription>Manage users and roles</CardDescription>
          </div>
          <InviteUserDialog onInvite={fetchUsers} />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const isCurrentUser = user?.id === u.id;
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.username}</TableCell>
                    <TableCell>{u.role}</TableCell>
                    <TableCell>
                      {u.invite_code ? (
                        <span className="text-yellow-600 bg-yellow-100 px-2 py-1 rounded text-xs">
                          Invited
                        </span>
                      ) : (
                        <span className="text-green-600 bg-green-100 px-2 py-1 rounded text-xs">
                          Active
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isCurrentUser}
                        onClick={async () => {
                          if (confirm('Are you sure?')) {
                            await api.admin.users({ id: u.id }).delete();
                            fetchUsers();
                          }
                        }}
                      >
                        <Trash2
                          className={`h-4 w-4 ${isCurrentUser ? 'text-gray-300' : 'text-red-500'}`}
                        />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function InviteUserDialog({ onInvite }: { onInvite: () => void }) {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('FINANCE');
  const [open, setOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const { toast } = useToast();

  const handleInvite = async () => {
    const { data, error } = await api.admin.users.invite.post({
      username,
      role,
    });
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to invite user',
        variant: 'destructive',
      });
    } else {
      setGeneratedCode(data.invite_code);
      onInvite();
    }
  };

  const copyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      toast({
        title: 'Copied!',
        description: 'Invite code copied to clipboard.',
      });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setGeneratedCode(null);
          setUsername('');
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" /> Invite User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite New User</DialogTitle>
          <DialogDescription>Generate an invite code for a new team member.</DialogDescription>
        </DialogHeader>

        {!generatedCode ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Username (Pre-set)</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. finance_lead"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIRECTOR">Director</SelectItem>
                  <SelectItem value="FINANCE">Finance</SelectItem>
                  <SelectItem value="VETTING">Vetting</SelectItem>
                  <SelectItem value="DOCUMENTATION">Documentation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleInvite} disabled={!username}>
              Generate Code
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="bg-slate-100 p-4 rounded-md text-center">
              <p className="text-sm text-muted-foreground mb-2">Share this code with the user:</p>
              <div className="text-2xl font-mono font-bold tracking-widest text-slate-800 flex items-center justify-center gap-2">
                {generatedCode}
                <Button variant="ghost" size="icon" onClick={copyCode}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button className="w-full" variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
