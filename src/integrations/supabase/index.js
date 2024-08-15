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

| name       | type                   | format | required |
|------------|------------------------|--------|----------|
| id         | uuid                   | string | true     |
| user_id    | uuid                   | string | true     |
| secret     | text                   | string | true     |
| created_at | timestamp with time zone | string | true     |

### reviewers

| name             | type                   | format  | required |
|------------------|------------------------|---------|----------|
| id               | uuid                   | string  | true     |
| scenario_id      | uuid                   | string  | true     |
| dimension        | text                   | string  | true     |
| description      | text                   | string  | true     |
| prompt           | text                   | string  | true     |
| weight           | numeric                | number  | true     |
| llm_model        | text                   | string  | true     |
| llm_temperature  | numeric                | number  | true     |
| run_count        | integer                | number  | true     |
| created_at       | timestamp with time zone | string  | true     |
| version          | integer                | number  | false    |

### review_dimensions

| name        | type                   | format | required |
|-------------|------------------------|--------|----------|
| id          | uuid                   | string | true     |
| name        | text                   | string | true     |
| description | text                   | string | false    |
| created_at  | timestamp with time zone | string | true     |

### benchmark_scenarios

| name             | type                   | format | required |
|------------------|------------------------|--------|----------|
| id               | uuid                   | string | true     |
| name             | text                   | string | true     |
| description      | text                   | string | false    |
| prompt           | text                   | string | true     |
| llm_model        | text                   | string | true     |
| llm_temperature  | numeric                | number | true     |
| timeout          | integer                | number | true     |
| created_at       | timestamp with time zone | string | true     |
| version          | integer                | number | false    |

### results

| name        | type                   | format | required |
|-------------|------------------------|--------|----------|
| id          | uuid                   | string | true     |
| run_id      | uuid                   | string | true     |
| reviewer_id | uuid                   | string | true     |
| result      | jsonb                  | object | false    |
| created_at  | timestamp with time zone | string | true     |

### runs

| name                | type                   | format | required |
|---------------------|------------------------|--------|----------|
| id                  | uuid                   | string | true     |
| scenario_id         | uuid                   | string | true     |
| system_version      | text                   | string | true     |
| project_id          | text                   | string | true     |
| user_id             | uuid                   | string | false    |
| created_at          | timestamp with time zone | string | true     |
| impersonation_failed| boolean                | boolean| false    |
| link                | text                   | string | false    |

*/

// User Secrets
export const useUserSecrets = () => useQuery({
    queryKey: ['user_secrets'],
    queryFn: () => fromSupabase(supabase.from('user_secrets').select('*')),
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

// Reviewers
export const useReviewers = () => useQuery({
    queryKey: ['reviewers'],
    queryFn: () => fromSupabase(supabase.from('reviewers').select('*')),
});

export const useScenarioReviewers = (scenarioId) => useQuery({
    queryKey: ['scenario_reviewers', scenarioId],
    queryFn: () => fromSupabase(supabase
        .from('scenario_reviewers')
        .select(`
            reviewer_id,
            reviewers (*)
        `)
        .eq('scenario_id', scenarioId)),
    enabled: !!scenarioId,
});

export const useGenericReviewers = () => useQuery({
    queryKey: ['genericReviewers'],
    queryFn: () => fromSupabase(supabase.from('reviewers').select('*').eq('is_generic', true)),
});

export const useReviewer = (id) => useQuery({
    queryKey: ['reviewers', id],
    queryFn: () => fromSupabase(supabase.from('reviewers').select('*').eq('id', id).single()),
    enabled: !!id,
});

export const useAddReviewer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (newReviewer) => fromSupabase(supabase.from('reviewers').insert([newReviewer])),
        onSuccess: () => {
            queryClient.invalidateQueries('reviewers');
            queryClient.invalidateQueries('genericReviewers');
        },
    });
};

export const useAddScenarioReviewer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (newScenarioReviewer) => fromSupabase(supabase.from('scenario_reviewers').insert([newScenarioReviewer])),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries(['scenario_reviewers', variables.scenario_id]);
        },
    });
};

export const useDeleteScenarioReviewer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ scenario_id, reviewer_id }) => fromSupabase(
            supabase.from('scenario_reviewers')
                .delete()
                .match({ scenario_id, reviewer_id })
        ),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries(['scenario_reviewers', variables.scenario_id]);
        },
    });
};

export const useUpdateReviewer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...updateData }) => fromSupabase(supabase.from('reviewers').update(updateData).eq('id', id)),
        onSuccess: () => {
            queryClient.invalidateQueries('reviewers');
        },
    });
};

export const useDeleteReviewer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => fromSupabase(supabase.from('reviewers').delete().eq('id', id)),
        onSuccess: () => {
            queryClient.invalidateQueries('reviewers');
        },
    });
};

// Review Dimensions
export const useReviewDimensions = () => useQuery({
    queryKey: ['review_dimensions'],
    queryFn: () => fromSupabase(supabase.from('review_dimensions').select('*')),
});

export const useReviewDimension = (id) => useQuery({
    queryKey: ['review_dimensions', id],
    queryFn: () => fromSupabase(supabase.from('review_dimensions').select('*').eq('id', id).single()),
    enabled: !!id,
});

export const useAddReviewDimension = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (newDimension) => fromSupabase(supabase.from('review_dimensions').insert([newDimension])),
        onSuccess: () => {
            queryClient.invalidateQueries('review_dimensions');
        },
    });
};

export const useUpdateReviewDimension = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...updateData }) => fromSupabase(supabase.from('review_dimensions').update(updateData).eq('id', id)),
        onSuccess: () => {
            queryClient.invalidateQueries('review_dimensions');
        },
    });
};

export const useDeleteReviewDimension = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => fromSupabase(supabase.from('review_dimensions').delete().eq('id', id)),
        onSuccess: () => {
            queryClient.invalidateQueries('review_dimensions');
        },
    });
};

// Benchmark Scenarios
export const useBenchmarkScenarios = () => useQuery({
    queryKey: ['benchmark_scenarios'],
    queryFn: () => fromSupabase(supabase.from('benchmark_scenarios').select(`
        *,
        scenario_reviewers (
            reviewer:reviewers (*)
        )
    `)),
});

export const useBenchmarkScenario = (id) => useQuery({
    queryKey: ['benchmark_scenarios', id],
    queryFn: () => fromSupabase(supabase.from('benchmark_scenarios').select('*').eq('id', id).single()),
    enabled: !!id,
});

export const useAddBenchmarkScenario = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (newScenario) => {
            console.log("Adding new scenario:", newScenario);
            const { id, reviewers, ...scenarioWithoutId } = newScenario; // Remove id and reviewers from the input
            const { data, error } = await supabase.from('benchmark_scenarios').insert([{
                ...scenarioWithoutId,
                timeout: scenarioWithoutId.timeout || 300 // Default to 5 minutes if not provided
            }]).select().single();
            
            if (error) {
                console.error("Error adding scenario:", error);
                throw error;
            }
            
            if (!data) {
                console.error("No data returned after adding scenario");
                throw new Error("No data returned after adding scenario");
            }
            
            // Add reviewers to scenario_reviewers table
            if (reviewers && reviewers.length > 0) {
                const scenarioReviewers = reviewers.map(reviewerId => ({
                    scenario_id: data.id,
                    reviewer_id: reviewerId
                }));
                const { error: reviewerError } = await supabase.from('scenario_reviewers').insert(scenarioReviewers);
                if (reviewerError) {
                    console.error("Error adding scenario reviewers:", reviewerError);
                    throw reviewerError;
                }
            }
            
            console.log("Successfully added scenario:", data);
            return { data, error: null };
        },
        onSuccess: () => {
            queryClient.invalidateQueries('benchmark_scenarios');
        },
        onError: (error) => {
            console.error("Mutation error:", error);
        },
    });
};

export const useUpdateBenchmarkScenario = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, reviewers, ...updateData }) => {
            const { data, error } = await supabase.from('benchmark_scenarios').update({
                ...updateData,
                timeout: updateData.timeout || 300 // Default to 5 minutes if not provided
            }).eq('id', id);

            if (error) {
                throw error;
            }

            // Update scenario reviewers
            if (reviewers) {
                // Remove existing reviewers
                await supabase.from('scenario_reviewers').delete().eq('scenario_id', id);

                // Add new reviewers
                if (reviewers.length > 0) {
                    const scenarioReviewers = reviewers.map(reviewerId => ({
                        scenario_id: id,
                        reviewer_id: reviewerId
                    }));
                    const { error: reviewerError } = await supabase.from('scenario_reviewers').insert(scenarioReviewers);
                    if (reviewerError) {
                        throw reviewerError;
                    }
                }
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries('benchmark_scenarios');
        },
    });
};

export const useScenarioReviewers = (scenarioId) => useQuery({
    queryKey: ['scenario_reviewers', scenarioId],
    queryFn: () => fromSupabase(supabase
        .from('scenario_reviewers')
        .select(`
            reviewer_id,
            reviewers (*)
        `)
        .eq('scenario_id', scenarioId)),
    enabled: !!scenarioId,
});

export const useDeleteBenchmarkScenario = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => fromSupabase(supabase.from('benchmark_scenarios').delete().eq('id', id)),
        onSuccess: () => {
            queryClient.invalidateQueries('benchmark_scenarios');
        },
    });
};

// Results
export const useResults = () => useQuery({
    queryKey: ['results'],
    queryFn: () => fromSupabase(supabase.from('results').select('*')),
});

export const useResult = (id) => useQuery({
    queryKey: ['results', id],
    queryFn: () => fromSupabase(supabase.from('results').select('*').eq('id', id).single()),
    enabled: !!id,
});

export const useAddResult = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (newResult) => fromSupabase(supabase.from('results').insert([newResult])),
        onSuccess: () => {
            queryClient.invalidateQueries('results');
        },
    });
};

export const useUpdateResult = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...updateData }) => fromSupabase(supabase.from('results').update(updateData).eq('id', id)),
        onSuccess: () => {
            queryClient.invalidateQueries('results');
        },
    });
};

export const useDeleteResult = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => fromSupabase(supabase.from('results').delete().eq('id', id)),
        onSuccess: () => {
            queryClient.invalidateQueries('results');
        },
    });
};

// Runs
export const useRuns = () => useQuery({
    queryKey: ['runs'],
    queryFn: () => fromSupabase(supabase.from('runs').select('*').order('created_at', { ascending: false }).limit(10)),
});

export const useRun = (id) => useQuery({
    queryKey: ['runs', id],
    queryFn: () => fromSupabase(supabase.from('runs').select('*').eq('id', id).single()),
    enabled: !!id,
});

export const useAddRun = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (newRun) => fromSupabase(supabase.from('runs').insert([{
            ...newRun,
            state: newRun.state || 'running'
        }])),
        onSuccess: () => {
            queryClient.invalidateQueries('runs');
        },
    });
};

export const useUpdateRun = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...updateData }) => fromSupabase(supabase.from('runs').update({
            ...updateData,
            state: updateData.state || 'running'
        }).eq('id', id)),
        onSuccess: () => {
            queryClient.invalidateQueries('runs');
        },
    });
};

export const useDeleteRun = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => fromSupabase(supabase.from('runs').delete().eq('id', id)),
        onSuccess: () => {
            queryClient.invalidateQueries('runs');
        },
    });
};
