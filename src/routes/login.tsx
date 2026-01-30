import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState } from 'react'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const [role, setRole] = useState('DIRECTOR')
  const navigate = useNavigate()

  const handleLogin = () => {
    localStorage.setItem('user_role', role)
    // Force a reload to ensure all components pick up the new role from localStorage
    window.location.href = '/dashboard'
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] bg-gray-50/50">
      <Card className="w-[350px] shadow-lg">
        <CardHeader>
          <CardTitle>NAFDAC Flow Manager</CardTitle>
          <CardDescription>Select your department to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Role / Department</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DIRECTOR">Director (Admin)</SelectItem>
                <SelectItem value="FINANCE">Finance Dept</SelectItem>
                <SelectItem value="VETTING">Vetting & Compliance</SelectItem>
                <SelectItem value="DOCUMENTATION">Documentation</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full" onClick={handleLogin}>Log In</Button>
        </CardContent>
      </Card>
    </div>
  )
}
