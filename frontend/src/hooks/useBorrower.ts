import { useCallback } from 'react';
import { useApi } from './useApi';

export interface Borrower {
    id: number;
    name: string;
    phone: string;
    note: string;
}

export const useBorrower = () => {
    const { request } = useApi();

    const getBorrowers = useCallback(async (search?: string) => {
        let url = '/api/borrowers/';
        if (search) {
            url += `?search=${encodeURIComponent(search)}`;
        }
        const res = await request(url);
        const data = await res.json();
        return data as Borrower[];
    }, [request]);

    const createBorrower = useCallback(async (data: Omit<Borrower, 'id'>) => {
        const res = await request('/api/borrowers/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        const newBorrower = await res.json();
        return newBorrower as Borrower;
    }, [request]);

    const updateBorrower = useCallback(async (id: number, data: Partial<Omit<Borrower, 'id'>>) => {
        const res = await request(`/api/borrowers/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
        const updated = await res.json();
        return updated as Borrower;
    }, [request]);
    const deleteBorrower = useCallback(async (id: number) => {
        const res = await request(`/api/borrowers/${id}/`, {
            method: 'DELETE',
        });
        return res.status === 204;
    }, [request]);

    return { getBorrowers, createBorrower, updateBorrower, deleteBorrower };
};
