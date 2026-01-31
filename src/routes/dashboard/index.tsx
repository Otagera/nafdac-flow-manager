import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ApplicationList } from '@/components/ApplicationList'
import { useAuth } from '@/hooks/use-auth'

export const Route = createFileRoute('/dashboard/')({
  component: DashboardIndex,
})

function DashboardIndex() {
  const { user } = useAuth()
  
  if (!user) return null;

  return (
    <div className="space-y-4">
        <Card>
            <CardHeader><CardTitle>Welcome back, {user.username}</CardTitle></CardHeader>
            <CardContent>
                <ApplicationList role={user.role} />
            </CardContent>
        </Card>
    </div>
  )
}
