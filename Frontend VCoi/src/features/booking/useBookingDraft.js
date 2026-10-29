import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import useUnsavedChanges from '../navigation/useUnsavedChanges'
import { z } from 'zod'
import { bookingSchema } from './schema'
import { optionalLocation } from '../maps/location'

const valuesSchema = z.object({
  contactName: z.string(),
  contactPhone: z.string(),
  addressLine: z.string(),
  ward: z.string(),
  district: z.string(),
  province: z.string(),
  location: optionalLocation,
  pickupStart: z.string(),
  pickupEnd: z.string(),
  sellerNote: z.string(),
  items: z
    .array(
      z.object({
        materialId: z.string(),
        estimatedQty: z.string(),
        note: z.string(),
      }),
    )
    .min(1)
    .max(50),
})
export default function useBookingDraft(user) {
  const client = useQueryClient()
  const key = useMemo(() => ['private', user.id, 'CUSTOMER', 'booking-draft'], [user.id])
  const stopped = useRef(false)
  const [initial] = useState(() => {
    const saved = client.getQueryData(key)
    const parsed = valuesSchema.safeParse(saved?.values)
    return saved?.ownerId === user.id && parsed.success ? parsed.data : null
  })
  const [restored, setRestored] = useState(Boolean(initial))
  const form = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: initial || {
      contactName: user.fullName,
      contactPhone: user.phone,
      addressLine: '',
      ward: '',
      district: '',
      province: '',
      location: null,
      pickupStart: '',
      pickupEnd: '',
      sellerNote: '',
      items: [{ materialId: '', estimatedQty: '', note: '' }],
    },
  })
  const {
    subscribe,
    formState: { isDirty },
  } = form
  const protection = useUnsavedChanges(isDirty || restored, 'Lịch thu gom')
  useEffect(() => {
    client.setQueryDefaults(key, { gcTime: Infinity })
    return subscribe({
      formState: { values: true, isDirty: true },
      callback: ({ values, isDirty: changed }) => {
        const actor = client.getQueryData(['session'])
        if (stopped.current || actor?.id !== user.id || actor?.role !== 'CUSTOMER') return
        if (!changed && !restored) {
          client.removeQueries({ queryKey: key, exact: true })
          return
        }
        const parsed = valuesSchema.safeParse(values)
        if (parsed.success)
          client.setQueryData(key, { ownerId: user.id, values: structuredClone(parsed.data) })
      },
    })
  }, [client, key, user.id, subscribe, restored])
  function clear() {
    protection.clear()
    stopped.current = true
    client.removeQueries({ queryKey: key, exact: true })
    setRestored(false)
  }
  return { form, restored, clear }
}
