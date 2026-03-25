import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { SUBSCRIPTION_PRICES, createCheckoutSession, createPortalSession } from '@/lib/stripe'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/context/ToastContext'
import { format } from 'date-fns'
import { CreditCard, Shield } from 'lucide-react'

const AVATAR_MAX_SIZE = 3 * 1024 * 1024
const AVATAR_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
})

export default function Account() {
  const { profile, updatePassword } = useAuth()
  const { addToast } = useToast()
  const [saving, setSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('yearly')
  const [showSubscribeModal, setShowSubscribeModal] = useState(false)
  const [showChangePlanModal, setShowChangePlanModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [dataExporting, setDataExporting] = useState(false)
  const [gdprRequesting, setGdprRequesting] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const [emailPrefsSaving, setEmailPrefsSaving] = useState(false)
  const [emailDrawResults, setEmailDrawResults] = useState(profile?.email_draw_results ?? true)
  const [emailMarketing, setEmailMarketing] = useState(profile?.email_marketing ?? false)
  const [pushResultsEnabled, setPushResultsEnabled] = useState(profile?.push_results_enabled ?? false)
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  )
  const [message, setMessage] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    setAvatarUrl(profile?.avatar_url || '')
  }, [profile?.avatar_url])

  useEffect(() => {
    setEmailDrawResults(profile?.email_draw_results ?? true)
    setEmailMarketing(profile?.email_marketing ?? false)
    setPushResultsEnabled(profile?.push_results_enabled ?? false)
  }, [profile?.email_draw_results, profile?.email_marketing, profile?.push_results_enabled])

  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['subscription', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('subscriptions').select('*').eq('user_id', profile.id).eq('status', 'active').single()
      if (error && error.code !== 'PGRST116') throw error
      return data
    },
    enabled: !!profile?.id,
  })

  const { data: gdprRequests, isLoading: gdprRequestsLoading } = useQuery({
    queryKey: ['gdpr-requests', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gdpr_requests')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!profile?.id,
  })

  const { register: registerProfile, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: profile?.full_name || '', email: profile?.email || '' },
  })

  async function onProfileSubmit(data) {
    setSaving(true)
    setMessage('')
    const { error } = await supabase.from('profiles').update({ full_name: data.full_name }).eq('id', profile.id)
    setSaving(false)
    setMessage(error ? 'Error updating profile' : 'Profile updated successfully')
  }

  async function handlePasswordChange(e) {
    e.preventDefault()
    setPasswordMessage('')
    if (newPassword.length < 8) { setPasswordMessage('Password must be at least 8 characters'); return }
    if (newPassword !== confirmPassword) { setPasswordMessage('Passwords do not match'); return }
    setPasswordSaving(true)
    const { error } = await updatePassword(newPassword)
    setPasswordSaving(false)
    if (error) setPasswordMessage(error.message)
    else { setPasswordMessage('Password updated successfully'); setNewPassword(''); setConfirmPassword('') }
  }

  async function handleStartCheckout() {
    if (!profile?.id || !profile?.email) {
      addToast('Unable to start checkout. Please sign in again.', 'error')
      return
    }

    const priceId = SUBSCRIPTION_PRICES[selectedPlan]
    if (!priceId) {
      addToast('Subscription price is not configured.', 'error')
      return
    }

    setCheckoutLoading(true)
    try {
      const { url } = await createCheckoutSession({
        priceId,
        userId: profile.id,
        email: profile.email,
      })

      if (!url) {
        throw new Error('No checkout URL returned')
      }

      window.location.href = url
    } catch (error) {
      addToast(error.message || 'Failed to start checkout session.', 'error')
      setCheckoutLoading(false)
    }
  }

  async function openBillingPortal() {
    setPortalLoading(true)
    try {
      const { url } = await createPortalSession({
        returnUrl: `${window.location.origin}/account`,
      })

      if (!url) {
        throw new Error('No portal URL returned')
      }

      window.location.href = url
    } catch (error) {
      addToast(error.message || 'Failed to open billing portal.', 'error')
      setPortalLoading(false)
    }
  }

  const yearlySavings = '$20'
  const isMonthlyActive = subscription?.status === 'active' && subscription?.plan === 'monthly'

  async function handleAvatarUpload(file) {
    if (!file || !profile?.id) return

    if (!AVATAR_ALLOWED_TYPES.includes(file.type)) {
      addToast('Please upload a JPG, PNG, or WEBP image.', 'error')
      return
    }

    if (file.size > AVATAR_MAX_SIZE) {
      addToast('Avatar image must be 3MB or smaller.', 'error')
      return
    }

    const extension = file.name.split('.').pop() || 'jpg'
    const path = `${profile.id}/avatar-${Date.now()}.${extension}`

    setAvatarUploading(true)
    try {
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })

      if (uploadError) throw uploadError

      const { data: publicData } = supabase.storage
        .from('avatars')
        .getPublicUrl(path)

      const publicUrl = publicData?.publicUrl
      if (!publicUrl) {
        throw new Error('Failed to get avatar URL')
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id)

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      addToast('Avatar updated successfully.', 'success')
    } catch (error) {
      addToast(error.message || 'Failed to upload avatar.', 'error')
    } finally {
      setAvatarUploading(false)
    }
  }

  async function handleSaveEmailPreferences() {
    if (!profile?.id) return

    setEmailPrefsSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          email_draw_results: emailDrawResults,
          email_marketing: emailMarketing,
          push_results_enabled: pushResultsEnabled,
        })
        .eq('id', profile.id)

      if (error) throw error
      addToast('Email preferences updated.', 'success')
    } catch (error) {
      addToast(error.message || 'Failed to update email preferences.', 'error')
    } finally {
      setEmailPrefsSaving(false)
    }
  }

  async function handleEnableBrowserNotifications() {
    if (typeof Notification === 'undefined') {
      addToast('Browser notifications are not supported on this device.', 'warning')
      return
    }

    const permission = await Notification.requestPermission()
    setNotificationPermission(permission)

    if (permission === 'granted') {
      setPushResultsEnabled(true)
      addToast('Browser notifications enabled. Save preferences to apply.', 'success')
      return
    }

    addToast('Notification permission was not granted.', 'warning')
  }

  async function handleDataExport() {
    if (!profile?.id) return

    setDataExporting(true)
    try {
      const [
        profileResult,
        subscriptionsResult,
        scoresResult,
        winsResult,
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', profile.id).single(),
        supabase.from('subscriptions').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }),
        supabase.from('scores').select('*').eq('user_id', profile.id).order('position', { ascending: true }),
        supabase.from('winners').select('*, draw:draws(draw_date)').eq('user_id', profile.id).order('created_at', { ascending: false }),
      ])

      const firstError = [profileResult, subscriptionsResult, scoresResult, winsResult]
        .find((result) => result.error)?.error

      if (firstError) {
        throw firstError
      }

      const payload = {
        exported_at: new Date().toISOString(),
        profile: profileResult.data,
        subscriptions: subscriptionsResult.data || [],
        scores: scoresResult.data || [],
        wins: winsResult.data || [],
      }

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json;charset=utf-8',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `golf-charity-data-export-${profile.id.slice(0, 8)}.json`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      addToast('Your data export is ready.', 'success')
    } catch (error) {
      addToast(error.message || 'Failed to export account data.', 'error')
    } finally {
      setDataExporting(false)
    }
  }

  async function handleRequestDeletion() {
    if (!profile?.id) return

    const hasPendingDeletion = (gdprRequests || []).some(
      (request) => request.request_type === 'deletion' && request.status === 'pending',
    )

    if (hasPendingDeletion) {
      addToast('You already have a pending deletion request.', 'warning')
      return
    }

    setGdprRequesting(true)
    try {
      const { error } = await supabase
        .from('gdpr_requests')
        .insert({
          user_id: profile.id,
          request_type: 'deletion',
          status: 'pending',
          notes: 'Requested from account settings',
        })

      if (error) throw error
      addToast('Deletion request submitted. Our team will review it shortly.', 'success')
    } catch (error) {
      addToast(error.message || 'Failed to submit deletion request.', 'error')
    } finally {
      setGdprRequesting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-600 mt-1">Manage your profile and subscription</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <Avatar src={avatarUrl} alt={profile?.full_name || ''} size="lg" />
              <input
                id="avatar-upload"
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  handleAvatarUpload(file)
                  event.target.value = ''
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                loading={avatarUploading}
                onClick={() => {
                  const input = document.getElementById('avatar-upload')
                  if (input) input.click()
                }}
              >
                {avatarUrl ? 'Change Avatar' : 'Upload Avatar'}
              </Button>
            </div>
            <div><CardTitle>Profile Information</CardTitle><CardDescription>Update your personal details and avatar</CardDescription></div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
            <Input label="Full Name" error={profileErrors.full_name?.message} {...registerProfile('full_name')} />
            <Input label="Email" type="email" disabled helperText="Email cannot be changed" {...registerProfile('email')} />
            {message && <p className={`text-sm ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>}
            <Button type="submit" loading={saving}>Save Changes</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-100 rounded-lg"><CreditCard className="h-6 w-6 text-primary-600" /></div>
            <div><CardTitle>Subscription</CardTitle><CardDescription>Manage your subscription plan</CardDescription></div>
          </div>
        </CardHeader>
        <CardContent>
          {subscriptionLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <div className="flex gap-3">
                <Skeleton className="h-10 w-36" />
                <Skeleton className="h-10 w-28" />
                <Skeleton className="h-10 w-40" />
              </div>
            </div>
          ) : subscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div><p className="font-medium text-gray-900 capitalize">{subscription.plan} Plan</p><p className="text-sm text-gray-500">Next billing: {format(new Date(subscription.current_period_end), 'MMMM d, yyyy')}</p></div>
                <Badge variant="success">Active</Badge>
              </div>
              <div className="flex gap-3">
                {isMonthlyActive && (
                  <Button onClick={openBillingPortal} loading={portalLoading}>
                    Upgrade to Yearly
                  </Button>
                )}
                <Button variant="outline" onClick={() => setShowChangePlanModal(true)}>Change Plan</Button>
                <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setShowCancelModal(true)}>Cancel Subscription</Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6"><p className="text-gray-600 mb-4">You don't have an active subscription.</p><Button onClick={() => setShowSubscribeModal(true)}>Subscribe Now</Button></div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-100 rounded-lg"><Shield className="h-6 w-6 text-gray-600" /></div>
            <div><CardTitle>Security</CardTitle><CardDescription>Update your password</CardDescription></div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <Input label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" helperText="Must be at least 8 characters" />
            <Input label="Confirm New Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
            {passwordMessage && <p className={`text-sm ${passwordMessage.includes('Error') || passwordMessage.includes('match') || passwordMessage.includes('must') ? 'text-red-600' : 'text-green-600'}`}>{passwordMessage}</p>}
            <Button type="submit" loading={passwordSaving}>Update Password</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Preferences</CardTitle>
          <CardDescription>Choose which updates you want to receive by email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={emailDrawResults}
              onChange={(e) => setEmailDrawResults(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <div>
              <p className="font-medium text-gray-900">Draw Results and Winner Updates</p>
              <p className="text-sm text-gray-500">Get notified when draw results are published or your payout status changes.</p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={emailMarketing}
              onChange={(e) => setEmailMarketing(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <div>
              <p className="font-medium text-gray-900">Product News and Offers</p>
              <p className="text-sm text-gray-500">Receive occasional updates about platform improvements and promotions.</p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={pushResultsEnabled}
              onChange={(e) => setPushResultsEnabled(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <div>
              <p className="font-medium text-gray-900">Browser Push Notifications</p>
              <p className="text-sm text-gray-500">Notify me when new draw results are published.</p>
              <p className="text-xs text-gray-500 mt-1">Permission: {notificationPermission}</p>
              <Button type="button" variant="ghost" size="sm" className="mt-1" onClick={handleEnableBrowserNotifications}>
                Enable Browser Notifications
              </Button>
            </div>
          </label>

          <Button onClick={handleSaveEmailPreferences} loading={emailPrefsSaving}>Save Email Preferences</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Account Details</CardTitle></CardHeader>
        <CardContent>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">Member since</dt><dd className="text-gray-900">{profile?.created_at ? format(new Date(profile.created_at), 'MMMM d, yyyy') : 'N/A'}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">User ID</dt><dd className="text-gray-900 font-mono text-xs">{profile?.id?.slice(0, 8)}...</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Account type</dt><dd><Badge variant={profile?.role === 'admin' ? 'info' : 'default'}>{profile?.role || 'user'}</Badge></dd></div>
          </dl>
          <div className="mt-5 pt-5 border-t border-gray-200">
            <Button variant="outline" loading={dataExporting} onClick={handleDataExport}>
              Download My Data (JSON)
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Privacy and GDPR</CardTitle>
          <CardDescription>Manage privacy rights requests for your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="font-medium text-gray-900">Request Account Deletion</p>
            <p className="text-sm text-gray-500 mt-1">
              Submit a deletion request for review. Your request status will appear below.
            </p>
            <div className="mt-3">
              <Button variant="danger" loading={gdprRequesting} onClick={handleRequestDeletion}>
                Submit Deletion Request
              </Button>
            </div>
          </div>

          <div>
            <p className="font-medium text-gray-900 mb-2">Recent Requests</p>
            {gdprRequestsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : gdprRequests?.length ? (
              <div className="space-y-2">
                {gdprRequests.slice(0, 3).map((request) => (
                  <div key={request.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">{request.request_type} request</p>
                      <p className="text-xs text-gray-500">{format(new Date(request.created_at), 'MMM d, yyyy')}</p>
                    </div>
                    <Badge variant={request.status === 'completed' ? 'success' : request.status === 'rejected' ? 'error' : 'warning'}>
                      {request.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No privacy requests submitted yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={showSubscribeModal}
        onClose={() => setShowSubscribeModal(false)}
        title="Choose your subscription plan"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedPlan('monthly')}
              className={`p-4 rounded-lg border-2 text-left transition-colors ${selectedPlan === 'monthly' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <p className="font-semibold text-gray-900">Monthly</p>
              <p className="text-sm text-gray-500">$9.99/month</p>
            </button>
            <button
              type="button"
              onClick={() => setSelectedPlan('yearly')}
              className={`p-4 rounded-lg border-2 text-left transition-colors ${selectedPlan === 'yearly' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <p className="font-semibold text-gray-900">Yearly</p>
              <p className="text-sm text-gray-500">$99/year</p>
              <p className="text-xs text-primary-700 mt-1">Save {yearlySavings}</p>
            </button>
          </div>
          <p className="text-sm text-gray-500">You will be redirected to Stripe Checkout to complete payment securely.</p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowSubscribeModal(false)}>Close</Button>
            <Button loading={checkoutLoading} onClick={handleStartCheckout}>Continue to Checkout</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showChangePlanModal}
        onClose={() => setShowChangePlanModal(false)}
        title="Change your plan"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Plan changes and billing history are managed in Stripe's customer portal.</p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowChangePlanModal(false)}>Close</Button>
            <Button loading={portalLoading} onClick={openBillingPortal}>Open Billing Portal</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel subscription"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">You can cancel your subscription securely in the Stripe billing portal.</p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowCancelModal(false)}>Keep Subscription</Button>
            <Button variant="danger" loading={portalLoading} onClick={openBillingPortal}>Continue to Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
