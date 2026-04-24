import { useCallback } from 'react';
import { useApi } from './useApi';

export interface DashboardStats {
    total_capital: number;
    active_loans: number;
    overdue_loans: number;
    paid_loans: number;
    collected_month: number;
    monthly_goal: number;
    total_loans: number;
    upcoming_collections: {
        id: number;
        borrower_name: string;
        amount: number;
        due_date: string;
    }[];
    recent_payments: {
        id: number;
        borrower_name: string;
        amount: number;
        paid_at: string;
    }[];
}

export const useDashboardStats = () => {
    const { request } = useApi();

    const getStats = useCallback(async () => {
        const res = await request('/api/dashboard/stats/');
        const data = await res.json();
        return data as DashboardStats;
    }, [request]);

    return { getStats };
};
