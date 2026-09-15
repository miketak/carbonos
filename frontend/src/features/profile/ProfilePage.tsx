import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { AppHeader } from '../../components/AppHeader'
import { Button } from '../../components/Button'
import { InputField } from '../../components/Field'
import { GlassCard } from '../../components/GlassCard'
import { Skeleton } from '../../components/Skeleton'
import { useToast } from '../../components/toast'
import { fieldErrors, problemDetail } from '../../lib/api'
import { useAvatarQuery, useProfileQuery, useUpdateProfile, useUploadAvatar } from './useProfile'

/** Self-service profile: display name and profile picture. */
export function ProfilePage() {
  const toast = useToast()
  const profileQuery = useProfileQuery()
  const profile = profileQuery.data

  const update = useUpdateProfile()
  const avatarUpload = useUploadAvatar()

  const [displayName, setDisplayName] = useState<string | null>(null)
  const avatarInput = useRef<HTMLInputElement>(null)

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

  const banner = problemDetail(update.error) ?? problemDetail(avatarUpload.error)

  return (
    <div className="min-h-screen">
      <AppHeader />

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
                    className="size-20 rounded-full object-cover ring-2 ring-white shadow-[0_2px_12px_rgba(9,168,149,0.28)]"
                  />
                ) : (
                  <div
                    aria-hidden
                    className="flex size-20 items-center justify-center rounded-full bg-teal/15 text-2xl font-bold text-link ring-2 ring-white shadow-[0_2px_12px_rgba(9,168,149,0.28)]"
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
                  <p className="text-xs text-ink-muted">PNG, JPEG, or WebP · up to 5 MB</p>
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
            </>
          )}
        </GlassCard>
      </main>
    </div>
  )
}
