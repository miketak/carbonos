import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/Button'
import { InputField } from '../../components/Field'
import { GlassCard } from '../../components/GlassCard'
import { Skeleton } from '../../components/Skeleton'
import { useToast } from '../../components/toast'
import { fieldErrors, problemDetail } from '../../lib/api'
import { useLogout } from '../auth/useLogout'
import {
  useAvatarQuery,
  useProfileQuery,
  useUpdateProfile,
  useUploadAvatar,
  useUploadResume,
} from './useProfile'

/** Self-service profile: display name plus avatar and resume uploads. */
export function ProfilePage() {
  const toast = useToast()
  const signOut = useLogout()
  const profileQuery = useProfileQuery()
  const profile = profileQuery.data

  const update = useUpdateProfile()
  const avatarUpload = useUploadAvatar()
  const resumeUpload = useUploadResume()

  const [displayName, setDisplayName] = useState<string | null>(null)
  const avatarInput = useRef<HTMLInputElement>(null)
  const resumeInput = useRef<HTMLInputElement>(null)

  const avatarQuery = useAvatarQuery(!!profile?.hasAvatar)
  const avatarBlob = avatarQuery.data
  const avatarUrl = useMemo(
    () => (avatarBlob ? URL.createObjectURL(avatarBlob) : undefined),
    [avatarBlob],
  )
  useEffect(() => {
    return () => {
      if (avatarUrl) URL.revokeObjectURL(avatarUrl)
    }
  }, [avatarUrl])

  function saveDisplayName(event: FormEvent) {
    event.preventDefault()
    update.mutate(
      { displayName: displayName ?? profile?.displayName ?? '' },
      { onSuccess: () => toast('Profile updated') },
    )
  }

  function pickAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) avatarUpload.mutate(file, { onSuccess: () => toast('Profile picture updated') })
  }

  function pickResume(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) resumeUpload.mutate(file, { onSuccess: () => toast('Resume uploaded') })
  }

  const banner =
    problemDetail(update.error) ??
    problemDetail(avatarUpload.error) ??
    problemDetail(resumeUpload.error)

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-mint via-soft-mint to-bright-teal/15">
      <header className="sticky top-0 z-40 border-b border-white/50 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <p className="bg-gradient-to-r from-teal to-accent-green bg-clip-text text-lg font-bold text-transparent">
            ECORIV <span className="text-dark-teal">CarbonOS</span>
          </p>
          <div className="flex items-center gap-3">
            <Link to="/app" className="text-sm text-dark-teal/70 hover:text-dark-teal">
              Home
            </Link>
            <Button
              variant="ghost"
              className="px-3 py-1.5 text-sm"
              onClick={() => signOut.mutate()}
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl justify-center px-6 py-16">
        <GlassCard className="w-full max-w-lg p-10">
          <h1 className="text-2xl">Edit profile</h1>

          {profileQuery.isPending && <Skeleton className="mt-6 h-64" />}

          {profile && (
            <>
              {banner && (
                <p
                  role="alert"
                  className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700"
                >
                  {banner}
                </p>
              )}

              <section className="mt-6 flex items-center gap-5">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile picture"
                    className="size-20 rounded-full border border-white/60 object-cover"
                  />
                ) : (
                  <div
                    aria-hidden
                    className="flex size-20 items-center justify-center rounded-full bg-teal/15 text-2xl font-bold text-teal"
                  >
                    {profile.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <Button
                    variant="ghost"
                    className="px-3 py-1.5 text-sm"
                    busy={avatarUpload.isPending}
                    onClick={() => avatarInput.current?.click()}
                  >
                    {profile.hasAvatar ? 'Change picture' : 'Upload picture'}
                  </Button>
                  <p className="text-xs text-dark-teal/60">PNG, JPEG, or WebP · up to 5 MB</p>
                  {fieldErrors(avatarUpload.error)?.file && (
                    <p role="alert" className="text-xs font-medium text-red-600">
                      {fieldErrors(avatarUpload.error)?.file}
                    </p>
                  )}
                </div>
                <input
                  ref={avatarInput}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={pickAvatar}
                  aria-label="Profile picture file"
                />
              </section>

              <form noValidate onSubmit={saveDisplayName} className="mt-8 flex flex-col gap-4">
                <InputField label="Email" value={profile.email} disabled />
                <InputField
                  label="Display name"
                  value={displayName ?? profile.displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  error={fieldErrors(update.error)?.displayName}
                  required
                />
                <Button type="submit" busy={update.isPending} className="self-start">
                  Save changes
                </Button>
              </form>

              <section className="mt-8 border-t border-teal/10 pt-6">
                <h2 className="text-sm font-semibold tracking-wide text-dark-teal/80 uppercase">
                  Resume
                </h2>
                <div className="mt-3 flex items-center justify-between gap-4">
                  {profile.hasResume ? (
                    <a
                      href="/api/profile/resume"
                      download={profile.resumeFilename ?? undefined}
                      className="truncate text-sm font-medium text-teal hover:text-bright-teal"
                    >
                      {profile.resumeFilename ?? 'Download resume'}
                    </a>
                  ) : (
                    <p className="text-sm text-dark-teal/60">No resume uploaded</p>
                  )}
                  <Button
                    variant="ghost"
                    className="shrink-0 px-3 py-1.5 text-sm"
                    busy={resumeUpload.isPending}
                    onClick={() => resumeInput.current?.click()}
                  >
                    {profile.hasResume ? 'Replace' : 'Upload'}
                  </Button>
                </div>
                <p className="mt-1.5 text-xs text-dark-teal/60">PDF or PSD · up to 50 MB</p>
                {fieldErrors(resumeUpload.error)?.file && (
                  <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                    {fieldErrors(resumeUpload.error)?.file}
                  </p>
                )}
                <input
                  ref={resumeInput}
                  type="file"
                  accept=".pdf,.psd,application/pdf"
                  className="hidden"
                  onChange={pickResume}
                  aria-label="Resume file"
                />
              </section>
            </>
          )}
        </GlassCard>
      </main>
    </div>
  )
}
