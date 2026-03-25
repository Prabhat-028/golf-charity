export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: 'user' | 'admin'
  stripe_customer_id: string | null
  email_draw_results: boolean
  email_marketing: boolean
  push_results_enabled: boolean
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  stripe_subscription_id: string
  plan: 'monthly' | 'yearly'
  status: 'active' | 'cancelled' | 'past_due'
  current_period_start: string
  current_period_end: string
  created_at: string
}

export interface Score {
  id: string
  user_id: string
  score: number
  position: 1 | 2 | 3 | 4 | 5
  submitted_at: string
}

export interface Draw {
  id: string
  draw_date: string
  numbers: number[]
  prize_pool: number
  five_match_prize: number
  four_match_prize: number
  three_match_prize: number
  charity_amount: number
  status: 'pending' | 'completed'
  created_at: string
}

export interface Winner {
  id: string
  draw_id: string
  user_id: string
  match_type: 'five' | 'four' | 'three'
  matched_numbers: number[]
  prize_amount: number
  payout_status: 'pending' | 'verified' | 'paid'
  verification_image_url: string | null
  created_at: string
  profile?: Profile
}

export interface Charity {
  id: string
  name: string
  description: string | null
  logo_url: string | null
  website_url: string | null
  total_received: number
  is_active: boolean
  created_at: string
}

export interface CharityDonation {
  id: string
  draw_id: string
  charity_id: string
  amount: number
  created_at: string
}

export interface GdprRequest {
  id: string
  user_id: string
  request_type: 'deletion' | 'correction' | 'access'
  status: 'pending' | 'in_review' | 'completed' | 'rejected'
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Profile>
      }
      subscriptions: {
        Row: Subscription
        Insert: Omit<Subscription, 'id' | 'created_at'>
        Update: Partial<Subscription>
      }
      scores: {
        Row: Score
        Insert: Omit<Score, 'id' | 'submitted_at'>
        Update: Partial<Score>
      }
      draws: {
        Row: Draw
        Insert: Omit<Draw, 'id' | 'created_at'>
        Update: Partial<Draw>
      }
      winners: {
        Row: Winner
        Insert: Omit<Winner, 'id' | 'created_at'>
        Update: Partial<Winner>
      }
      charities: {
        Row: Charity
        Insert: Omit<Charity, 'id' | 'created_at' | 'total_received'>
        Update: Partial<Charity>
      }
      charity_donations: {
        Row: CharityDonation
        Insert: Omit<CharityDonation, 'id' | 'created_at'>
        Update: Partial<CharityDonation>
      }
      gdpr_requests: {
        Row: GdprRequest
        Insert: Omit<GdprRequest, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<GdprRequest>
      }
    }
  }
}
