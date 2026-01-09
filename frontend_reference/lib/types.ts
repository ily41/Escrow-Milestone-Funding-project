/**
 * TypeScript types for API responses
 */

export interface User {
  id: number
  username: string
  email: string
  is_creator: boolean
  is_backer: boolean
  is_admin: boolean
  wallet_address?: string | null
  wallet_type?: 'metamask' | 'local' | null
  created_at: string
}

export interface Creator {
  id: number
  user: User
  display_name: string
  bio: string
  created_at: string
}

export interface Project {
  project_id: string
  creator?: Creator
  creator_name?: string  // For list views
  title: string
  description: string
  funding_goal: string
  current_funding: string
  deadline: string
  created_at: string
  status: number | string  // Backend uses integer, but can be string in some contexts
  milestones?: Milestone[]
  escrow_address?: string
  onchain_project_id?: number
  deployment_wallet_type?: 'metamask' | 'local' | null
  chain_id?: string | null
  milestones_count?: number  // For list views
  // Computed fields for frontend
  goal_amount?: string  // Alias for funding_goal
  total_pledged?: string  // Alias for current_funding
  progress_percentage?: number
  currency?: string  // Not in backend, might be computed
}

export interface Milestone {
  milestone_id: string
  project: string | number  // project_id
  title: string
  description: string
  funding_amount: string
  due_date: string | null
  submitted_at: string | null
  status: number | string  // Backend uses integer
  voting_session_id?: string | null
  // Computed fields for frontend
  target_amount?: string  // Alias for funding_amount
  order_index?: number
  approve_votes_count?: number
  reject_votes_count?: number
  required_amount: string
  funded_amount: string
  progress?: number
  is_activated?: boolean
}

export interface Pledge {
  pledge_id: string
  project: string | number  // project_id
  backer: string | number  // backer_id
  amount: string
  pledged_at: string
  status: number | string
  voting_power?: string
  // Computed fields for frontend
  project_title?: string
  currency?: string
}

export interface Vote {
  vote_id: string
  milestone: string | number  // milestone_id
  backer: string | number  // backer_id
  vote_weight: string
  approval: number  // 1 for approve, 0 for reject
  voted_at: string
  // Computed fields for frontend
  decision?: 'approve' | 'reject'
  backer_username?: string
}

export interface Release {
  release_id: string
  milestone: string | number  // milestone_id
  amount: string
  released_at: string
  transaction_hash?: string | null
  status: number | string
  // Computed fields for frontend
  amount_released?: string  // Alias for amount
  tx_reference?: string  // Alias for transaction_hash
}

export interface Refund {
  refund_id: string
  project: string | number  // project_id
  backer: string | number  // backer_id
  amount: string
  requested_at: string
  processed_at: string | null
  status: number | string
  // Computed fields for frontend
  project_title?: string
  refunded_at?: string  // Alias for processed_at
}

export interface Wallet {
  id: number
  owner_type: 'creator' | 'backer' | 'platform'
  owner_id: number
  balance: string
  currency: string
  created_at: string
}

export interface Update {
  update_id?: string
  id?: string  // Some APIs might use id
  project: string | number  // project_id
  project_id?: string | number
  title: string
  content: string
  created_at: string
  created_by?: number | string
  created_by_username?: string
}
