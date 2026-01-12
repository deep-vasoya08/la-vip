/**
 * Utility functions for handling timezone conversions, especially for America/Los_Angeles (PST/PDT)
 * Properly handles Daylight Saving Time transitions
 */

/**
 * Create a Date object for a specific date and time in LA timezone (America/Los_Angeles)
 * This properly handles DST transitions
 *
 * @param year - Full year (e.g., 2024)
 * @param month - Month (0-11, where 0 is January)
 * @param day - Day of month (1-31)
 * @param hours - Hours in 24-hour format (0-23)
 * @param minutes - Minutes (0-59)
 * @returns Date object representing that moment in UTC
 */
export function createLATimeDate(
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number,
): Date {
  // Create an ISO string representing the LA local time
  const laLocalTimeStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`

  // Parse this string to get a date (will be in server's local timezone)
  const localDate = new Date(laLocalTimeStr)

  // Get what time it would be in LA timezone
  const laTimeStr = localDate.toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  // Parse the LA time string
  const laMatch = laTimeStr.match(/(\d+)\/(\d+)\/(\d+),\s+(\d+):(\d+):(\d+)/)

  if (!laMatch) {
    // Fallback: return the local date
    console.warn('Failed to parse LA time string, using fallback')
    return localDate
  }

  const [, m, d, y, h, min, s] = laMatch

  // Calculate the difference between what we wanted and what we got
  const wantedHours = hours
  const wantedMinutes = minutes
  const gotHours = parseInt(h || '0')
  const gotMinutes = parseInt(min || '0')

  // Calculate the offset in milliseconds
  const hoursDiff = wantedHours - gotHours
  const minutesDiff = wantedMinutes - gotMinutes
  const offsetMs = (hoursDiff * 60 + minutesDiff) * 60 * 1000

  // Apply the correction
  return new Date(localDate.getTime() + offsetMs)
}

/**
 * Get the current timezone abbreviation for LA (PST or PDT) for a given date
 *
 * @param date - The date to check
 * @returns 'PST' or 'PDT'
 */
export function getLATimezoneAbbr(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    timeZoneName: 'short',
  })

  const parts = formatter.formatToParts(date)
  const timezonePart = parts.find((part) => part.type === 'timeZoneName')

  return timezonePart ? timezonePart.value : 'PST'
}

/**
 * Check if a date falls within DST for America/Los_Angeles timezone
 *
 * @param date - The date to check
 * @returns true if the date is during DST (PDT), false if during standard time (PST)
 */
export function isLATimeInDST(date: Date): boolean {
  const abbr = getLATimezoneAbbr(date)
  return abbr === 'PDT'
}

/**
 * Format a date with the correct LA timezone abbreviation (PST or PDT)
 *
 * @param date - The date to format
 * @param includeTime - Whether to include the time
 * @returns Formatted string with correct timezone abbreviation
 */
export function formatDateWithLATimezone(date: Date, includeTime: boolean = true): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }

  if (includeTime) {
    options.hour = '2-digit'
    options.minute = '2-digit'
    options.hour12 = true
  }

  const formatted = new Intl.DateTimeFormat('en-US', options).format(date)
  const tzAbbr = getLATimezoneAbbr(date)

  return `${formatted} ${tzAbbr}`
}
