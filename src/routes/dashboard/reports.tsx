import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from 'recharts'
import { Loader2, DollarSign, FileText, Activity } from 'lucide-react'

export const Route = createFileRoute('/dashboard/reports')({
  component: ReportsPage,
})

function ReportsPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.reports.stats.get()
        if (data) setStats(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin" /></div>

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Executive Summary</h2>
        
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₦{stats?.revenue?.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">From paid invoices</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Applications</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {stats?.statusDistribution?.reduce((acc: number, curr: any) => acc + curr.value, 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">Total submissions</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Vetting</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {stats?.statusDistribution?.find((s: any) => s.name === 'VETTING_PROGRESS')?.value || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">In progress</p>
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Status Chart */}
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Application Status Distribution</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats?.statusDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats?.statusDistribution?.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="col-span-3">
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest application submissions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-8">
                        {stats?.recentActivity?.map((app: any) => (
                            <div key={app.id} className="flex items-center">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">{app.product_name}</p>
                                    <p className="text-xs text-muted-foreground">{app.client?.company_name}</p>
                                </div>
                                <div className="ml-auto font-medium text-xs bg-slate-100 px-2 py-1 rounded">
                                    {app.status}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  )
}
