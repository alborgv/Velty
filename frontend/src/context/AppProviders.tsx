// import { ToastProvider } from '@/components/ui/Toast/ToastContainer';
import { AuthProvider } from '@/context/AuthContext';
// import { QueryProvider } from '@/context/QueryContext';

const AppProviders: React.FC<ChildrenProps> = ({ children }) => {
    return (
        <AuthProvider>
            {/* <QueryProvider> */}
                {/* <ToastProvider> */}
                    {children}
                {/* </ToastProvider> */}
            {/* </QueryProvider> */}
        </AuthProvider>
    );
};

export default AppProviders;
