'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface CalendarProps {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
  className?: string
  defaultMonth?: Date
}

function Calendar({
  selected,
  onSelect,
  disabled,
  className = '',
  defaultMonth = new Date(),
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(defaultMonth)

  // Get the first day of the month and number of days
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  const firstDayWeekday = firstDayOfMonth.getDay() // 0 = Sunday, 1 = Monday, etc.

  // Generate calendar days
  const calendarDays = []

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayWeekday; i++) {
    calendarDays.push(null)
  }

  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    calendarDays.push(date)
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const handleDateClick = (date: Date) => {
    if (disabled && disabled(date)) return
    onSelect?.(date)
  }

  const isSelected = (date: Date) => {
    return (
      selected &&
      date.getDate() === selected.getDate() &&
      date.getMonth() === selected.getMonth() &&
      date.getFullYear() === selected.getFullYear()
    )
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const isDisabled = (date: Date) => {
    return disabled ? disabled(date) : false
  }

  const isAvailable = (date: Date) => {
    return disabled ? !disabled(date) : true
  }

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className={`calendar ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-light-gray rounded-lg transition-transform duration-200 text-gray hover:text-mustard"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <h2 className="text-base font-semibold text-gray">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>

        <button
          type="button"
          onClick={goToNextMonth}
          className="p-2 hover:bg-light-gray rounded-lg transition-transform duration-200 text-gray hover:text-mustard"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-3">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-mild-gray py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => (
          <div key={index} className="min-h-[40px] flex flex-col items-center justify-center">
            {date ? (
              <div className="relative">
                <button
                  onClick={() => handleDateClick(date)}
                  disabled={isDisabled(date)}
                  className={`
                    w-8 h-8 rounded-lg text-sm font-medium transition-transform duration-200 relative
                    flex items-center justify-center
                    ${
                      isSelected(date)
                        ? 'bg-mustard text-black shadow-lg transform scale-110 border-2 border-white'
                        : isToday(date)
                          ? 'bg-light-gray text-gray font-bold border-2 border-mustard/30'
                          : isDisabled(date)
                            ? 'text-mild-gray cursor-not-allowed opacity-50'
                            : 'text-gray hover:bg-light-gray hover:border-2 hover:border-mustard/20'
                    }
                  `}
                >
                  {date.getDate()}
                </button>
                {/* Mustard dot for available dates */}
                {isAvailable(date) && !isDisabled(date) && !isSelected(date) && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-mustard rounded-full shadow-sm"></div>
                )}
              </div>
            ) : (
              <div className="w-8 h-8" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

Calendar.displayName = 'Calendar'

export { Calendar }
