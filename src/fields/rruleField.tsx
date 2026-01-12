'use client'
import React, { useState, useEffect } from 'react'
import { useField } from '@payloadcms/ui'

interface RRuleFieldProps {
  path: string
  label?: string
  required?: boolean
}

interface RRuleConfig {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  interval: number
  byDay: string[]
}

const RRuleField: React.FC<RRuleFieldProps> = ({
  path,
  label = 'Recurrence Rule',
  required = false,
}) => {
  const { value, setValue } = useField<string>({ path })

  const [config, setConfig] = useState<RRuleConfig>({
    frequency: 'DAILY',
    interval: 1,
    byDay: [],
  })
  const [error, setError] = useState<string>('')

  // Parse existing RRULE value on mount
  useEffect(() => {
    if (value) {
      try {
        const parsed = parseRRule(value)
        setConfig(parsed)
        setError('')
      } catch (error) {
        console.error('Failed to parse RRULE:', error)
        setError('Invalid RRULE format')
      }
    }
  }, [value])

  const parseRRule = (rrule: string): RRuleConfig => {
    if (!rrule || typeof rrule !== 'string') {
      throw new Error('Invalid RRULE string')
    }

    const parts = rrule.split(';')
    const config: RRuleConfig = {
      frequency: 'DAILY',
      interval: 1,
      byDay: [],
    }

    parts.forEach((part) => {
      if (!part.includes('=')) return

      const [key, value] = part.split('=')
      if (!key || !value) return

      switch (key) {
        case 'FREQ':
          if (['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(value)) {
            config.frequency = value as RRuleConfig['frequency']
          }
          break
        case 'INTERVAL':
          const interval = parseInt(value)
          if (!isNaN(interval) && interval > 0) {
            config.interval = interval
          }
          break
        case 'BYDAY':
          config.byDay = value
            .split(',')
            .filter((day) => ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'].includes(day))
          break
      }
    })

    return config
  }

  const generateRRule = (config: RRuleConfig): string => {
    const parts: string[] = []

    parts.push(`FREQ=${config.frequency}`)

    if (config.interval > 1) {
      parts.push(`INTERVAL=${config.interval}`)
    }

    if (config.byDay.length > 0) {
      parts.push(`BYDAY=${config.byDay.join(',')}`)
    }

    return parts.join(';')
  }

  const updateConfig = (updates: Partial<RRuleConfig>) => {
    try {
      const newConfig = { ...config, ...updates }
      setConfig(newConfig)
      const rrule = generateRRule(newConfig)
      setValue(rrule)
      setError('')
    } catch (error) {
      setError('Failed to generate RRULE')
    }
  }

  const daysOfWeek = [
    { value: 'MO', label: 'Monday' },
    { value: 'TU', label: 'Tuesday' },
    { value: 'WE', label: 'Wednesday' },
    { value: 'TH', label: 'Thursday' },
    { value: 'FR', label: 'Friday' },
    { value: 'SA', label: 'Saturday' },
    { value: 'SU', label: 'Sunday' },
  ]

  const presetRules = [
    {
      label: 'Daily',
      rrule: 'FREQ=DAILY',
    },
    {
      label: 'Weekdays',
      rrule: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
    },
    {
      label: 'Weekends',
      rrule: 'FREQ=WEEKLY;BYDAY=SA,SU',
    },
    {
      label: 'Weekly',
      rrule: 'FREQ=WEEKLY',
    },
  ]

  const applyPreset = (rrule: string) => {
    try {
      setValue(rrule)
      const parsed = parseRRule(rrule)
      setConfig(parsed)
      setError('')
    } catch (error) {
      setError('Invalid preset RRULE')
    }
  }

  return (
    <div
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: '14px',
        lineHeight: '1.5',
        color: '#333',
      }}
    >
      {/* Main Container */}
      <div
        style={{
          border: '1px solid #e1e5e9',
          borderRadius: '6px',
          backgroundColor: '#ffffff',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e1e5e9',
            backgroundColor: '#f8f9fa',
          }}
        >
          <label
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#333',
              marginBottom: '4px',
            }}
          >
            {label} {required && <span style={{ color: '#dc3545' }}>*</span>}
          </label>
          {error && (
            <div
              style={{
                padding: '8px 12px',
                marginTop: '8px',
                backgroundColor: '#f8d7da',
                border: '1px solid #f5c6cb',
                borderRadius: '4px',
                color: '#721c24',
                fontSize: '13px',
              }}
            >
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          {/* Quick Presets */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: '#6c757d',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Quick Presets
            </label>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              {presetRules.map((preset) => (
                <button
                  type="button"
                  key={preset.label}
                  onClick={() => applyPreset(preset.rrule)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#495057',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e9ecef'
                    e.currentTarget.style.borderColor = '#adb5bd'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa'
                    e.currentTarget.style.borderColor = '#dee2e6'
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '8px' }}>
              Click any preset to quickly set up common recurring patterns
            </div>
          </div>

          {/* Basic Configuration */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: '#6c757d',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Configuration
            </label>
            <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '12px' }}>
              Set how often and when your tour runs
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '16px',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#495057',
                    marginBottom: '6px',
                  }}
                >
                  Frequency
                </label>
                <div style={{ fontSize: '11px', color: '#6c757d', marginBottom: '4px' }}>
                  How often the tour repeats
                </div>
                <select
                  value={config.frequency}
                  onChange={(e) =>
                    updateConfig({ frequency: e.target.value as RRuleConfig['frequency'] })
                  }
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: '#ffffff',
                    color: '#495057',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s ease',
                  }}
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#495057',
                    marginBottom: '6px',
                  }}
                >
                  Interval
                </label>
                <div style={{ fontSize: '11px', color: '#6c757d', marginBottom: '4px' }}>
                  Every X days/weeks/months
                </div>
                <input
                  type="number"
                  value={config.interval}
                  onChange={(e) => updateConfig({ interval: parseInt(e.target.value) || 1 })}
                  min="1"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: '#ffffff',
                    color: '#495057',
                    transition: 'border-color 0.2s ease',
                  }}
                />
              </div>
            </div>

            {/* Day Selection for Weekly */}
            {config.frequency === 'WEEKLY' && (
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#495057',
                    marginBottom: '8px',
                  }}
                >
                  Days of Week
                </label>
                <div style={{ fontSize: '11px', color: '#6c757d', marginBottom: '8px' }}>
                  Select which days the tour runs
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  {daysOfWeek.map((day) => (
                    <label
                      key={day.value}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '14px',
                        color: '#495057',
                        cursor: 'pointer',
                        padding: '6px 10px',
                        borderRadius: '4px',
                        backgroundColor: config.byDay.includes(day.value)
                          ? '#e3f2fd'
                          : 'transparent',
                        border: config.byDay.includes(day.value)
                          ? '1px solid #2196f3'
                          : '1px solid transparent',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={config.byDay.includes(day.value)}
                        onChange={(e) => {
                          const newByDay = e.target.checked
                            ? [...config.byDay, day.value]
                            : config.byDay.filter((d) => d !== day.value)
                          updateConfig({ byDay: newByDay })
                        }}
                        style={{
                          margin: '0',
                          cursor: 'pointer',
                        }}
                      />
                      {day.label}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Generated RRULE Display */}
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: '#495057',
                marginBottom: '8px',
              }}
            >
              Generated RRULE
            </label>
            <div style={{ fontSize: '11px', color: '#6c757d', marginBottom: '8px' }}>
              The technical rule that defines your tour schedule
            </div>
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #e9ecef',
                borderRadius: '6px',
                fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                fontSize: '13px',
                color: '#495057',
                wordBreak: 'break-all',
                lineHeight: '1.4',
                minHeight: '20px',
              }}
            >
              {value || 'No RRULE generated'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RRuleField
