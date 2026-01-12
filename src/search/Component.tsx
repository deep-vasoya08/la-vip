'use client'
import { Input } from '@/components/ui/input'
import React, { useState, useEffect } from 'react'
import { useDebounce } from '@/utilities/useDebounce'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export const Search: React.FC = () => {
  const [value, setValue] = useState('')
  const router = useRouter()

  const debouncedValue = useDebounce(value)

  useEffect(() => {
    router.push(`/search${debouncedValue ? `?q=${debouncedValue}` : ''}`)
  }, [debouncedValue, router])

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
        }}
      >
        <Input
          id="search"
          className="text-black bg-white h-[45px] md:h-12 rounded-full border-2 border-gray-300 focus:border-mustard transition-colors duration-200 px-6"
          onChange={(event) => {
            setValue(event.target.value)
          }}
          placeholder="Search tours and events..."
          value={value}
        />
        <Button type="submit" variant="mustard" className="mt-6 rounded-full px-8">
          Search
        </Button>
      </form>
    </div>
  )
}
