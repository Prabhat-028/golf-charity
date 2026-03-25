import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { createPortalSession } from '@/lib/stripe'
import { Link } from 'react-router'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import QueryErrorState from '@/components/ui/QueryErrorState'
import { useToast } from '@/context/ToastContext'
import { Target, Trophy, Heart, Clock, Edit, ArrowRight } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'

export default function Dashboard() {
  const { profile } = useAuth()
  const { addToast } = useToast()
  const [portalLoading, setPortalLoading] = useState(false)

  const {
    data: scores,
    isLoading: scoresLoading,
    isError: scoresError,
    refetch: refetchScores,
  } = useQuery({
    queryKey: ['scores', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('scores').select('*').eq('user_id', profile.id).order('position')
      if (error) throw error
      return data
    },
    enabled: !!profile?.id,
  })

  const {
    data: subscription,
    isLoading: subscriptionLoading,
    isError: subscriptionError,
    refetch: refetchSubscription,
  } = useQuery({
    queryKey: ['subscription', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('subscriptions').select('*').eq('user_id', profile.id).eq('status', 'active').single()
      if (error && error.code !== 'PGRST116') throw error
      return data
    },
    enabled: !!profile?.id,
  })

  const {
    data: latestDraw,
    isError: latestDrawError,
    refetch: refetchLatestDraw,
  } = useQuery({
    queryKey: ['latest-draw'],
    queryFn: async () => {
      const { data, error } = await supabase.from('draws').select('*').eq('status', 'completed').order('draw_date', { ascending: false }).limit(1).single()
      if (error && error.code !== 'PGRST116') throw error
      return data
    },
  })

  const today = new Date()
  const nextDrawDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  const daysUntilDraw = differenceInDays(nextDrawDate, today)
  const hasAllScores = scores?.length === 5
  const isMonthlyActive = subscription?.status === 'active' && subscription?.plan === 'monthly'

  async function handleUpgradeFromDashboard() {
    setPortalLoading(true)
    try {
      const { url } = await createPortalSession({
        returnUrl: `${window.location.origin}/dashboard`,
      })

      if (!url) {
        throw new Error('No billing portal URL returned')
      }

      window.location.href = url
    } catch (error) {
      addToast(error.message || 'Failed to open billing portal.', 'error')
      setPortalLoading(false)
    }
  }

  if (scoresError || subscriptionError || latestDrawError) {
    return (
      <div className="space-y-6">
        <QueryErrorState
          title="We couldn't load your dashboard"
          message="A network or server issue occurred while loading account data."
          onRetry={() => {
            refetchScores()
            refetchSubscription()
            refetchLatestDraw()
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {profile?.full_name?.split(' ')[0] || 'Player'}!</h1>
        <p className="text-gray-600 mt-1">Here's your golf charity overview</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-100 rounded-lg"><Clock className="h-6 w-6 text-primary-600" /></div>
              <div>
                <p className="text-sm text-gray-600">Subscription</p>
                {subscriptionLoading ? <Skeleton className="h-6 w-20 mt-1" /> : subscription ? (
                  <div className="flex items-center gap-2"><Badge variant="success">Active</Badge><span className="text-sm text-gray-500 capitalize">{subscription.plan}</span></div>
                ) : <Badge variant="warning">Inactive</Badge>}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg"><Target className="h-6 w-6 text-blue-600" /></div>
              <div>
                <p className="text-sm text-gray-600">Scores Entered</p>
                {scoresLoading ? <Skeleton className="h-6 w-16 mt-1" /> : <p className="text-xl font-bold text-gray-900">{scores?.length || 0} / 5</p>}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg"><Trophy className="h-6 w-6 text-yellow-600" /></div>
              <div><p className="text-sm text-gray-600">Next Draw</p><p className="text-xl font-bold text-gray-900">{daysUntilDraw} days</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-pink-100 rounded-lg"><Heart className="h-6 w-6 text-pink-600" /></div>
              <div><p className="text-sm text-gray-600">Charity Impact</p><p className="text-xl font-bold text-gray-900">10%</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isMonthlyActive && (
        <Card className="border-primary-200 bg-primary-50">
          <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-primary-700">Upgrade Opportunity</p>
              <p className="text-gray-800">Switch to yearly billing and save $20 per year.</p>
            </div>
            <Button loading={portalLoading} onClick={handleUpgradeFromDashboard}>
              Upgrade to Yearly
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle>Your Scores</CardTitle><CardDescription>Your 5 Stableford scores for the draw</CardDescription></div>
            <Link to="/scores"><Button variant="outline" size="sm"><Edit className="h-4 w-4 mr-2" />Edit</Button></Link>
          </CardHeader>
          <CardContent>
            {scoresLoading ? (
              <div className="flex gap-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-16 rounded-lg" />)}</div>
            ) : scores?.length ? (
              <div className="flex gap-3">
                {[1, 2, 3, 4, 5].map((position) => {
                  const score = scores.find((s) => s.position === position)
                  return (
                    <div key={position} className={`flex-1 h-16 rounded-lg border-2 flex items-center justify-center ${score ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-gray-50 border-dashed border-gray-300 text-gray-400'}`}>
                      <span className="text-2xl font-bold">{score?.score || '?'}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8"><p className="text-gray-500 mb-4">No scores entered yet</p><Link to="/scores"><Button>Enter Scores</Button></Link></div>
            )}
            {!hasAllScores && scores?.length ? <p className="text-sm text-amber-600 mt-4">Enter all 5 scores to be eligible for the next draw.</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle>Latest Draw</CardTitle><CardDescription>{latestDraw ? format(new Date(latestDraw.draw_date), 'MMMM yyyy') : 'No draws yet'}</CardDescription></div>
            <Link to="/results"><Button variant="ghost" size="sm">View All<ArrowRight className="h-4 w-4 ml-2" /></Button></Link>
          </CardHeader>
          <CardContent>
            {latestDraw ? (
              <div>
                <div className="flex gap-3 mb-4">
                  {latestDraw.numbers.map((num, i) => (
                    <div key={i} className="flex-1 h-16 rounded-lg bg-gray-900 text-white flex items-center justify-center"><span className="text-2xl font-bold">{num}</span></div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div><p className="text-gray-500">5 Match</p><p className="font-semibold text-gray-900">${latestDraw.five_match_prize.toLocaleString()}</p></div>
                  <div><p className="text-gray-500">4 Match</p><p className="font-semibold text-gray-900">${latestDraw.four_match_prize.toLocaleString()}</p></div>
                  <div><p className="text-gray-500">3 Match</p><p className="font-semibold text-gray-900">${latestDraw.three_match_prize.toLocaleString()}</p></div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8"><p className="text-gray-500">No draws have been completed yet.</p></div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
