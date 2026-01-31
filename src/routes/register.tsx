import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { Eye, EyeOff } from 'lucide-react'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const [inviteCode, setInviteCode] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleRegister = async () => {
    setLoading(true)
    try {
        const { data, error } = await api.auth.register.post({ 
            invite_code: inviteCode,
            username,
            password 
        })
        
        if (error) {
            toast({
                title: "Registration Failed",
                description: error.value ? (error.value as any).message : "Invalid invite code or username taken",
                variant: "destructive"
            })
            return
        }

        if (data.success) {
            window.location.href = '/dashboard'
        }
    } catch (e) {
        toast({
            title: "Error",
            description: "Something went wrong",
            variant: "destructive"
        })
    } finally {
        setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] bg-gray-50/50">
      <Card className="w-[350px] shadow-lg">
        <CardHeader>
          <CardTitle>Join NAFDAC Flow</CardTitle>
          <CardDescription>Enter your invite code to get started</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Invite Code</Label>
            <Input value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="FIN-X8Y2" />
          </div>
          <div className="space-y-2">
            <Label>Username</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="jdoe" />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <div className="relative">
                <Input 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="••••••" 
                    className="pr-10"
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </div>
          </div>
          <Button className="w-full" onClick={handleRegister} disabled={loading}>
            {loading ? 'Registering...' : 'Register Account'}
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
            <Link to="/login" className="text-blue-600 hover:underline">
                Back to Login
            </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
