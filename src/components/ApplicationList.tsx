import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function ApplicationList({ role }: { role: string }) {
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const { toast } = useToast();

    const fetchApps = async () => {
        setLoading(true);
        try {
            const { data, error } = await api.applications.index.get({
                headers: { 'x-user-role': role }
            });
            if (data) setApplications(data);
            if (error) console.error(error);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApps();
    }, [role]);

    const updateStatus = async (id: number, status: string) => {
        await api.applications({ id: id.toString() }).status.patch({
            status
        }, {
            headers: { 'x-user-role': role }
        });
        toast({ title: "Status Updated", description: `Application moved to ${status}` });
        fetchApps();
    }

    const filteredApplications = applications.filter(app => {
        const matchesSearch = app.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              app.client?.company_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const statusColors: Record<string, string> = {
        'PENDING_DOCS': 'bg-slate-50/50',
        'FINANCE_PENDING': 'bg-yellow-50/50',
        'VETTING_PROGRESS': 'bg-blue-50/50',
        'NAFDAC_SUBMITTED': 'bg-purple-50/50',
        'APPROVED': 'bg-green-50/50',
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Applications</h3>
                {(role === 'DIRECTOR' || role === 'DOCUMENTATION') && (
                    <CreateApplicationDialog role={role} onSuccess={fetchApps} />
                )}
            </div>

            <div className="flex gap-4">
                <Input 
                    placeholder="Search products or clients..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Statuses</SelectItem>
                        <SelectItem value="PENDING_DOCS">Pending Docs</SelectItem>
                        <SelectItem value="FINANCE_PENDING">Finance Pending</SelectItem>
                        <SelectItem value="VETTING_PROGRESS">Vetting Progress</SelectItem>
                        <SelectItem value="NAFDAC_SUBMITTED">NAFDAC Submitted</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredApplications.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                                No applications found matching your filters.
                            </TableCell>
                        </TableRow>
                    ) : (
                        filteredApplications.map((app) => (
                        <TableRow key={app.id} className={statusColors[app.status] || ''}>
                            <TableCell className="font-medium">{app.product_name}</TableCell>
                            <TableCell>{app.client?.company_name}</TableCell>
                            <TableCell>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border bg-white shadow-sm">
                                    {app.status}
                                </span>
                            </TableCell>
                            <TableCell>
                                {role === 'FINANCE' && app.status === 'FINANCE_PENDING' && (
                                    <Button size="sm" onClick={() => updateStatus(app.id, 'VETTING_PROGRESS')}>
                                        Approve Payment
                                    </Button>
                                )}
                                {role === 'VETTING' && app.status === 'VETTING_PROGRESS' && (
                                    <div className="flex space-x-2">
                                        <Button size="sm" variant="outline" onClick={() => {
                                            if (app.documents && app.documents.length > 0) {
                                                window.open(`/api/uploads/${app.documents[0].file_path.split('/').pop()}`, '_blank');
                                            } else {
                                                toast({ variant: "destructive", title: "No Documents", description: "This application has no uploaded documents." });
                                            }
                                        }}>View Docs</Button>
                                        <Button size="sm" onClick={() => updateStatus(app.id, 'NAFDAC_SUBMITTED')}>
                                            Submit
                                        </Button>
                                    </div>
                                )}
                                {role === 'DOCUMENTATION' && (
                                    <UploadDocumentDialog applicationId={app.id} role={role} onSuccess={fetchApps} />
                                )}
                                {role === 'DIRECTOR' && app.status === 'NAFDAC_SUBMITTED' && (
                                    <Button size="sm" onClick={() => updateStatus(app.id, 'APPROVED')} className="bg-green-600 hover:bg-green-700 text-white">
                                        Final Approval
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    )))}
                </TableBody>
            </Table>
        </div>
    );
}

function CreateApplicationDialog({ role, onSuccess }: { role: string, onSuccess: () => void }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [clientId, setClientId] = useState('');
    const [clients, setClients] = useState<any[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        if (open) {
            api.clients.index.get({ headers: { 'x-user-role': role } })
                .then(({ data }) => {
                    if (data) setClients(data);
                });
        }
    }, [open, role]);

    const handleSubmit = async () => {
        if (!name || !clientId) {
            toast({ variant: "destructive", title: "Validation Error", description: "Please fill in all fields" });
            return;
        }
        
        try {
            const { data, error } = await api.applications.index.post({
                product_name: name,
                client_id: parseInt(clientId),
                status: 'PENDING_DOCS'
            }, {
                headers: { 'x-user-role': role }
            });

            if (error) {
                console.error("API Error:", error);
                toast({ variant: "destructive", title: "Error", description: `Error: ${JSON.stringify(error.value)}` });
                return;
            }

            setOpen(false);
            toast({ title: "Success", description: "Application created successfully" });
            onSuccess();
        } catch (e) {
            console.error("Network/Client Error:", e);
            toast({ variant: "destructive", title: "Error", description: "Failed to create application" });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button>New Application</Button></DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>New Application</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Product Name</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Client</Label>
                        <Select value={clientId} onValueChange={setClientId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a client" />
                            </SelectTrigger>
                            <SelectContent>
                                {clients.map((client) => (
                                    <SelectItem key={client.id} value={client.id.toString()}>
                                        {client.company_name} ({client.cac_number})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleSubmit}>Create</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function UploadDocumentDialog({ applicationId, role, onSuccess }: { applicationId: number, role: string, onSuccess: () => void }) {
    const [open, setOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [type, setType] = useState('CAC');
    const { toast } = useToast();

    const handleUpload = async () => {
        if (!file) return;
        
        await api.upload.index.post({
            file: file,
            application_id: applicationId.toString(),
            file_type: type
        }, {
            headers: { 'x-user-role': role }
        });
        setOpen(false);
        toast({ title: "Document Uploaded", description: "Application moved to Finance stage." });
        onSuccess();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button variant="secondary" size="sm">Upload</Button></DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                    <Input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
                    <div className="space-y-2">
                        <Label>Type</Label>
                        <select className="w-full border p-2 rounded" value={type} onChange={e => setType(e.target.value)}>
                            <option value="CAC">CAC</option>
                            <option value="LABEL">Label</option>
                            <option value="SOP">SOP</option>
                        </select>
                    </div>
                    <Button onClick={handleUpload}>Upload</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
