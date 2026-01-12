'use client'

import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/utilities/ui'

export interface SearchableSelectOption {
  value: string
  label: string
}

interface SearchableSelectProps {
  id: string
  name: string
  value: string
  options: SearchableSelectOption[]
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  className?: string
  disabled?: boolean
  error?: boolean
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  id,
  name,
  value,
  options,
  onChange,
  onBlur,
  placeholder = 'Select an option',
  className = '',
  disabled = false,
  error = false,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Get selected option label
  const selectedOption = options.find((opt) => opt.value === value)
  const displayValue = selectedOption?.label || ''

  // Filter options based on search term
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
        if (onBlur) onBlur()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onBlur])

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Reset highlighted index when filtered options change
  useEffect(() => {
    setHighlightedIndex(0)
  }, [searchTerm])

  // Scroll highlighted option into view
  useEffect(() => {
    if (listRef.current && isOpen) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        })
      }
    }
  }, [highlightedIndex, isOpen])

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    switch (e.key) {
      case 'Enter':
        e.preventDefault()
        if (isOpen && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex].value)
        } else {
          setIsOpen(true)
        }
        break
      case 'ArrowDown':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        } else {
          setHighlightedIndex((prev) => (prev + 1) % filteredOptions.length)
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (isOpen) {
          setHighlightedIndex((prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length)
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSearchTerm('')
        break
      case 'Tab':
        setIsOpen(false)
        setSearchTerm('')
        break
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Hidden select for form compatibility */}
      <select
        id={id}
        name={name}
        value={value}
        onChange={() => {}}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Display/Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : displayValue}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            if (!isOpen) setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            '!bg-white !text-gray font-semibold w-full p-3 border rounded',
            'focus:outline-none focus:ring-2 focus:ring-mustard focus:border-mustard',
            error ? 'border-red-500' : 'border-gray',
            disabled && 'opacity-50 cursor-not-allowed',
            className,
          )}
        />
        
        {/* Dropdown Icon */}
        <div
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden="true"
        >
          <svg
            className={cn(
              'w-5 h-5 text-gray transition-transform duration-200',
              isOpen && 'rotate-180',
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={listRef}
          className={cn(
            'absolute z-50 w-full mt-1 bg-white border border-gray rounded shadow-lg',
            'max-h-60 overflow-y-auto',
          )}
        >
          {filteredOptions.length === 0 ? (
            <div className="p-3 text-gray text-center">No options found</div>
          ) : (
            filteredOptions.map((option, index) => (
              <div
                key={option.value}
                onClick={() => handleSelect(option.value)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={cn(
                  'p-3 cursor-pointer font-semibold transition-colors',
                  highlightedIndex === index
                    ? 'bg-mustard/10 text-gray'
                    : 'bg-white text-gray hover:bg-gray-50',
                  value === option.value && 'bg-mustard/20',
                )}
              >
                {option.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default SearchableSelect

