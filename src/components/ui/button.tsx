import { cn } from '@/utilities/ui'
import { Slot } from '@radix-ui/react-slot'
import { type VariantProps, cva } from 'class-variance-authority'
import * as React from 'react'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-center',
  {
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
    variants: {
      size: {
        default: 'text-sm sm:text-base pb-1 pt-2 px-6 sm:px-8 md:px-10',
        small: 'text-xs sm:text-sm pb-1 pt-1.5 px-5 sm:px-6 md:px-8',
        large: 'text-base sm:text-lg pb-2 pt-3 px-6 sm:px-8 md:px-10',
        clear: '',
      },
      variant: {
        default:
          'bg-white text-mustard font-semplicita font-semibold uppercase rounded-tl-full rounded-br-full hover:bg-opacity-90',
        link: 'text-primary items-start justify-start underline-offset-4 hover:underline',
        mustard:
          'bg-mustard text-white font-semplicita rounded-tl-full rounded-br-full font-semibold uppercase hover:bg-mustard/90',
        outline:
          'bg-transparent border border-mustard text-mustard font-semplicita font-semibold uppercase rounded-tl-full rounded-br-full hover:bg-mustard/10',
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
    },
    compoundVariants: [
      {
        fullWidth: true,
        class: 'justify-center',
      },
    ],
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  ref?: React.Ref<HTMLButtonElement>
  fullWidth?: boolean
}

const Button: React.FC<ButtonProps> = ({
  asChild = false,
  className,
  size = 'default',
  variant,
  fullWidth = false,
  ref,
  ...props
}) => {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      className={cn(buttonVariants({ className, size, variant, fullWidth }))}
      ref={ref}
      {...props}
    />
  )
}

export { Button, buttonVariants }
