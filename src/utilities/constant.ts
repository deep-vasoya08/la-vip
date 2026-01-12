export const BACKGROUND_COLOR_OPTIONS = [
  { label: 'Beige', value: 'bg-beige' },
  { label: 'Black', value: 'bg-black' },
  { label: 'Cream', value: 'bg-cream' },
  { label: 'Gray', value: 'bg-gray' },
  { label: 'Mustard', value: 'bg-mustard' },
  { label: 'Purple', value: 'bg-purple' },
  { label: 'Rust', value: 'bg-rust' },
  { label: 'White', value: 'bg-white' },
]

export const TEXT_COLOR_OPTIONS = [
  { label: 'Beige', value: 'text-beige' },
  { label: 'Black', value: 'text-black' },
  { label: 'Cream', value: 'text-cream' },
  { label: 'Gray', value: 'text-gray' },
  { label: 'Mustard', value: 'text-mustard' },
  { label: 'Purple', value: 'text-purple' },
  { label: 'Rust', value: 'text-rust' },
  { label: 'White', value: 'text-white' },
]

export const PAYMENT_REFERENCE_STRING = (
  type: 'tour' | 'event' | 'event-upcharge' | 'tour-upcharge',
) => {
  if (type === 'tour') {
    return `TOUR-PAY-${Math.floor(100000 + Math.random() * 900000)}-${Math.random().toString(36).substr(2, 9)}`
  } else if (type === 'event') {
    return `EVENT-PAY-${Math.floor(100000 + Math.random() * 900000)}-${Math.random().toString(36).substr(2, 9)}`
  } else if (type === 'event-upcharge') {
    return `EVENT-UPCHARGE-PAY-${Math.floor(100000 + Math.random() * 900000)}-${Math.random().toString(36).substr(2, 9)}`
  } else if (type === 'tour-upcharge') {
    return `TOUR-UPCHARGE-PAY-${Math.floor(100000 + Math.random() * 900000)}-${Math.random().toString(36).substr(2, 9)}`
  } else {
    return `PAY-${Math.floor(100000 + Math.random() * 900000)}-${Math.random().toString(36).substr(2, 9)}`
  }
}

export const BOOKING_REFERENCE_STRING = (type: 'tour' | 'event') => {
  if (type === 'tour') {
    return `TOUR-BOOKING-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substr(2, 9)}`
  } else if (type === 'event') {
    return `EVENT-BOOKING-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substr(2, 9)}`
  } else {
    return `BOOKING-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substr(2, 9)}`
  }
}
