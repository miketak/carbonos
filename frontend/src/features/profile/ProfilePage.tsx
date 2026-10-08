import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { AppHeader } from '../../components/AppHeader'
import { Button } from '../../components/Button'
import { InputField, SelectField } from '../../components/Field'
import { Panel } from '../../components/Panel'
import { Skeleton } from '../../components/Skeleton'
import { useToast } from '../../components/toast'
import { fieldErrors, problemDetail } from '../../lib/api'
import { browserDateFormat, dateFormatOptions } from '../../lib/dates'
import type { DateFormat } from '../../lib/dates'
import { ChangePasswordSection } from './ChangePasswordSection'
import {
  useAvatarQuery,
  useProfileQuery,
  useUpdatePreferences,
  useUpdateProfile,
  useUploadAvatar,
} from './useProfile'

/** Self-service profile: display name, profile picture, password (spec 01.9) and the date format (spec 01.10). */
export function ProfilePage() {
  const toast = useToast()
  const profileQuery = useProfileQuery()
  const profile = profileQuery.data

  const update = useUpdateProfile()
  const avatarUpload = useUploadAvatar()
  const preferences = useUpdatePreferences()

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

  function pickDateFormat(event: ChangeEvent<HTMLSelectElement>) {
    preferences.mutate(
      { dateFormat: event.target.value as DateFormat },
      { onSuccess: () => toast('Preferences updated') },
    )
  }

  const banner =
    problemDetail(update.error) ??
    problemDetail(avatarUpload.error) ??
    problemDetail(preferences.error)

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="mx-auto flex max-w-5xl justify-center px-6 py-16">
        <Panel className="w-full max-w-lg p-8">
          <h1 className="text-2xl">Edit profile</h1>

          {profileQuery.isPending && <Skeleton className="mt-6 h-64" />}

          {profile && (
            <>
              {banner && (
                <p
                  role="alert"
                  className="mt-4 rounded-lg border border-hairline border-l-[3px] border-l-danger-dot bg-surface px-4 py-3 text-sm text-danger"
                >
                  {banner}
                </p>
              )}

              <section className="mt-6 flex items-center gap-5">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile picture"
                    className="size-20 rounded-full object-cover ring-1 ring-hairline"
                  />
                ) : (
                  <div
                    aria-hidden
                    className="flex size-20 items-center justify-center rounded-full bg-surface-sunken text-2xl font-semibold text-ink ring-1 ring-hairline"
                  >
                    {profile.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    busy={avatarUpload.isPending}
                    onClick={() => avatarInput.current?.click()}
                  >
                    {profile.hasAvatar ? 'Change picture' : 'Upload picture'}
                  </Button>
                  <p className="text-xs text-ink-muted">PNG, JPEG, or WebP · up to 5 MB</p>
                  {fieldErrors(avatarUpload.error)?.file && (
                    <p role="alert" className="text-xs font-medium text-danger">
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

              <section className="mt-10 flex flex-col gap-4">
                <h2 className="text-lg">Preferences</h2>
                <SelectField
                  label="Date format"
                  value={profile.dateFormat ?? browserDateFormat()}
                  onChange={pickDateFormat}
                  disabled={preferences.isPending}
                  hint={
                    profile.dateFormat
                      ? 'Every date in CarbonOS and in the files you download follows this.'
                      : 'Following your browser until you choose. Every date in CarbonOS and in the files you download follows this.'
                  }
                  error={fieldErrors(preferences.error)?.dateFormat}
                >
                  {dateFormatOptions().map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectField>
              </section>

              <ChangePasswordSection />
            </>
          )}
        </Panel>
      </main>
    </div>
  )
}
