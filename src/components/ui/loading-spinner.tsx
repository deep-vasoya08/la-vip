/**
 * LoadingSpinner Component
 *
 * A reusable loading spinner component with customizable size, message, and layout options.
 *
 * @example
 * // Basic usage
 * <LoadingSpinner />
 *
 * @example
 * // Full screen loading with custom message
 * <LoadingSpinner fullScreen message="Loading your data..." />
 *
 * @example
 * // Small inline spinner for buttons
 * <LoadingSpinner size="sm" message="Saving..." />
 *
 * @example
 * // Large spinner with custom styling
 * <LoadingSpinner
 *   size="xl"
 *   message="Processing payment..."
 *   className="bg-white rounded-lg shadow-lg p-8"
 * />
 *
 * @example
 * // Conditional loading in components
 * {isLoading ? (
 *   <LoadingSpinner fullScreen message="Checking authentication..." />
 * ) : (
 *   <YourContent />
 * )}
 *
 * @example
 * // Responsive loading for mobile-friendly display
 * <LoadingSpinner
 *   size="lg"
 *   message="Loading content..."
 *   className="my-4"
 * />
 * // Automatically adjusts: 48px spinner + small text on mobile, 64px + normal text on desktop
 */

import React from 'react'

interface LoadingSpinnerProps {
  /** Size of the spinner: 'sm' (12px/16px), 'md' (24px/32px), 'lg' (48px/64px), 'xl' (96px/128px) - mobile/desktop */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Optional message to display below the spinner (responsive text size) */
  message?: string
  /** Whether to take full screen height and center the spinner */
  fullScreen?: boolean
  /** Additional CSS classes to apply to the container */
  className?: string
}

const sizeClasses = {
  sm: 'h-3 w-3 sm:h-4 sm:w-4',
  md: 'h-6 w-6 sm:h-8 sm:w-8',
  lg: 'h-12 w-12 sm:h-16 sm:w-16',
  xl: 'h-24 w-24 sm:h-32 sm:w-32',
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'lg',
  message = 'Loading...',
  fullScreen = false,
  className = '',
}) => {
  const containerClasses = fullScreen
    ? 'w-full h-screen flex items-center justify-center px-4'
    : 'flex items-center justify-center p-2 sm:p-4'

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="text-center">
        <div
          className={`animate-spin rounded-full border-b-2 border-mustard ${sizeClasses[size]}`}
        ></div>
        {message && (
          <p className="mt-2 sm:mt-4 text-sm sm:text-base text-gray-600 font-roboto px-2">
            {message}
          </p>
        )}
      </div>
    </div>
  )
}

export default LoadingSpinner

/**
 * USAGE EXAMPLES:
 *
 * 1. Import the component:
 * import { LoadingSpinner } from '@/components/ui/loading-spinner'
 * // OR
 * import { LoadingSpinner } from '@/components/ui'
 *
 * 2. Basic usage scenarios:
 *
 * // Page loading
 * const [isLoading, setIsLoading] = useState(true)
 * return isLoading ? <LoadingSpinner fullScreen /> : <PageContent />
 *
 * // Form submission
 * const [isSubmitting, setIsSubmitting] = useState(false)
 * return (
 *   <form onSubmit={handleSubmit}>
 *     {isSubmitting ? (
 *       <LoadingSpinner size="sm" message="Submitting..." />
 *     ) : (
 *       <button type="submit">Submit</button>
 *     )}
 *   </form>
 * )
 *
 * // Data fetching
 * const { data, isLoading, error } = useQuery('data', fetchData)
 * if (isLoading) return <LoadingSpinner message="Fetching data..." />
 * if (error) return <div>Error occurred</div>
 * return <DataComponent data={data} />
 *
 * // Authentication check
 * const { isAuthenticated, isLoading } = useAuth()
 * if (isLoading) return <LoadingSpinner fullScreen message="Checking authentication..." />
 *
 * // Modal/Dialog loading
 * <Dialog>
 *   <DialogContent>
 *     {isProcessing ? (
 *       <LoadingSpinner message="Processing request..." className="py-8" />
 *     ) : (
 *       <DialogBody />
 *     )}
 *   </DialogContent>
 * </Dialog>
 *
 * 3. Size reference (responsive):
 * - sm: 12x12px mobile, 16x16px desktop (for buttons, small inline elements)
 * - md: 24x24px mobile, 32x32px desktop (for cards, form sections)
 * - lg: 48x48px mobile, 64x64px desktop (default, for main content areas)
 * - xl: 96x96px mobile, 128x128px desktop (for full page loading)
 *
 * 4. Responsive features:
 * - Smaller spinners on mobile for better space utilization
 * - Responsive text sizing for messages
 * - Adaptive padding based on screen size
 * - Full-screen mode includes horizontal padding for mobile
 */
