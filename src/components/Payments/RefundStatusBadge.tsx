'use client'

import React from 'react'
import { getRefundStatusLabel } from '@/utilities/refund'

interface RefundStatusBadgeProps {
  status: string
}

const RefundStatusBadge: React.FC<RefundStatusBadgeProps> = ({ status }) => {
  const statusLabel = getRefundStatusLabel(status)

  // Define colors based on status
  const getColorClass = () => {
    switch (status) {
      case 'refunded':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'not_refunded':
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getColorClass()}`}
    >
      {statusLabel}
    </span>
  )
}

export default RefundStatusBadge
