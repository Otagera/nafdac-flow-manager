import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Printer, Plus, Trash2, ReceiptText } from 'lucide-react';

interface Client {
  id: number;
  company_name: string;
  cac_number: string;
}

interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
}

interface Invoice {
  id: number;
  invoice_number: string;
  total_amount: number;
  status: string;
  items?: InvoiceItem[];
}

interface Application {
  id: number;
  product_name: string;
  status: string;
  client?: Client;
  documents?: { id: number; file_path: string }[];
  invoices?: Invoice[];
}

export function ApplicationList({ role }: { role: string }) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [_loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const { toast } = useToast();

  const fetchApps = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await api.applications.index.get({
        headers: { 'x-user-role': role },
      });
      if (data) setApplications(data as Application[]);
      if (error) console.error(error);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const updateStatus = async (id: number, status: string) => {
    await api.applications({ id: id.toString() }).status.patch(
      {
        status,
      },
      {
        headers: { 'x-user-role': role },
      },
    );
    toast({
      title: 'Status Updated',
      description: `Application moved to ${status}`,
    });
    fetchApps();
  };

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.client?.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusColors: Record<string, string> = {
    PENDING_DOCS: 'bg-slate-50/50',
    FINANCE_PENDING: 'bg-yellow-50/50',
    VETTING_PROGRESS: 'bg-blue-50/50',
    NAFDAC_SUBMITTED: 'bg-purple-50/50',
    APPROVED: 'bg-green-50/50',
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Applications</h3>
        {(role === 'DIRECTOR' || role === 'DOCUMENTATION') && (
          <CreateApplicationDialog role={role} onSuccess={fetchApps} />
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Search products or clients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
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

      <div className="rounded-md border overflow-x-auto">
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
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border bg-white shadow-sm whitespace-nowrap">
                      {app.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {app.invoices && app.invoices.length > 0 && (
                        <InvoiceViewDialog
                          invoice={app.invoices[0]}
                          client={app.client}
                          product={app.product_name}
                        />
                      )}

                      {role === 'FINANCE' && app.status === 'FINANCE_PENDING' && (
                        <Button size="sm" onClick={() => updateStatus(app.id, 'VETTING_PROGRESS')}>
                          Approve Payment
                        </Button>
                      )}
                      {role === 'VETTING' && app.status === 'VETTING_PROGRESS' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (app.documents && app.documents.length > 0) {
                                window.open(
                                  `/api/uploads/${app.documents[0].file_path.split('/').pop()}`,
                                  '_blank',
                                );
                              } else {
                                toast({
                                  variant: 'destructive',
                                  title: 'No Documents',
                                  description: 'This application has no uploaded documents.',
                                });
                              }
                            }}
                          >
                            View Docs
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => updateStatus(app.id, 'NAFDAC_SUBMITTED')}
                          >
                            Submit
                          </Button>
                        </>
                      )}
                      {role === 'DOCUMENTATION' && (
                        <UploadDocumentDialog
                          applicationId={app.id}
                          role={role}
                          onSuccess={fetchApps}
                        />
                      )}
                      {role === 'DIRECTOR' && (
                        <div className="flex gap-2">
                          {app.status === 'NAFDAC_SUBMITTED' && (
                            <Button
                              size="sm"
                              onClick={() => updateStatus(app.id, 'APPROVED')}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              Final Approval
                            </Button>
                          )}
                          <ApplicationDeleteDialog application={app} onSuccess={fetchApps} />
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function CreateApplicationDialog({ role, onSuccess }: { role: string; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const { toast } = useToast();

  const standardFees = [
    { label: 'Official Registration Fee', price: 50000 },
    { label: 'Documentation Fee', price: 20000 },
    { label: 'SOP Writing', price: 30000 },
    { label: 'Formulation Fee', price: 25000 },
    { label: 'PR Fees', price: 10000 },
    { label: 'Consultation & Retainership', price: 100000 },
  ];

  useEffect(() => {
    if (open) {
      api.clients.index.get({ headers: { 'x-user-role': role } }).then(({ data }) => {
        if (data) setClients(data as Client[]);
      });
    }
  }, [open, role]);

  const addItem = (description = '', price = 0) => {
    setItems([
      ...items,
      { id: crypto.randomUUID(), description, quantity: 1, unit_price: price },
    ]);
  };

  const removeItem = (id?: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    const item = { ...newItems[index] };
    (item as any)[field] = value;
    newItems[index] = item;
    setItems(newItems);
  };

  const handleSubmit = async () => {
    if (!name || !clientId) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill in all fields',
      });
      return;
    }

    try {
      const { error } = await api.applications.index.post(
        {
          product_name: name,
          client_id: parseInt(clientId, 10),
          status: 'PENDING_DOCS',
          items:
            items.length > 0
              ? items.map(({ description, quantity, unit_price }) => ({
                  description,
                  quantity,
                  unit_price,
                }))
              : undefined,
        },
        {
          headers: { 'x-user-role': role },
        },
      );

      if (error) {
        console.error('API Error:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: `Error: ${JSON.stringify(error.value)}`,
        });
        return;
      }

      setOpen(false);
      setName('');
      setClientId('');
      setItems([]);
      toast({
        title: 'Success',
        description: 'Application and Invoice created',
      });
      onSuccess();
    } catch (e) {
      console.error('Network/Client Error:', e);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create application',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New Application
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Application & Invoice</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Product Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Panadol Extra"
              />
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <div className="flex justify-between items-center">
              <Label className="text-base font-bold">Billing Items (Optional)</Label>
              <div className="flex gap-2">
                <Select
                  onValueChange={(val) => {
                    const fee = standardFees.find((f) => f.label === val);
                    if (fee) addItem(fee.label, fee.price);
                  }}
                >
                  <SelectTrigger className="w-[200px] h-8 text-xs">
                    <SelectValue placeholder="Add Standard Fee" />
                  </SelectTrigger>
                  <SelectContent>
                    {standardFees.map((fee) => (
                      <SelectItem key={fee.label} value={fee.label}>
                        {fee.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" size="sm" onClick={() => addItem()}>
                  <Plus className="h-3 w-3 mr-1" /> Custom
                </Button>
              </div>
            </div>

            {items.map((item, index) => (
              <div key={item.id} className="flex gap-2 items-end bg-slate-50 p-2 rounded-md border">
                <div className="flex-1 space-y-1">
                  <Label className="text-[10px] uppercase">Description</Label>
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="w-20 space-y-1">
                  <Label className="text-[10px] uppercase">Qty</Label>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value, 10))}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="w-32 space-y-1">
                  <Label className="text-[10px] uppercase">Unit Price (₦)</Label>
                  <Input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, 'unit_price', parseInt(e.target.value, 10))}
                    className="h-8 text-sm"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {items.length > 0 && (
              <div className="text-right font-bold text-lg pr-10">
                Total: ₦{items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0).toLocaleString()}
              </div>
            )}
          </div>

          <Button className="w-full" onClick={handleSubmit}>
            Create Application & Invoice
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InvoiceViewDialog({
  invoice,
  client,
  product,
}: { invoice: Invoice; client?: Client; product: string }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100"
        >
          <ReceiptText className="h-4 w-4 mr-1" /> Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
          <DialogTitle>Invoice {invoice.invoice_number}</DialogTitle>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
        </DialogHeader>

        {/* The Invoice Document */}
        <div id="invoice-content" className="p-8 bg-white text-slate-900 space-y-8 min-h-[600px]">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-blue-900 tracking-tight">
                KITE SCIENTIFIC SERVICES
              </h2>
              <p className="text-sm font-medium">Professional Regulatory Consultants</p>
              <div className="text-xs text-slate-500 pt-2">
                <p>Phone: 08033314809</p>
                <p>Email: kitescientificservices@gmail.com</p>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-block bg-slate-900 text-white px-4 py-2 text-xs font-bold rounded mb-2 uppercase tracking-widest">
                Invoice
              </div>
              <p className="text-sm font-mono">{invoice.invoice_number}</p>
              <p className="text-xs text-slate-500">{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 border-y py-6 border-slate-100">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Bill To
              </p>
              <p className="font-bold text-lg">{client?.company_name || 'Valued Customer'}</p>
              <p className="text-sm text-slate-600">CAC: {client?.cac_number || 'N/A'}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Subject
              </p>
              <p className="font-semibold">{product}</p>
              <p className="text-sm text-slate-600 italic">Registration Services</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-slate-200">
                <TableHead className="text-slate-900">Description</TableHead>
                <TableHead className="text-right text-slate-900">Qty</TableHead>
                <TableHead className="text-right text-slate-900">Unit Price</TableHead>
                <TableHead className="text-right text-slate-900">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items?.map((item, index) => (
                <TableRow key={index} className="border-slate-100">
                  <TableCell className="font-medium">{item.description}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">₦{item.unit_price.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-bold">
                    ₦{(item.unit_price * item.quantity).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-end pt-4">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span>₦{invoice.total_amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-black border-t pt-2 border-slate-200 text-blue-900">
                <span>Total Due</span>
                <span>₦{invoice.total_amount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="pt-12 border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Payment Info
            </p>
            <p className="text-xs text-slate-600 leading-relaxed italic">
              Please ensure all bank transfers are made to the designated company account. Quote the
              invoice number <strong>{invoice.invoice_number}</strong> as reference.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UploadDocumentDialog({
  applicationId,
  role,
  onSuccess,
}: {
  applicationId: number;
  role: string;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState('CAC');
  const { toast } = useToast();

  const handleUpload = async () => {
    if (!file) return;

    await api.upload.index.post(
      {
        file: file,
        application_id: applicationId.toString(),
        file_type: type,
      },
      {
        headers: { 'x-user-role': role },
      },
    );
    setOpen(false);
    toast({
      title: 'Document Uploaded',
      description: 'Application moved to Finance stage.',
    });
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          Upload
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <div className="space-y-2">
            <Label>Type</Label>
            <select
              className="w-full border p-2 rounded"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="CAC">CAC</option>
              <option value="LABEL">Label</option>
              <option value="SOP">SOP</option>
            </select>
          </div>
          <Button onClick={handleUpload}>Upload</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ApplicationDeleteDialog({
  application,
  onSuccess,
}: {
  application: Application;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.applications({ id: application.id.toString() }).delete();
      toast({ title: 'Success', description: 'Application deleted' });
      setOpen(false);
      onSuccess();
    } catch (e) {
      toast({
        title: 'Error',
        description: 'Failed to delete application',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Application</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{application.product_name}</strong>? This will
            permanently remove the application, all uploaded documents, and invoices.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
