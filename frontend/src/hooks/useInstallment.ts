import { useCallback } from 'react';
import { useApi } from './useApi';

export interface Installment {
    id: number;
    loan: number;
    number: number;
    due_date: string;
    amount: string;
    capital: string;
    interest: string;
    status: "PENDING" | "PAID" | "OVERDUE";
    paid_at: string | null;
    created_at: string;
}

export const useInstallment = () => {
    const { request } = useApi();

    const getInstallments = useCallback(async (loanId: string | number) => {
        const res = await request(`/api/installment/?loan=${loanId}`);
        return await res.json() as Installment[];
    }, [request]);

    const deleteInstallment = useCallback(async (id: number) => {
        const res = await request(`/api/installment/${id}/`, {
            method: 'DELETE',
        });
        return res.status === 204;
    }, [request]);

    return { getInstallments, deleteInstallment };
};
