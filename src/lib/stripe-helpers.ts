/**
 * Utility functions for Stripe integration
 */

export const formatAmountForDisplay = (amount: number, currency: string = 'USD'): string => {
  const numberFormat = new Intl.NumberFormat(['en-US'], {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol',
  })
  return numberFormat.format(amount)
}

export const formatAmountForStripe = (amount: number, _currency: string = 'USD'): number => {
  const multiplier = 100
  return Math.round(amount * multiplier)
}

// Payment method configuration
export const PAYMENT_METHOD_CONFIG = {
  // Enable/disable specific payment methods
  enabledMethods: [
    'card', // Credit/debit cards
    'us_bank_account', // ACH payments
    'link', // Stripe Link
    'klarna', // Buy now, pay later - requires return_url
    'affirm', // Buy now, pay later - requires return_url
    'cashapp', // Cash App Pay - requires return_url
    'amazon_pay', // Amazon Pay - requires return_url
  ] as string[],

  // Methods that require return_url (redirect-based)
  redirectMethods: ['klarna', 'affirm', 'cashapp', 'amazon_pay'] as string[],

  // Methods to completely disable
  disabledMethods: [
    // Add any methods you want to completely hide
  ] as string[],
}

// Get allowed payment methods based on configuration
export function getAllowedPaymentMethods(): string[] {
  const { enabledMethods, disabledMethods } = PAYMENT_METHOD_CONFIG

  return enabledMethods.filter((method) => !disabledMethods.includes(method))
}

// Check if a payment method requires redirect
export function requiresRedirect(method: string): boolean {
  return PAYMENT_METHOD_CONFIG.redirectMethods.includes(method)
}
