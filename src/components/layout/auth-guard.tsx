
"use client";

import { useContext, useEffect, useState } from 'react';
import { DataContext } from '@/app/actions/data';
import LoginPage from '@/app/login/page';
import { usePathname, useRouter } from 'next/navigation';

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const isAuthenticated = true;
    const isLoading = false;
    const router = useRouter();
    const pathname = usePathname();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);
    
    useEffect(() => {
        if (isClient && !isLoading) {
            if (!isAuthenticated && pathname !== '/login') {
                router.push('/login');
            } else if (isAuthenticated && pathname === '/login') {
                router.push('/');
            }
        }
    }, [isAuthenticated, isLoading, router, pathname, isClient]);

    if (isLoading || !isClient) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p>Loading...</p>
            </div>
        );
    }
    
    if (!isAuthenticated && pathname !== '/login') {
        // Render nothing while redirecting
        return null;
    }

    if (isAuthenticated && pathname === '/login') {
        // Render nothing while redirecting
        return null;
    }
    
    if (!isAuthenticated && pathname === '/login') {
        return <LoginPage />;
    }

    return <>{children}</>;
}
