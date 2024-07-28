import { createClient } from '@supabase/supabase-js';
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';

const supabaseUrl = import.meta.env.VITE_SUPABASE_PROJECT_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_API_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);

import React from "react";
export const queryClient = new QueryClient();
export function SupabaseProvider({ children }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
}

const fromSupabase = async (query) => {
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
};

/* supabase integration types

### user_secrets

| name       | type                     | format | required |
|------------|--------------------------|--------|----------|
| id         | uuid                     | string | true     |
| user_id    | uuid                     | string | true     |
| secret     | text                     | string | true     |
| created_at | timestamp with time zone | string | true     |

*/

// Hooks for user_secrets table

export const useUserSecrets = () => useQuery({
    queryKey: ['user_secrets'],
    queryFn: () => fromSupabase(supabase.from('user_secrets').select('*')),
});

export const useUserSecret = (id) => useQuery({
    queryKey: ['user_secrets', id],
    queryFn: () => fromSupabase(supabase.from('user_secrets').select('*').eq('id', id).single()),
});

export const useAddUserSecret = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (newSecret) => fromSupabase(supabase.from('user_secrets').insert([newSecret])),
        onSuccess: () => {
            queryClient.invalidateQueries('user_secrets');
        },
    });
};

export const useUpdateUserSecret = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...updateData }) => fromSupabase(supabase.from('user_secrets').update(updateData).eq('id', id)),
        onSuccess: () => {
            queryClient.invalidateQueries('user_secrets');
        },
    });
};

export const useDeleteUserSecret = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => fromSupabase(supabase.from('user_secrets').delete().eq('id', id)),
        onSuccess: () => {
            queryClient.invalidateQueries('user_secrets');
        },
    });
};