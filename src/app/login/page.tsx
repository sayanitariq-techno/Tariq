
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { TechnofiableIcon } from '@/components/icons';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { toast } = useToast();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock login success
        toast({
            title: 'Login Successful',
            description: 'Redirecting to dashboard...',
        });
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                     <div className="flex flex-col justify-center items-center gap-2 mb-4">
                        <TechnofiableIcon className="w-24 h-24" />
                        <span className="text-xl font-bold font-headline">Technofiable Engineering LLP.</span>
                    </div>
                    <CardTitle className="font-headline text-2xl">Admin Login</CardTitle>
                    <CardDescription>Enter your credentials to access the dashboard.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="Tariq"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <Button type="submit" className="w-full">
                            Login
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
