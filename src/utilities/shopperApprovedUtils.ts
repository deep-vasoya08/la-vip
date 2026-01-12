import { createShopperApprovedFollowup } from '@/lib/shopperApproved'

interface FollowupInput {
  orderId: string
  customerEmail: string
  customerName?: string
  productLabel: string // e.g., "Event Name - 09/22/2025, 07:30 PM"
  serviceDateISO: string // original service date in ISO
}

function formatProductLabel(name: string, dateISO: string): string {
  const dt = new Date(dateISO)
  // Use UTC string for the product timestamp representation
  const utc = dt.toUTCString() // e.g., Wed, 24 Sep 2025 02:00:00 GMT
  return `${name} - ${utc}`
}

export function buildProductLabel(name: string, dateISO: string): string {
  return formatProductLabel(name, dateISO)
}

export async function scheduleShopperApprovedFollowup(input: FollowupInput): Promise<{
  success: boolean
  review_id?: number
  error?: string
}> {
  const { orderId, customerEmail, customerName, productLabel, serviceDateISO } = input

  // Determine follow-up date:
  // - If SHOPPER_FOLLOWUP_SCHEDULE_HOURS is set, use serviceDate + N hours
  // - Otherwise default to next calendar day (UTC) after service date
  const followupStr = computeFollowupDateYMD(serviceDateISO)

  const resp = await createShopperApprovedFollowup({
    orderId,
    email: customerEmail,
    name: customerName,
    followup: followupStr, // here use this format YYYY-MM-DD
    products: productLabel,
  })

  if (!resp.success) return { success: false, error: resp.error }
  return { success: true, review_id: resp.review_id }
}

type BookingKind = 'event' | 'tour'

interface ScheduleFollowupForBookingInput {
  kind: BookingKind
  booking: any
  followupOffsetHours?: number
  test?: boolean
  override?: {
    orderId?: string
    customerEmail?: string
    customerName?: string
    productLabel?: string
    serviceDateISO?: string
  }
}

export async function scheduleFollowupForBooking(input: ScheduleFollowupForBookingInput): Promise<{
  success: boolean
  review_id?: number
  error?: string
}> {
  const { kind, booking, override } = input

  let orderId =
    override?.orderId ??
    (kind === 'tour' ? `tour-${String(booking?.id)}` : `event-${String(booking?.id)}`)

  const userObj: any = typeof booking?.user === 'object' ? booking.user : null
  const customerEmail: string | undefined = override?.customerEmail ?? userObj?.email
  const customerName: string | undefined = override?.customerName ?? userObj?.name ?? userObj?.email

  let productLabel = override?.productLabel
  let serviceDateISO = override?.serviceDateISO

  if (!productLabel || !serviceDateISO) {
    if (kind === 'event') {
      const eventObj: any = typeof booking?.event === 'object' ? booking.event : null
      const eventName: string = eventObj?.name || 'Event'
      const scheduleId: string | undefined = booking?.scheduleId
      let scheduleDate: string | undefined
      if (eventObj && Array.isArray(eventObj.schedules)) {
        const schedule = eventObj.schedules.find((s: any) => s?.id === scheduleId)
        scheduleDate = schedule?.event_date_time
      }
      serviceDateISO = serviceDateISO ?? scheduleDate
      productLabel =
        productLabel ?? (serviceDateISO ? buildProductLabel(eventName, serviceDateISO) : undefined)

      orderId = eventName + '-' + orderId
    } else if (kind === 'tour') {
      const tourObj: any = typeof booking?.tour === 'object' ? booking.tour : null
      const tourName: string = tourObj?.name || 'Tour'
      const scheduleDate: string | undefined = booking?.scheduledDate
      serviceDateISO = serviceDateISO ?? scheduleDate
      productLabel =
        productLabel ?? (serviceDateISO ? buildProductLabel(tourName, serviceDateISO) : undefined)
      orderId = tourName + '-' + orderId
    }
  }

  if (!orderId || !customerEmail || !serviceDateISO || !productLabel) {
    return { success: false, error: 'Missing required fields to schedule follow-up' }
  }

  const res = await scheduleShopperApprovedFollowup({
    orderId,
    customerEmail,
    customerName,
    productLabel,
    serviceDateISO,
  })

  return res
}

/**
 * Compute a YYYY-MM-DD (UTC) follow-up date string based on a service date.
 *
 * Behavior:
 * - If hoursOffset is provided and > 0, returns serviceDate + hoursOffset in UTC (YYYY-MM-DD).
 * - Else if process.env.SHOPPER_FOLLOWUP_SCHEDULE_HOURS is a positive number, uses that offset.
 * - Else returns the next UTC calendar day after the service date (00:00:00 UTC) in YYYY-MM-DD.
 */
export function computeFollowupDateYMD(serviceDateISO: string, hoursOffset?: number): string {
  const serviceDate = new Date(serviceDateISO)

  const envHoursRaw = process.env.SHOPPER_FOLLOWUP_SCHEDULE_HOURS
  const envHours = envHoursRaw !== undefined ? Number(envHoursRaw) : NaN

  const effectiveHours =
    typeof hoursOffset === 'number' && hoursOffset > 0
      ? hoursOffset
      : !Number.isNaN(envHours) && envHours > 0
        ? envHours
        : undefined

  if (effectiveHours && effectiveHours > 0) {
    const byHours = new Date(serviceDate.getTime() + effectiveHours * 60 * 60 * 1000)
    const y = byHours.getUTCFullYear()
    const m = String(byHours.getUTCMonth() + 1).padStart(2, '0')
    const d = String(byHours.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const nextDayUTC = new Date(
    Date.UTC(
      serviceDate.getUTCFullYear(),
      serviceDate.getUTCMonth(),
      serviceDate.getUTCDate() + 1,
      0,
      0,
      0,
    ),
  )
  const y = nextDayUTC.getUTCFullYear()
  const m = String(nextDayUTC.getUTCMonth() + 1).padStart(2, '0')
  const d = String(nextDayUTC.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
