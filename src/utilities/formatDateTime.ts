import { getLATimezoneAbbr } from './timezoneUtils'

// formatDateTime - Returns date and time in Pacific Time (PST/PDT)
// Automatically detects and displays correct timezone based on daylight saving time
export const formatDateTime = (
  timestamp: string,
  includeTime: boolean = true,
  excludeDate: boolean = false,
  includePST: boolean = true,
  excludeYear: boolean = false,
): string => {
  const now = new Date()
  let date = now

  if (timestamp && timestamp !== 'Not specified') {
    const parsedDate = new Date(timestamp)
    // Check if the parsed date is valid
    if (!isNaN(parsedDate.getTime())) {
      date = parsedDate
    } else {
      console.error('Invalid timestamp provided to formatDateTime:', timestamp)
      // Return a fallback value instead of trying to format invalid date
      return 'Invalid Date'
    }
  }

  // Format options for PST/PDT timezone
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }

  // Add time options if includeTime is true
  if (includeTime) {
    options.hour = '2-digit'
    options.minute = '2-digit'
    options.hour12 = true
  }

  if (excludeDate) {
    options.year = undefined
    options.month = undefined
    options.day = undefined
  }
  if (excludeYear) {
    options.year = undefined
  }

  // Format the date in PST/PDT
  const formattedDate = new Intl.DateTimeFormat('en-US', options).format(date)

  // Dynamically determine if it's PST or PDT based on the date
  const timezoneLabel = includePST ? getLATimezoneAbbr(date) : ''

  return `${formattedDate} ${timezoneLabel}`
}

// export const formatTourDateTime = (timestamp: string): string => {
//   const now = new Date()
//   let date = now

//  return
// }
