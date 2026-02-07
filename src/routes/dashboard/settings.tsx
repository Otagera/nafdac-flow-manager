import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'

export const Route = createFileRoute('/dashboard/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const { user } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
        toast({ title: 'Error', description: 'New passwords do not match', variant: 'destructive' })
        return
    }
    if (newPassword.length < 6) {
        toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' })
        return
    }

    setLoading(true)
    try {
        const { data, error } = await api.auth.password.patch({
            currentPassword,
            newPassword
        })

        if (error) {
            toast({ title: 'Error', description: (error.value as any).message || 'Failed to update password', variant: 'destructive' })
        } else {
            toast({ title: 'Success', description: 'Password updated successfully' })
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
        }
    } catch (e) {
        toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
    } finally {
        setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        
        <Card className="max-w-md">
            <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Current Password</Label>
                    <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label>New Password</Label>
                    <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label>Confirm New Password</Label>
                    <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
                <Button onClick={handlePasswordChange} disabled={loading}>
                    {loading ? 'Updating...' : 'Update Password'}
                </Button>
            </CardContent>
        </Card>

        <Card className="max-w-md">
            <CardHeader>
                <CardTitle>Profile Info</CardTitle>
                <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="grid grid-cols-3 text-sm">
                    <span className="font-medium text-muted-foreground">Username:</span>
                    <span className="col-span-2">{user?.username}</span>
                </div>
                <div className="grid grid-cols-3 text-sm">
                    <span className="font-medium text-muted-foreground">Role:</span>
                    <span className="col-span-2">{user?.role}</span>
                </div>
            </CardContent>
        </Card>
    </div>
  )
}
