import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

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
        url: '/auth/login/',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: '/auth/register/',
        method: 'POST',
        body: userData,
      }),
    }),
    getCurrentUser: builder.query({
      query: () => '/auth/me/',
      providesTags: ['User'],
    }),

    // Project endpoints
    getProjects: builder.query({
      query: (params) => ({
        url: '/api/projects/',
        params: params || {},
      }),
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

    // Milestone endpoints
    getMilestones: builder.query({
      query: (params) => {
        // Backend expects 'project' parameter, which should be the project_id (UUID)
        const projectParam = params?.project_id || params?.project
        return {
          url: '/api/projects/milestones/',
          params: projectParam ? { project: projectParam } : undefined,
        }
      },
      providesTags: ['Milestone'],
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

    // Vote endpoints
    voteOnMilestone: builder.mutation({
      query: (voteData) => ({
        url: '/governance/votes/',
        method: 'POST',
        body: voteData,
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

    // Updates endpoints (Note: These endpoints may not exist in backend yet)
    getUpdates: builder.query({
      query: (params) => ({
        url: '/projects/updates/',
        params: params ? { project_id: params.project_id || params.project } : undefined,
      }),
      providesTags: ['Update'],
    }),
    createUpdate: builder.mutation({
      query: ({ projectId, ...updateData }) => ({
        url: '/projects/updates/',
        method: 'POST',
        body: { project_id: projectId, ...updateData },
      }),
      invalidatesTags: ['Update', 'Project'],
    }),
  }),
})

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetCurrentUserQuery,
  useGetProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useActivateProjectMutation,
  useDeactivateProjectMutation,
  useGetMilestonesQuery,
  useApproveMilestoneMutation,
  useGetPledgesQuery,
  useCreatePledgeMutation,
  useGetRefundsQuery,
  useVoteOnMilestoneMutation,
  useOpenVotingMutation,
  useReleaseFundsMutation,
  useGetUpdatesQuery,
  useCreateUpdateMutation,
} = api
