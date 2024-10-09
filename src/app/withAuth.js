// withAuth.js
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const withAuth = (WrappedComponent) => {
    return (props) => {
        const router = useRouter();

        useEffect(() => {
            const token = localStorage.getItem('token');
            if (!token) {
                // If no token, redirect to login page
                router.push('/auth/login');
            }
        }, [router]);

        return <WrappedComponent {...props} />;
    };
};

export default withAuth;
