'use client'

import React, { useState, useEffect } from 'react'
import {
  Button,
  LoadingOverlay,
  Select,
  FieldLabel,
  DatePicker,
  useSelection,
  toast,
} from '@payloadcms/ui'

interface Tour {
  id: string
  name: string
  tour_type: string
  status: string
  duration: string
}

interface FilterOptions {
  selectedTourId: string
  dateFrom: string
  dateTo: string
  bookingStatus: string
}

export const TourBookingsList: React.FC = () => {
  const selectionCtx: unknown = useSelection()
  const getSelectedIds = (): (string | number)[] => {
    const ctx = selectionCtx as
      | {
          selection?: (string | number)[]
          selected?: (string | number)[]
          getSelected?: () => (string | number)[]
        }
      | undefined
    if (ctx?.selection && Array.isArray(ctx.selection)) return ctx.selection
    if (ctx?.selected && Array.isArray(ctx.selected)) return ctx.selected
    if (typeof ctx?.getSelected === 'function') {
      const ids = ctx.getSelected()
      if (Array.isArray(ids) && ids.length) return ids
    }
    try {
      const selected: (string | number)[] = []
      const checkboxes = Array.from(
        document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked'),
      )
      for (const cb of checkboxes) {
        const rowEl =
          cb.closest('[data-row-id]') ||
          cb.closest('[data-id]') ||
          cb.closest('[data-collection-document-id]') ||
          cb.closest('tr')
        let id: string | null = null
        if (rowEl) {
          id =
            (rowEl as HTMLElement).getAttribute('data-row-id') ||
            (rowEl as HTMLElement).getAttribute('data-id') ||
            (rowEl as HTMLElement).getAttribute('data-collection-document-id') ||
            null
          if (!id) {
            const anchor = rowEl.querySelector<HTMLAnchorElement>('a[href*="/admin/collections/"]')
            if (anchor?.href) {
              const parts = anchor.href.split('/').filter(Boolean)
              id = parts[parts.length - 1] || null
            }
          }
        }
        if (!id && cb.value) id = cb.value
        if (id) {
          const numeric = Number(id)
          selected.push(Number.isNaN(numeric) ? id : numeric)
        }
      }
      if (selected.length) return selected
    } catch {}
    return []
  }
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(false)
  const [resendingEmails, setResendingEmails] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    selectedTourId: 'all',
    dateFrom: '',
    dateTo: '',
    bookingStatus: 'all',
  })

  // Fetch tours when drawer opens
  useEffect(() => {
    if (isDrawerOpen) {
      fetchTours()
    }
  }, [isDrawerOpen])

  const fetchTours = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/get-booking-tours?all=true')
      const data = await response.json()
      if (data.success) {
        setTours(data.tours)
      }
    } catch (error) {
      console.error('Error fetching tours:', error)
    }
    setLoading(false)
  }

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    console.log('handleFilterChange called:', key, value)
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value }
      console.log('new filters:', newFilters)
      return newFilters
    })
  }

  const handleExportReport = () => {
    // Build query parameters from filters
    const queryParams = new URLSearchParams()

    if (filters.selectedTourId && filters.selectedTourId !== 'all')
      queryParams.append('tourId', filters.selectedTourId)
    if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom)
    if (filters.dateTo) queryParams.append('dateTo', filters.dateTo)
    if (filters.bookingStatus && filters.bookingStatus !== 'all')
      queryParams.append('bookingStatus', filters.bookingStatus)

    const exportUrl = `/api/tour-bookings/export?${queryParams.toString()}`
    console.log('Exporting tour bookings report with filters:', filters)

    // Trigger download of filtered CSV file
    window.open(exportUrl, '_blank')
    setIsDrawerOpen(false)
  }

  const resetFilters = () => {
    setFilters({
      selectedTourId: 'all',
      dateFrom: '',
      dateTo: '',
      bookingStatus: 'all',
    })
  }

  const handleResendEmails = async () => {
    const selectedIds = getSelectedIds()
    if (!selectedIds || selectedIds.length === 0) {
      toast.error('Please select at least one booking from the table to resend email')
      return
    }
    setResendingEmails(true)
    const toastId = toast.loading('Resending booking emails...')
    try {
      const response = await fetch('/api/tour-bookings/resend-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingIds: selectedIds }),
      })
      const data = await response.json()
      if (response.ok && data?.success) {
        const successCount = data.summary?.successful ?? 0
        const failCount = data.summary?.failed ?? 0
        if (failCount > 0) {
          console.error('Failed emails:', data.errors)
          toast.error(`Sent ${successCount} email(s). ${failCount} failed.`)
        } else {
          toast.success(`Successfully resent ${successCount} email(s)`)
        }
      } else {
        const message =
          data?.error ||
          (data?.summary
            ? `Some emails failed (${data.summary.failed} failed).`
            : 'Failed to resend emails.')
        toast.error(message)
      }
    } catch (err) {
      console.error('Error resending tour emails:', err)
      toast.error('An error occurred while resending emails. Please try again.')
    } finally {
      toast.dismiss(toastId)
      setResendingEmails(false)
    }
  }

  return (
    <>
      <style jsx>{`
        .payload-drawer-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 1000;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .payload-drawer-overlay.open {
          opacity: 1;
        }

        .payload-drawer {
          position: fixed;
          top: 0;
          right: 0;
          height: 100vh;
          width: 500px;
          max-width: 90vw;
          background: var(--theme-bg);
          border-left: 1px solid var(--theme-elevation-200);
          box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
          transform: translateX(100%);
          transition: transform 0.3s ease;
          z-index: 1001;
          overflow-y: auto;
        }

        .payload-drawer.open {
          transform: translateX(0);
        }

        .payload-field {
          margin-bottom: 20px;
        }

        .payload-card {
          background: var(--theme-elevation-50);
          border: 1px solid var(--theme-elevation-200);
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .payload-header {
          padding: 24px;
          border-bottom: 1px solid var(--theme-elevation-200);
          background: var(--theme-elevation-0);
        }

        .payload-content {
          padding: 24px;
          background: var(--theme-bg);
        }

        .payload-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .payload-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-top: 1px solid var(--theme-elevation-200);
          background: var(--theme-elevation-0);
        }

        .export-trigger {
          display: flex;
          justify-content: flex-end;
          margin: 0px;
          gap: 8px;
        }
      `}</style>

      {/* Export + Resend Buttons */}
      <div className="export-trigger">
        <Button
          onClick={() => setIsDrawerOpen(true)}
          className="payload-Button margin-0 margin-block-0"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7,10 12,15 17,10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export Tour Bookings Report
        </Button>
        <Button
          onClick={handleResendEmails}
          disabled={resendingEmails}
          className="payload-Button margin-0 margin-block-0"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
          </svg>
          {resendingEmails ? 'Resending...' : 'Resend Booking Emails'}
        </Button>
      </div>

      {/* Drawer Overlay */}
      {isDrawerOpen && (
        <div
          className={`payload-drawer-overlay ${isDrawerOpen ? 'open' : ''}`}
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Drawer */}
      <div className={`payload-drawer ${isDrawerOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="payload-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Export Tour Bookings</h2>
            <Button onClick={() => setIsDrawerOpen(false)} className="close-Button">
              ✕
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="payload-content">
          {loading ? (
            <LoadingOverlay loadingText="Loading tours..." />
          ) : (
            <>
              {/* Tour Selection */}
              <div className="payload-field">
                <FieldLabel label="Select Tour" />
                <Select
                  value={(() => {
                    const allOptions = [
                      { label: 'All Tours', value: 'all' },
                      ...tours.map((tour) => ({
                        label: `${tour.name}${tour.tour_type ? ` - ${tour.tour_type}` : ''}`,
                        value: tour.id,
                      })),
                    ]
                    const foundOption = allOptions.find(
                      (option) => String(option.value) === filters.selectedTourId,
                    )
                    console.log(
                      'Looking for selectedTourId:',
                      filters.selectedTourId,
                      'type:',
                      typeof filters.selectedTourId,
                    )
                    console.log(
                      'Available options:',
                      allOptions.map((o) => ({ value: o.value, type: typeof o.value })),
                    )
                    console.log('Found option:', foundOption)
                    return foundOption || allOptions[0]
                  })()}
                  onChange={(option) => {
                    console.log(
                      'option',
                      option,
                      'value:',
                      Array.isArray(option) ? option[0]?.value : (option as any)?.value,
                    )
                    if (
                      Array.isArray(option) &&
                      option.length > 0 &&
                      (option[0] as any)?.value !== undefined
                    ) {
                      handleFilterChange('selectedTourId', String((option[0] as any).value))
                    } else if (!Array.isArray(option) && (option as any)?.value !== undefined) {
                      handleFilterChange('selectedTourId', String((option as any).value))
                    } else {
                      handleFilterChange('selectedTourId', 'all')
                    }
                  }}
                  options={[
                    { label: 'All Tours', value: 'all' },
                    ...tours.map((tour) => ({
                      label: `${tour.name}${tour.tour_type ? ` - ${tour.tour_type}` : ''}`,
                      value: tour.id,
                    })),
                  ]}
                />
              </div>

              {/* Date Range Filter */}
              <div className="payload-grid">
                <div className="payload-field">
                  <FieldLabel label="From Date" />
                  <DatePicker
                    value={filters.dateFrom}
                    onChange={(date) => {
                      const dateString = date ? new Date(date).toISOString().split('T')[0] : ''
                      handleFilterChange('dateFrom', dateString || '')
                    }}
                    placeholder="Select from date"
                  />
                </div>
                <div className="payload-field">
                  <FieldLabel label="To Date" />
                  <DatePicker
                    value={filters.dateTo}
                    onChange={(date) => {
                      const dateString = date ? new Date(date).toISOString().split('T')[0] : ''
                      handleFilterChange('dateTo', dateString || '')
                    }}
                    placeholder="Select to date"
                  />
                </div>
              </div>

              {/* Booking Status Filter */}
              <div className="payload-field">
                <FieldLabel label="Booking Status" />
                <Select
                  value={(() => {
                    const allOptions = [
                      { label: 'All Statuses', value: 'all' },
                      { label: 'Confirmed', value: 'confirmed' },
                      { label: 'Pending', value: 'pending' },
                      { label: 'Cancelled', value: 'cancelled' },
                      { label: 'Completed', value: 'completed' },
                    ]
                    return (
                      allOptions.find((option) => option.value === filters.bookingStatus) ||
                      allOptions[0]
                    )
                  })()}
                  onChange={(option) => {
                    console.log(
                      'booking status option',
                      option,
                      'value:',
                      Array.isArray(option) ? option[0]?.value : (option as any)?.value,
                    )
                    if (
                      Array.isArray(option) &&
                      option.length > 0 &&
                      (option[0] as any)?.value !== undefined
                    ) {
                      handleFilterChange('bookingStatus', String((option[0] as any).value))
                    } else if (!Array.isArray(option) && (option as any)?.value !== undefined) {
                      handleFilterChange('bookingStatus', String((option as any).value))
                    } else {
                      handleFilterChange('bookingStatus', 'all')
                    }
                  }}
                  options={[
                    { label: 'All Statuses', value: 'all' },
                    { label: 'Confirmed', value: 'confirmed' },
                    { label: 'Pending', value: 'pending' },
                    { label: 'Cancelled', value: 'cancelled' },
                    { label: 'Completed', value: 'completed' },
                  ]}
                />
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        {!loading && (
          <div className="payload-actions">
            <Button onClick={resetFilters} className="payload-Button secondary">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 6h18l-2 13H5L3 6z" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Reset Filters
            </Button>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button onClick={() => setIsDrawerOpen(false)} className="payload-Button secondary">
                Cancel
              </Button>
              <Button onClick={handleExportReport} className="payload-Button">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7,10 12,15 17,10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export Report
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default TourBookingsList
