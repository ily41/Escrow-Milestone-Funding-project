import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/'

const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token')
  }
  return null
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers) => {
      const token = getAuthToken()
      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }
      return headers
    },
  }),
  tagTypes: ['Project', 'User', 'Milestone', 'Pledge', 'Vote', 'Refund', 'Update'],
  endpoints: (builder) => ({
    // Auth endpoints
    login: builder.mutation({
      query: (credentials) => ({
        url: '/api/token/',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: '/api/users/register/',
        method: 'POST',
        body: userData,
      }),
    }),
    getCurrentUser: builder.query({
      query: () => '/api/users/me/',
      providesTags: ['User'],
    }),
    getCreatorProfile: builder.query({
      query: () => '/api/users/creators/',
      providesTags: ['User'],
    }),
    updateUser: builder.mutation({
      query: (userData) => ({
        url: '/api/users/me/',
        method: 'PATCH',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),

    // Project endpoints
    getProjects: builder.query({
      query: (params) => ({
        url: '/api/projects/',
        params: params || {},
      }),
      providesTags: ['Project'],
    }),
    getMyProjects: builder.query({
      query: () => '/api/projects/my_projects/',
      providesTags: ['Project'],
    }),
    getProject: builder.query({
      query: (id) => `/api/projects/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Project', id }],
    }),
    createProject: builder.mutation({
      query: (projectData) => ({
        url: '/api/projects/',
        method: 'POST',
        body: projectData,
      }),
      invalidatesTags: ['Project'],
    }),
    activateProject: builder.mutation({
      query: (id) => ({
        url: `/api/projects/${id}/activate/`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Project', id }, 'Project'],
    }),
    deactivateProject: builder.mutation({
      query: (id) => ({
        url: `/api/projects/${id}/deactivate/`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Project', id }, 'Project'],
    }),
    updateProject: builder.mutation({
      query: ({ id, ...projectData }) => ({
        url: `/api/projects/${id}/`,
        method: 'PATCH',
        body: projectData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Project', id }, 'Project'],
    }),

    // Milestone endpoints
    getMilestones: builder.query({
      query: (params) => {
        const projectId = params?.project_id || params?.project
        if (!projectId) {
          throw new Error('project_id is required')
        }
        return `/api/projects/milestones/?project=${projectId}`
      },
      providesTags: ['Milestone'],
    }),
    createMilestone: builder.mutation({
      query: ({ projectId, ...milestoneData }) => ({
        url: '/api/projects/milestones/',
        method: 'POST',
        body: { project: projectId, ...milestoneData },
      }),
      invalidatesTags: ['Milestone', 'Project'],
    }),
    updateMilestone: builder.mutation({
      query: ({ projectId, milestoneId, ...milestoneData }) => ({
        url: `/api/projects/${projectId}/milestones/${milestoneId}/`,
        method: 'PUT',
        body: milestoneData,
      }),
      invalidatesTags: ['Milestone', 'Project'],
    }),
    deleteMilestone: builder.mutation({
      query: ({ projectId, milestoneId }) => ({
        url: `/api/projects/milestones/${milestoneId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Milestone', 'Project'],
    }),
    pledgeMilestone: builder.mutation({
      query: ({ milestoneId, amount }) => ({
        url: `/api/projects/milestones/${milestoneId}/pledge/`,
        method: 'POST',
        body: { amount },
      }),
      invalidatesTags: ['Milestone', 'Pledge'],
    }),
    activateMilestone: builder.mutation({
      query: ({ projectId, milestoneId }) => ({
        url: `/api/projects/milestones/${milestoneId}/activate/`,
        method: 'POST',
      }),
      invalidatesTags: ['Milestone', 'Project'],
    }),
    approveMilestone: builder.mutation({
      query: ({ id, ...approvalData }) => ({
        url: `/api/projects/milestones/${id}/approve/`,
        method: 'POST',
        body: approvalData,
      }),
      invalidatesTags: ['Milestone', 'Project'],
    }),

    // Pledge endpoints
    getPledges: builder.query({
      query: (params) => ({
        url: '/finance/pledges/',
        params: params ? { backer: params.backer } : undefined,
      }),
      providesTags: ['Pledge'],
    }),
    createPledge: builder.mutation({
      query: ({ projectId, amount, ...pledgeData }) => ({
        url: `/api/projects/${projectId}/pledge/`,
        method: 'POST',
        body: { amount, ...pledgeData },
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: 'Project', id: projectId },
        'Pledge',
        'Project',
      ],
    }),

    // Refund endpoints
    getRefunds: builder.query({
      query: (params) => ({
        url: '/finance/refunds/',
        params: params ? { backer: params.backer } : undefined,
      }),
      providesTags: ['Refund'],
    }),

    // Wallet endpoints
    getWallet: builder.query({
      query: () => '/finance/wallet/',
      providesTags: ['User'],
    }),

    // Vote endpoints
    voteOnMilestone: builder.mutation({
      query: ({ milestone_id, decision }) => ({
        url: `/api/projects/milestones/${milestone_id}/vote/`,
        method: 'POST',
        body: { decision },
      }),
      invalidatesTags: ['Vote', 'Milestone'],
    }),
    openVoting: builder.mutation({
      query: ({ milestoneId }) => ({
        url: `/api/projects/milestones/${milestoneId}/open-voting/`,
        method: 'POST',
      }),
      invalidatesTags: ['Milestone', 'Vote'],
    }),

    // Fund release
    releaseFunds: builder.mutation({
      query: ({ milestoneId }) => ({
        url: `/api/projects/milestones/${milestoneId}/release-funds/`,
        method: 'POST',
      }),
      invalidatesTags: ['Milestone', 'Project'],
    }),

    // Updates endpoints (Temporarily disabled - not implemented in backend)
    getUpdates: builder.query({
      queryFn: () => ({ data: [] }), // Return empty array instead of making API call
      providesTags: ['Update'],
    }),
    createUpdate: builder.mutation({
      queryFn: () => ({ data: { success: true } }), // Stub implementation
      invalidatesTags: ['Update', 'Project'],
    }),
  }),
})

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetCurrentUserQuery,
  useGetCreatorProfileQuery,
  useUpdateUserMutation,
  useGetProjectsQuery,
  useGetMyProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useActivateProjectMutation,
  useDeactivateProjectMutation,
  useUpdateProjectMutation,
  useGetMilestonesQuery,
  useCreateMilestoneMutation,
  useUpdateMilestoneMutation,
  useDeleteMilestoneMutation,
  useActivateMilestoneMutation,
  useApproveMilestoneMutation,
  useGetPledgesQuery,
  useCreatePledgeMutation,
  useGetRefundsQuery,
  useGetWalletQuery,
  useVoteOnMilestoneMutation,
  useOpenVotingMutation,
  useReleaseFundsMutation,
  useGetUpdatesQuery,
  useCreateUpdateMutation,
  usePledgeMilestoneMutation,
} = api
