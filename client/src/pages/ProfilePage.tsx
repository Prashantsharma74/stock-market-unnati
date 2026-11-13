import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../app/hooks.ts'
import { Alert } from '../components/ui/Alert.tsx'
import { Badge } from '../components/ui/Badge.tsx'
import { Button } from '../components/ui/Button.tsx'
import { Card } from '../components/ui/Card.tsx'
import { Input } from '../components/ui/Input.tsx'
import { useToast } from '../components/ui/useToast.ts'
import { logout, updateProfile } from '../features/auth/authSlice.ts'
import { ApiError, api, fieldErrors } from '../lib/api.ts'
import { formatDate, formatMobile } from '../lib/format.ts'

const statusCopy = {
  not_started: 'Not started',
  pending: 'Pending',
  verified: 'Verified',
}

export function ProfilePage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const toast = useToast()
  const user = useAppSelector((state) => state.auth.user)
  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [mobile, setMobile] = useState(user?.mobile ?? '')
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth ?? '')
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({})
  const [profileError, setProfileError] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordField, setPasswordField] = useState('')
  const [busy, setBusy] = useState<'profile' | 'password' | null>(null)

  useEffect(() => {
    document.title = 'Profile · Unnati'
  }, [])

  if (!user) return null

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault()
    setBusy('profile')
    setProfileError('')
    setProfileErrors({})
    const result = await dispatch(updateProfile({ fullName, mobile, dateOfBirth }))
    setBusy(null)
    if (updateProfile.fulfilled.match(result)) {
      toast('Profile updated', 'success')
      return
    }
    setProfileError(result.payload?.message ?? 'Unable to save your profile')
    setProfileErrors(result.payload?.fields ?? {})
  }

  const savePassword = async (event: FormEvent) => {
    event.preventDefault()
    setBusy('password')
    setPasswordError('')
    setPasswordField('')
    try {
      await api('/api/users/me/password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      toast('Password updated. Sign in again.', 'success')
      await dispatch(logout())
      navigate('/login')
    } catch (error) {
      setPasswordField(fieldErrors(error).newPassword ?? '')
      setPasswordError(error instanceof ApiError ? error.message : 'Unable to change the password')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="font-display text-4xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Account details for {user.email}. Email stays fixed in this release.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Email</p>
          <p className="mt-2 text-sm font-semibold">{user.emailVerified ? 'Confirmed' : 'Not confirmed'}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">PAN</p>
          <div className="mt-2">
            <Badge>{statusCopy[user.panStatus]}</Badge>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">PAN numbers are not collected until a compliant verification partner is connected.</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">KYC</p>
          <div className="mt-2">
            <Badge>{statusCopy[user.kycStatus]}</Badge>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">KYC status is stored only. No documents are uploaded.</p>
        </Card>
      </div>

      <Card>
        <h2 className="text-base font-semibold">Personal details</h2>
        <p className="mt-1 text-sm text-slate-500">Member since {formatDate(user.createdAt)}. Mobile on file: {formatMobile(user.mobile)}.</p>
        <form className="mt-5 space-y-4" onSubmit={(event) => void saveProfile(event)}>
          {profileError ? <Alert tone="error">{profileError}</Alert> : null}
          <Input label="Full name" name="fullName" value={fullName} error={profileErrors.fullName} onChange={(event) => setFullName(event.target.value)} required />
          <Input label="Mobile" name="mobile" value={mobile} error={profileErrors.mobile} onChange={(event) => setMobile(event.target.value)} required />
          <Input label="Date of birth" name="dateOfBirth" type="date" value={dateOfBirth} error={profileErrors.dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} required />
          <Button type="submit" busy={busy === 'profile'}>
            Save profile
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="text-base font-semibold">Password</h2>
        <p className="mt-1 text-sm text-slate-500">Changing the password signs you out on every device.</p>
        <form className="mt-5 space-y-4" onSubmit={(event) => void savePassword(event)}>
          {passwordError ? <Alert tone="error">{passwordError}</Alert> : null}
          <Input label="Current password" name="currentPassword" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
          <Input label="New password" name="newPassword" type="password" autoComplete="new-password" hint="At least 8 characters, with a letter and a number." value={newPassword} error={passwordField} onChange={(event) => setNewPassword(event.target.value)} required />
          <Button type="submit" variant="secondary" busy={busy === 'password'}>
            Update password
          </Button>
        </form>
      </Card>
    </div>
  )
}
