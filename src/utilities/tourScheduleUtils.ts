import { RRule } from 'rrule/dist/esm/index.js'
import { addMonths, startOfDay, endOfDay, isAfter, isBefore } from 'date-fns'

/**
 * Interface for tour schedule configuration
 */
export interface TourScheduleConfig {
  tour_start_time: string // Time only, e.g., "09:00:00.000Z"
  tour_start_date?: string // Date when tour becomes available
  recurrence_rule: string // RRULE string
  booking_window_months: number
  schedule_notes?: string
}

/**
 * Interface for generated tour date
 */
export interface GeneratedTourDate {
  id: string // Generated unique ID for this occurrence
  tour_date_time: string // Full ISO date-time string
  formatted_date: string // Human readable date
  formatted_time: string // Human readable time
}

/**
 * Generate available tour dates based on RRULE and booking window
 */
export function generateTourDates(config: TourScheduleConfig): GeneratedTourDate[] {
  try {
    const { tour_start_time, tour_start_date, recurrence_rule, booking_window_months } = config

    // Parse the time from the tour_start_time using UTC methods to avoid timezone issues
    const timeDate = new Date(tour_start_time)
    const hours = timeDate.getUTCHours()
    const minutes = timeDate.getUTCMinutes()

    // Calculate date range
    const today = startOfDay(new Date())
    const tourStartDate = tour_start_date ? startOfDay(new Date(tour_start_date)) : today
    const startDate = isAfter(tourStartDate, today) ? tourStartDate : today
    const endDate = endOfDay(addMonths(startDate, booking_window_months))

    // Parse RRULE
    const rule = RRule.fromString(recurrence_rule)

    // Generate dates within the booking window
    const occurrences = rule.between(startDate, endDate, true)

    // Convert to our format
    const generatedDates: GeneratedTourDate[] = occurrences.map((date, index) => {
      // Set the time for this occurrence using UTC methods to avoid DST issues
      const tourDateTime = new Date(date)
      tourDateTime.setUTCHours(hours, minutes, 0, 0)

      // Generate a unique ID for this occurrence
      const id = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

      return {
        id,
        tour_date_time: tourDateTime.toISOString(), // Use ISO format for consistency
        formatted_date: date.toISOString(),
        formatted_time: tourDateTime.toISOString(),
      }
    })

    return generatedDates
  } catch (error) {
    console.error('Error generating tour dates:', error)
    return []
  }
}

/**
 * Check if a specific date is available for booking
 */
export function isTourDateAvailable(date: Date, config: TourScheduleConfig): boolean {
  try {
    const { recurrence_rule, booking_window_months } = config

    // Check if date is within booking window
    const today = startOfDay(new Date())
    const endDate = endOfDay(addMonths(today, booking_window_months))

    if (isBefore(date, today) || isAfter(date, endDate)) {
      return false
    }

    // Check if date matches RRULE
    const rule = RRule.fromString(recurrence_rule)
    const occurrences = rule.between(startOfDay(date), endOfDay(date), true)

    return occurrences.length > 0
  } catch (error) {
    console.error('Error checking tour date availability:', error)
    return false
  }
}

/**
 * Common RRULE examples for reference
 */
export const RRULE_EXAMPLES = {
  DAILY: 'FREQ=DAILY',
  WEEKDAYS: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
  WEEKENDS: 'FREQ=WEEKLY;BYDAY=SA,SU',
  TUESDAYS_THURSDAYS: 'FREQ=WEEKLY;BYDAY=TU,TH',
  MONTHLY_FIRST_FRIDAY: 'FREQ=MONTHLY;BYDAY=1FR',
  EVERY_OTHER_DAY: 'FREQ=DAILY;INTERVAL=2',
}

/**
 * Convert tour schedule config to legacy schedule format for backward compatibility
 */
export function convertToLegacySchedules(config: TourScheduleConfig) {
  const generatedDates = generateTourDates(config)

  return generatedDates.map((date) => ({
    id: date.id,
    tour_date_time: date.tour_date_time,
    schedule_notes: config.schedule_notes || '',
  }))
}

/**
 * Format RRULE for human reading
 */
export function formatRRuleDescription(rrule: string): string {
  try {
    const rule = RRule.fromString(rrule)
    return rule.toText()
  } catch (error) {
    return rrule
  }
}
