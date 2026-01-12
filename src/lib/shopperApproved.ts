/**
 * Direct Shopper Approved Merchant API call to create a follow-up entry
 * Endpoint: POST https://api.shopperapproved.com/reviews/{siteid}?xml=false
 */
export async function createShopperApprovedFollowup(params: {
  siteId?: string
  token?: string
  name?: string
  orderId: string
  email: string
  followup: string // YYYY-MM-DD
  products?: string // comma-separated ids
  // test?: boolean
}): Promise<{ success: boolean; status?: number; error?: string; review_id?: number }> {
  try {
    console.log(' shopper approved params', params)
    const baseUrl = process.env.SHOPPER_APPROVED_BASE_URL || ''
    const siteId = params.siteId || process.env.SHOPPER_APPROVED_SITE_ID
    const token = params.token || process.env.SHOPPER_API_TOKEN
    if (!siteId || !token) return { success: false, error: 'Missing Shopper Approved credentials' }

    const url = `${baseUrl}/reviews/${encodeURIComponent(siteId)}?xml=false`
    const body = new URLSearchParams()
    body.set('token', token)
    if (params.name) body.set('name', params.name)
    body.set('orderid', params.orderId)
    body.set('email', params.email)
    body.set('followup', params.followup)
    if (params.products) body.set('products', params.products)

    console.log('shopper approved body', body)

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: '*/*' },
      body,
    })

    const status = resp.status
    const text = await resp.text()
    let json: any = {}
    try {
      json = text ? JSON.parse(text) : {}
    } catch {
      // non-json; leave as empty object and surface text below if needed
    }

    console.log('shopper approved response', resp)
    if (status >= 200 && status < 300) {
      return { success: true, status, review_id: json?.review_id }
    }
    return { success: false, status, error: json?.message || `HTTP ${status}: ${text}` }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function updateShopperApprovedReview(params: {
  siteId?: string
  token?: string
  reviewIdOrOrderId: string
  followup?: string
  cancel?: boolean
}): Promise<{ success: boolean; status?: number; error?: string }> {
  try {
    const baseUrl = process.env.SHOPPER_APPROVED_BASE_URL || ''
    const siteId = params.siteId || process.env.SHOPPER_APPROVED_SITE_ID
    const token = params.token || process.env.SHOPPER_API_TOKEN
    if (!siteId || !token) return { success: false, error: 'Missing Shopper Approved credentials' }

    const url = `${baseUrl}/reviews/${encodeURIComponent(siteId)}/${encodeURIComponent(
      params.reviewIdOrOrderId,
    )}?xml=false`
    const body = new URLSearchParams()
    body.set('token', token)
    if (params.cancel) body.set('cancel', '1')
    if (params.followup !== undefined) body.set('followup', params.followup)

    const resp = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: '*/*' },
      body,
    })

    const status = resp.status
    if (status >= 200 && status < 300) return { success: true, status }
    const text = await resp.text()
    let json: any = {}
    try {
      json = text ? JSON.parse(text) : {}
    } catch {}
    return { success: false, status, error: json?.message || `HTTP ${status}: ${text}` }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
// /**
//  * Shopper Approved Email-Based Review Collection Service
//  *
//  * This service sends booking data to Shopper Approved using their tracking pixel system
//  * which triggers automatic email review requests to customers after their bookings.
//  */

// interface ShopperApprovedOrder {
//   orderId: string
//   customerName: string
//   customerEmail: string
//   orderDate: string
//   orderTotal: string
//   products?: Array<{
//     productId: string
//     productName: string
//     productPrice?: string
//   }>
// }

// /**
//  * Submit order data to Shopper Approved using their tracking pixel system
//  * This triggers automatic review request emails to customers
//  */
// export async function submitOrderToShopperApproved(
//   orderData: ShopperApprovedOrder,
// ): Promise<{ success: boolean; error?: string }> {
//   try {
//     const siteId = process.env.SHOPPER_APPROVED_SITE_ID
//     const token = process.env.SHOPPER_APPROVED_TOKEN

//     if (!siteId || !token) {
//       console.warn('Shopper Approved: Missing site ID or token')
//       return { success: false, error: 'Missing Shopper Approved credentials' }
//     }

//     // Use Shopper Approved's tracking pixel system
//     // This is how they actually collect order data for email review requests
//     const trackingData = {
//       site: parseInt(siteId),
//       token: token,
//       orderid: orderData.orderId,
//       name: orderData.customerName,
//       email: orderData.customerEmail,
//       total: orderData.orderTotal,
//       date: orderData.orderDate,
//     }

//     // Build the tracking pixel URL with order data
//     const params = new URLSearchParams()
//     Object.entries(trackingData).forEach(([key, value]) => {
//       if (value !== undefined && value !== null) {
//         params.append(key, value.toString())
//       }
//     })

//     // Send tracking data to Shopper Approved's pixel endpoint
//     const trackingUrl = `https://www.shopperapproved.com/thankyou/rate/${siteId}.js?${params.toString()}`

//     console.log('===== TRACKING URL =====', trackingUrl)
//     const response = await fetch(trackingUrl, {
//       method: 'GET',
//       headers: {
//         'User-Agent': 'LA-VIP-Tours/1.0',
//       },
//     })

//     if (!response.ok) {
//       console.error('Shopper Approved tracking error:', response.status, response.statusText)
//       return {
//         success: false,
//         error: `Tracking error: ${response.status}`,
//       }
//     }

//     console.log(
//       '✅ Order data sent to Shopper Approved tracking system:',
//       response,
//       orderData.orderId,
//     )
//     console.log('📧 Review email will be sent to:', orderData.customerEmail)

//     return { success: true }
//   } catch (error) {
//     console.error('Failed to submit order to Shopper Approved:', error)
//     return {
//       success: false,
//       error: error instanceof Error ? error.message : 'Unknown error',
//     }
//   }
// }

// /**
//  * Alternative method using server-side pixel tracking
//  * This simulates the JavaScript pixel by making a server-side request
//  */
// export async function submitOrderViaPixelTracking(
//   orderData: ShopperApprovedOrder,
// ): Promise<{ success: boolean; error?: string }> {
//   try {
//     const siteId = process.env.SHOPPER_APPROVED_SITE_ID
//     const token = process.env.SHOPPER_APPROVED_TOKEN

//     if (!siteId || !token) {
//       console.warn('Shopper Approved: Missing site ID or token')
//       return { success: false, error: 'Missing Shopper Approved credentials' }
//     }

//     // Create a pixel tracking request similar to how their JavaScript works
//     const pixelUrl = `https://www.shopperapproved.com/thankyou/rate/${siteId}.gif`

//     const pixelParams = new URLSearchParams({
//       site: siteId,
//       token: token,
//       orderid: orderData.orderId,
//       name: orderData.customerName,
//       email: orderData.customerEmail,
//       total: orderData.orderTotal,
//       date: orderData.orderDate,
//     })

//     const fullPixelUrl = `${pixelUrl}?${pixelParams.toString()}`

//     // Make the pixel request
//     const response = await fetch(fullPixelUrl, {
//       method: 'GET',
//       headers: {
//         'User-Agent': 'LA-VIP-Tours/1.0',
//         Accept: 'image/gif,image/webp,image/png,*/*',
//       },
//     })

//     if (response.ok || response.status === 204) {
//       console.log('✅ Order submitted to Shopper Approved via pixel tracking:', orderData.orderId)
//       console.log('📧 Review email will be sent to:', orderData.customerEmail)
//       return { success: true }
//     } else {
//       console.error('Shopper Approved pixel tracking error:', response.status)
//       return {
//         success: false,
//         error: `Pixel tracking error: ${response.status}`,
//       }
//     }
//   } catch (error) {
//     console.error('Failed to submit order via pixel tracking:', error)
//     return {
//       success: false,
//       error: error instanceof Error ? error.message : 'Unknown error',
//     }
//   }
// }

// /**
//  * Send review request email for tour booking
//  */
// export async function sendTourReviewRequest(
//   bookingId: string,
//   customerName: string,
//   customerEmail: string,
//   tourName: string,
//   bookingDate: string,
//   totalAmount: string,
// ): Promise<{ success: boolean; error?: string }> {
//   // Try pixel tracking first, fallback to JavaScript method if needed
//   const pixelResult = await submitOrderViaPixelTracking({
//     orderId: bookingId,
//     customerName,
//     customerEmail,
//     orderDate: new Date().toISOString(),
//     orderTotal: totalAmount,
//     products: [
//       {
//         productId: `tour-${bookingId}`,
//         productName: `${tourName} - ${bookingDate}`,
//         productPrice: totalAmount,
//       },
//     ],
//   })

//   if (pixelResult.success) {
//     return pixelResult
//   }

//   // Fallback to JavaScript tracking method
//   return await submitOrderToShopperApproved({
//     orderId: bookingId,
//     customerName,
//     customerEmail,
//     orderDate: new Date().toISOString(),
//     orderTotal: totalAmount,
//     products: [
//       {
//         productId: `tour-${bookingId}`,
//         productName: `${tourName} - ${bookingDate}`,
//         productPrice: totalAmount,
//       },
//     ],
//   })
// }

// /**
//  * Send review request email for event booking
//  */
// export async function sendEventReviewRequest(
//   bookingId: string,
//   customerName: string,
//   customerEmail: string,
//   eventName: string,
//   bookingDate: string,
//   totalAmount: string,
// ): Promise<{ success: boolean; error?: string }> {
//   // Try pixel tracking first, fallback to JavaScript method if needed
//   const pixelResult = await submitOrderViaPixelTracking({
//     orderId: bookingId,
//     customerName,
//     customerEmail,
//     orderDate: new Date().toISOString(),
//     orderTotal: totalAmount,
//     products: [
//       {
//         productId: `event-${bookingId}`,
//         productName: `${eventName} - ${bookingDate}`,
//         productPrice: totalAmount,
//       },
//     ],
//   })

//   if (pixelResult.success) {
//     return pixelResult
//   }

//   // Fallback to JavaScript tracking method
//   return await submitOrderToShopperApproved({
//     orderId: bookingId,
//     customerName,
//     customerEmail,
//     orderDate: new Date().toISOString(),
//     orderTotal: totalAmount,
//     products: [
//       {
//         productId: `event-${bookingId}`,
//         productName: `${eventName} - ${bookingDate}`,
//         productPrice: totalAmount,
//       },
//     ],
//   })
// }
