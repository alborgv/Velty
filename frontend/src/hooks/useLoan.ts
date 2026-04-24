import { useCallback } from 'react';
import { useApi } from './useApi';

export interface Loan {
    id: number;
    borrower?: number;
    borrower_name?: string;
    borrower_phone?: string;
    amount: string;
    paid_amount?: string;
    total_amount_with_interest?: string;
    start_date: string;
    status: "ACTIVE" | "PAID" | "OVERDUE";
    computed_status?: string;
    term_months: number;
    interest_rate: string;
    payment_frequency: "MONTHLY" | "BIWEEKLY";
    created_at: string;
}

export const useLoan = () => {
    const { request } = useApi();

    const getLoans = useCallback(async (params?: { search?: string; status?: string }) => {
        let url = '/api/loans/';
        const queryParams = new URLSearchParams();
        if (params?.search) queryParams.append('search', params.search);
        if (params?.status && params.status !== "Todos") queryParams.append('status', params.status);
        
        const qs = queryParams.toString();
        if (qs) url += `?${qs}`;

        const res = await request(url);
        const data = await res.json();
        return data as Loan[];
    }, [request]);

    const createLoan = useCallback(async (data: Partial<Loan>) => {
        const res = await request('/api/loans/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        const newLoan = await res.json();
        return newLoan as Loan;
    }, [request]);

    const registerPayment = useCallback(async (loanId: number, data: { amount: number; paid_at: string; note: string; pay_only_interest?: boolean }) => {
        const res = await request(`/api/loans/${loanId}/register_payment/`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return await res.json();
    }, [request]);

    const deleteLoan = useCallback(async (loanId: number) => {
        const res = await request(`/api/loans/${loanId}/`, {
            method: 'DELETE',
        });
        // DELETE requests often turn up 204 No Content
        if (res.status === 204) return true;
        return true;
    }, [request]);

    const updateLoanStatus = useCallback(async (loanId: number, status: "ACTIVE" | "PAID" | "OVERDUE") => {
        const res = await request(`/api/loans/${loanId}/`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
        return await res.json() as Loan;
    }, [request]);

    const getLoan = useCallback(async (loanId: string | number) => {
        const res = await request(`/api/loans/${loanId}/`);
        return await res.json() as Loan;
    }, [request]);

    const updateLoan = useCallback(async (loanId: number | string, data: Partial<Loan>) => {
        const res = await request(`/api/loans/${loanId}/`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
        return await res.json() as Loan;
    }, [request]);

    return { getLoans, createLoan, registerPayment, deleteLoan, updateLoanStatus, getLoan, updateLoan };
};

