// ProtectedRoute.js

'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter

const ProtectedRoute = ({ children }) => {
    const router = useRouter(); // Initialize useRouter

    useEffect(() => {
        const token = localStorage.getItem('token'); // Get token from localStorage
        if (!token) {
            // If no token, redirect to the login page
            router.push('/auth/login'); // Adjust the path as needed
        }
    }, [router]);

    return <>{children}</>; // Render children if the user is authenticated
};

export default ProtectedRoute;
