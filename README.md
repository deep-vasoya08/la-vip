# LA VIP Tours - Website with GA4, Meta Pixel & Brevo Integration

This is a fully-featured website built with Payload CMS and Next.js, with integrated **Google Analytics 4 (GA4)**, **Meta Pixel (Facebook Pixel)** conversion tracking, and **Brevo** email marketing automation for comprehensive marketing analytics and customer engagement.

---

## 📊 Marketing & Analytics Features

### Multi-Platform Integration
- ✅ **Google Analytics 4 (GA4)** - via Google Tag Manager
- ✅ **Meta Pixel (Facebook Pixel)** - Direct integration
- ✅ **Brevo (Email Marketing)** - Automated contact sync with tags
- ✅ All conversion events tracked across platforms simultaneously
- ✅ Complete eCommerce purchase tracking with transaction details
- ✅ Rich customer data for segmentation and personalization

### Tracked Events

| User Action | GA4 Event | Meta Pixel Event | When It Fires |
|------------|-----------|------------------|---------------|
| **Page View** | Automatic (GTM) | `PageView` | Every page load |
| **View Tour/Event** | `view_item` | `ViewContent` | Tour/event details page |
| **View List** | `view_item_list` | - | Tour/event listing page |
| **Select Item** | `select_item` | - | Click from list |
| **Start Booking** | `begin_checkout` | `InitiateCheckout` | Click "Book Now" |
| **Enter Payment** | `add_payment_info` | `AddPaymentInfo` | Payment form loads |
| **💰 Purchase** | `purchase` | `Purchase` | Payment succeeds |
| **Form Submit** | `form_submit` | `Lead` | Contact/quote form |

### Purchase Data Tracked

Both platforms receive complete transaction details:
- ✅ Transaction/Order ID
- ✅ Revenue (booking amount)
- ✅ Currency (USD)
- ✅ Item details (tour/event name, ID, category)
- ✅ Quantity
- ✅ Customer information

---

## 📧 Brevo (Email Marketing) Integration

### Overview

All tour and event bookings are automatically synced to Brevo with comprehensive customer data, event information, and tags for precise segmentation.

### What Gets Synced

#### For Event Bookings:

**Attributes:**
- `FIRSTNAME` - Customer's first name
- `LASTNAME` - Customer's last name
- `SMS` - Phone number (E.164 format)
- `EVENT_NAME` - Name of the event booked
- `EVENT_CATEGORY` - Category (Sporting Event / Entertainment Event)
- `EVENT_DATE` - Scheduled event date/time (ISO format)
- `LAST_EVENT_PURCHASED` - Most recent event name
- `LAST_BOOKING_DATE` - When booking was made
- `TAGS` - Combined string: `"Event Name, Category, Purchased: Date"`

**Lists:**
- List ID 5: Sporting Event Purchaser
- List ID 6: Entertainment Event Purchaser
- List ID 7: Contact Form Submissions

**Example TAGS value:**
```
"Lakers vs Celtics, Sporting Event, Purchased: Dec 9, 2025"
```

#### For Tour Bookings:

**Attributes:**
- `FIRSTNAME` - Customer's first name
- `LASTNAME` - Customer's last name
- `SMS` - Phone number (E.164 format)
- `TOUR_NAME` - Name of the tour booked
- `TOUR_DATE` - Scheduled tour date/time (ISO format)
- `LAST_TOUR_PURCHASED` - Most recent tour name
- `LAST_BOOKING_DATE` - When booking was made
- `TAGS` - Combined string: `"Tour Name, Purchased: Date, Tour"`

**Lists:**
- List ID 18: Deluxe Grand Tour

**Example TAGS value:**
```
"Deluxe Grand Tour, Purchased: Dec 9, 2025, Tour"
```

### Configuration

Add Brevo API credentials to your `.env`:

```bash
# Brevo (formerly Sendinblue)
BREVO_API_KEY=your_brevo_api_key_here
BREVO_API_BASE_URL=https://api.brevo.com/v3
```

**Get Your Brevo API Key:**
1. Log in to https://app.brevo.com
2. Go to Settings → API Keys
3. Create a new API key
4. Copy and paste into `.env`

### Usage in Brevo Dashboard

#### Segmentation Examples:

**Find customers who purchased a specific event:**
- Filter: `TAGS` contains `"Lakers vs Celtics"`
- OR Filter: `EVENT_NAME` equals `"Lakers vs Celtics"`

**Find all sporting event customers:**
- Filter: `TAGS` contains `"Sporting Event"`
- OR Filter: `EVENT_CATEGORY` equals `"Sporting Event"`
- OR Use List: "Sporting Event Purchaser" (ID: 5)

**Find all tour customers:**
- Filter: `TAGS` contains `"Tour"`
- OR Use List: "Deluxe Grand Tour" (ID: 18)

**Find customers who booked recently:**
- Filter: `LAST_BOOKING_DATE` is after `"2025-12-01"`
- OR Filter: `TAGS` contains `"Purchased: Dec"`

**Find upcoming events:**
- Filter: `EVENT_DATE` is greater than today

#### Email Personalization:

Use attributes in your email templates:

```html
Hi {{ contact.FIRSTNAME }},

Thank you for booking {{ contact.EVENT_NAME }}!
Your event is scheduled for {{ contact.EVENT_DATE }}.

We look forward to seeing you there!
```

#### Automation Ideas:

**Pre-Event Reminder:**
- Trigger: When `EVENT_DATE` is 24 hours away
- Action: Send reminder email with event details

**Post-Event Follow-up:**
- Trigger: When `EVENT_DATE` has passed (1 day after)
- Action: Send thank you email + review request

**Cross-Sell Tours:**
- Segment: Contacts with tag containing `"Sporting Event"` or `"Entertainment Event"`
- Action: Promote tour packages via email campaign

**Reactivation Campaign:**
- Segment: `LAST_BOOKING_DATE` older than 6 months
- Action: Send special offer email

### Implementation Details

**Files:**
- `src/lib/brevo.ts` - Core Brevo API functions
- `src/app/api/bookings/events/route.ts` - Event booking sync
- `src/app/api/bookings/tours/route.ts` - Tour booking sync
- `src/hooks/syncFormSubmissionToBrevo.ts` - Form submission sync

**Sync Timing:**
- Syncs immediately after booking is created
- Before payment confirmation
- Updates existing contacts automatically

**Phone Number Handling:**
- Automatically formatted to E.164 format (+1XXXXXXXXXX)
- Invalid numbers are excluded (booking still succeeds)

**Error Handling:**
- Brevo sync failures don't block bookings
- Errors logged but customer experience unaffected
- Check console for: `[Event Booking Brevo Sync]` or `[Tour Booking Brevo Sync]`

### Testing

**Test the integration:**

1. Make a test booking
2. Check server logs:
   ```
   [Event Booking Brevo Sync] {
     status: 'success',
     email: 'customer@example.com',
     eventName: 'Lakers vs Celtics',
     category: 'Sporting Event',
     eventDate: '2025-12-25T19:30:00.000Z',
     listId: 5,
     tagsAttribute: 'Lakers vs Celtics, Sporting Event, Purchased: Dec 9, 2025',
     contactId: 123456
   }
   ```
3. Go to Brevo → Contacts
4. Search for the customer email
5. Verify all attributes are populated
6. Check TAGS field contains event/tour information

### Benefits

✅ **Automated Marketing** - Contacts sync automatically on every booking  
✅ **Rich Segmentation** - Filter by event name, category, date, or custom tags  
✅ **Personalization** - Use booking data in email templates  
✅ **Automation Triggers** - Set up workflows based on booking dates  
✅ **Cross-Selling** - Promote related events/tours to past customers  
✅ **Retention** - Re-engage customers based on last booking date  
✅ **Analytics** - Track which events/tours drive most signups  

---

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd la-vip-tours

# Copy environment variables
cp .env.example .env

# Install dependencies
npm install
```

### 2. Configure Tracking

Add these to your `.env` file:

```bash
# Meta Pixel (Facebook Pixel) - REQUIRED for Meta tracking
NEXT_PUBLIC_META_PIXEL_ID=YOUR_PIXEL_ID_HERE

# Google Tag Manager - Already configured
# GTM Container ID: GTM-T889CG9M
```

**Get Your Meta Pixel ID:**
1. Go to https://business.facebook.com/events_manager2
2. Select your Pixel from "Data Sources"
3. Copy the Pixel ID (numeric, like `123456789012345`)
4. Paste it in your `.env` file

### 3. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

---

## 🧪 Testing Your Tracking

### Method 1: Meta Pixel Helper (Easiest)

1. **Install Extension**:
   - Chrome: https://chrome.google.com/webstore/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc

2. **Test Your Site**:
   - Visit your website
   - Click the Pixel Helper extension icon
   - Should see: ✅ Pixel detected, ✅ PageView fired

3. **Test Full Flow**:
   ```
   ✅ Load homepage → PageView fires
   ✅ View tour → ViewContent fires
   ✅ Click "Book Now" → InitiateCheckout fires
   ✅ Payment form → AddPaymentInfo fires
   ✅ Complete payment → Purchase fires 🎉
   ```

### Method 2: Facebook Events Manager

1. Go to https://business.facebook.com/events_manager2
2. Click "Test Events" in left menu
3. Enter your website URL
4. Perform actions and watch events appear in real-time

### Method 3: Browser Console

```javascript
// Check if Meta Pixel is loaded
console.log(typeof window.fbq); // Should return "function"

// Check if GA4 dataLayer exists
console.log(window.dataLayer); // Should return array

// Manually fire a test event
window.fbq('trackCustom', 'TestEvent');
```

### Complete Test Sequence

| Step | Action | Expected Event | Check |
|------|--------|----------------|-------|
| 1 | Open homepage | `PageView` | Pixel Helper shows green ✓ |
| 2 | Click on a tour | `ViewContent` | Event shows tour details |
| 3 | Click "Book Now" | `InitiateCheckout` | Event shows booking amount |
| 4 | Enter payment details | `AddPaymentInfo` | Event shows payment info |
| 5 | Complete payment | `Purchase` | Event shows order_id & value |

### Success Checklist

- [ ] `NEXT_PUBLIC_META_PIXEL_ID` is set in `.env`
- [ ] Server restarted after adding env variable
- [ ] Meta Pixel Helper shows pixel detected
- [ ] PageView fires on every page
- [ ] ViewContent fires on tour/event pages
- [ ] InitiateCheckout fires when booking starts
- [ ] AddPaymentInfo fires on payment form
- [ ] Purchase fires on successful payment
- [ ] Events appear in Events Manager → Test Events
- [ ] No errors in browser console

---

## 🎯 Marketing Use Cases

### Facebook/Meta Ads

**Optimize Campaigns:**
- Create campaigns optimized for "Purchase" events
- Track Return on Ad Spend (ROAS)
- Use value-based bidding

**Build Audiences:**
- Lookalike Audiences from purchasers
- Retarget cart abandoners (InitiateCheckout but no Purchase)
- Exclude recent buyers

**Custom Conversions:**
- High-value tours (Purchase value > $200)
- Premium events (Purchase value > $300)
- Multi-passenger bookings

### Google Ads

**Import GA4 Conversions:**
1. In GA4, mark "purchase" as a conversion
2. Link GA4 to Google Ads
3. Import conversion to Google Ads

**Smart Bidding:**
- Use Target ROAS strategy
- Optimize for conversion value
- Create Performance Max campaigns

**Remarketing:**
- Create audiences based on GA4 events
- Remarket to tour viewers who didn't book
- Exclude recent purchasers

### Analytics & Insights

**Conversion Funnel:**
```
100 users → View Tour (view_item)
 ↓ 60%
 60 users → Start Booking (begin_checkout)
 ↓ 83%
 50 users → Enter Payment (add_payment_info)
 ↓ 90%
 45 users → Purchase ✅
 = 45% Overall Conversion Rate
```

**Track Performance:**
- Average booking value
- Conversion rate by tour/event
- Drop-off points in funnel
- Customer journey insights

---

## 🏗️ Architecture

### Files Structure

```
src/
├── lib/
│   ├── ga4-ecommerce.ts          # GA4 tracking functions
│   ├── meta-pixel.ts             # Meta Pixel tracking functions
│   └── brevo.ts                  # Brevo API integration
├── hooks/
│   ├── useGA4Tracking.ts         # GA4 React hook
│   ├── useMetaPixelTracking.ts   # Meta Pixel React hook
│   └── syncFormSubmissionToBrevo.ts  # Form submission to Brevo
├── components/
│   ├── GA4EventTracker/          # Unified tracker component
│   │   └── index.tsx
│   ├── MetaPixelScript/          # Meta Pixel initialization
│   │   └── index.tsx
│   ├── TourBookingPayment/       # Tour payment with tracking
│   │   └── PaymentForm.tsx
│   └── EventBookingPayment/      # Event payment with tracking
│       └── PaymentForm.tsx
└── app/
    ├── api/
    │   └── bookings/
    │       ├── events/route.ts   # Event booking + Brevo sync
    │       └── tours/route.ts    # Tour booking + Brevo sync
    └── (frontend)/
        └── layout.tsx            # Tracking scripts loaded here
```

### How It Works

1. **Initialization** (Page Load):
   - Google Tag Manager loads → Initializes GA4
   - Meta Pixel script loads → Initializes Facebook Pixel
   - Both track PageView automatically

2. **Event Tracking** (User Actions):
   - User performs action (view, book, pay)
   - Component calls tracking hooks
   - Events sent to both GA4 and Meta Pixel
   - Data formatted for each platform

3. **Purchase Tracking** (Payment Success):
   - Stripe payment succeeds
   - Booking confirmed in database
   - Purchase event fires with transaction ID
   - Revenue and item details sent to both platforms

4. **Brevo Sync** (After Booking):
   - Booking created in database
   - Customer data synced to Brevo automatically
   - Attributes populated (event/tour name, dates, category)
   - Tags added for segmentation
   - Contact assigned to appropriate list

---

## 💻 Usage Examples

### Track Custom Events

```typescript
import { useMetaPixelTracking } from '@/hooks/useMetaPixelTracking'
import { useGA4Tracking } from '@/hooks/useGA4Tracking'

function MyComponent() {
  const { trackLead } = useMetaPixelTracking()
  const { trackFormSubmit } = useGA4Tracking()
  
  const handleQuoteRequest = () => {
    // Track in Meta Pixel
    trackLead('USD', 0, 'Quote Request', 'Tours')
    
    // Track in GA4
    trackFormSubmit('quote-form')
  }
  
  return <button onClick={handleQuoteRequest}>Get Quote</button>
}
```

### Track Tour View

```typescript
import { useMetaPixelTracking } from '@/hooks/useMetaPixelTracking'
import { useGA4Tracking } from '@/hooks/useGA4Tracking'

function TourDetails({ tour }) {
  const { trackTourView: trackMetaTourView } = useMetaPixelTracking()
  const { trackTourView: trackGA4TourView } = useGA4Tracking()
  
  useEffect(() => {
    // Track in both platforms
    trackMetaTourView(tour)
    trackGA4TourView(tour)
  }, [tour])
}
```

### Track Purchase (Already Implemented)

Purchase tracking is automatic in payment forms:
- `src/components/TourBookingPayment/PaymentForm.tsx`
- `src/components/EventBookingPayment/PaymentForm.tsx`

Both automatically fire Purchase events on successful payment.

---

## 🔍 Troubleshooting

### Events Not Showing?

**Problem**: No events in Pixel Helper or Events Manager

**Solutions**:

1. **Check Pixel ID is set**:
   ```bash
   # View your .env file
   cat .env
   # Should show: NEXT_PUBLIC_META_PIXEL_ID=123456789012345
   ```

2. **Restart server**:
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

3. **Check if pixel loaded**:
   ```javascript
   // In browser console
   console.log(typeof window.fbq);
   // Should return: "function"
   ```

4. **Clear cache**:
   - Clear browser cache
   - Try incognito/private window
   - Disable ad blockers temporarily

### Events Missing Parameters?

**Problem**: Events fire but missing data like value or order_id

**Solutions**:

1. **Check Pixel Helper details**:
   - Click on event in Pixel Helper
   - Expand to see all parameters
   - Verify value, currency, content_ids are present

2. **Check browser console for errors**:
   - Open Developer Tools (F12)
   - Look for red error messages
   - Check Network tab for failed requests

### Ad Blocker Blocking Pixel?

**Problem**: Pixel Helper shows no pixel detected

**Solutions**:
1. Temporarily disable ad blocker
2. Whitelist your localhost
3. Use browser without extensions for testing

### Purchase Event Not Firing?

**Problem**: All other events work but not Purchase

**Solutions**:

1. **Check payment completes**:
   - Ensure Stripe payment succeeds
   - Check booking is created in database
   - Look for "Payment Successful" message

2. **Check browser console**:
   - Look for tracking errors during payment
   - Verify bookingDetails state is populated

3. **Check Events Manager**:
   - Go to Test Events tab
   - Wait 5-10 minutes (slight delay is normal)
   - Check if event appears there

### Testing on Mobile?

**Get your local IP**:

```bash
# Windows
ipconfig
# Look for IPv4 Address (e.g., 192.168.1.100)

# Mac/Linux
ifconfig
# Look for inet address
```

**Access from phone**:
- Connect phone to same WiFi
- Visit: `http://YOUR_IP:3000`
- Example: `http://192.168.1.100:3000`
- Events will appear in Events Manager

---

## 📈 Event Data Examples

### ViewContent Event

**GA4 format**:
```javascript
{
  event: 'view_item',
  ecommerce: {
    currency: 'USD',
    value: 150.00,
    items: [{
      item_id: 'tour_123',
      item_name: 'Hollywood Sign Tour',
      item_category: 'Tours',
      price: 150.00,
      quantity: 1
    }]
  }
}
```

**Meta Pixel format**:
```javascript
fbq('track', 'ViewContent', {
  currency: 'USD',
  value: 150.00,
  content_ids: ['tour_123'],
  content_name: 'Hollywood Sign Tour',
  content_category: 'Tours',
  content_type: 'product'
});
```

### Purchase Event

**GA4 format**:
```javascript
{
  event: 'purchase',
  ecommerce: {
    transaction_id: 'pi_1234567890',
    affiliation: 'LA VIP Tours',
    value: 150.00,
    currency: 'USD',
    items: [{
      item_id: 'tour_123',
      item_name: 'Hollywood Sign Tour',
      item_category: 'Tours',
      item_brand: 'LA VIP Tours',
      price: 150.00,
      quantity: 1
    }]
  }
}
```

**Meta Pixel format**:
```javascript
fbq('track', 'Purchase', {
  currency: 'USD',
  value: 150.00,
  content_ids: ['tour_123'],
  content_name: 'Hollywood Sign Tour',
  content_category: 'Tours',
  contents: [{
    id: 'tour_123',
    quantity: 1,
    item_price: 150.00
  }],
  num_items: 1,
  order_id: 'booking_123'
});
```

---

## 🎨 Payload CMS Features

This template includes all standard Payload CMS features:

### Collections

- **Users**: Authentication and admin panel access
- **Tours**: Tour bookings with pricing and schedules
- **Events**: Event bookings with venue details
- **Tour Bookings**: Customer tour reservations
- **Event Bookings**: Customer event reservations
- **Tour Booking Payments**: Payment tracking for tours
- **Event Booking Payments**: Payment tracking for events
- **Pages**: Layout builder enabled pages
- **Media**: Image and file uploads with CDN integration

### Features

- ✅ Layout Builder with custom blocks
- ✅ Draft Preview
- ✅ Live Preview
- ✅ SEO Plugin
- ✅ Redirects Plugin
- ✅ Scheduled Publishing
- ✅ User Authentication
- ✅ Access Control
- ✅ Lexical Rich Text Editor
- ✅ On-demand Revalidation

---

## 🔐 Environment Variables

Required environment variables:

```bash
# Database
DATABASE_URI=your_database_connection_string
PAYLOAD_SECRET=your_payload_secret

# Server
NEXT_PUBLIC_SERVER_URL=http://localhost:3000

# Meta Pixel (Required for conversion tracking)
NEXT_PUBLIC_META_PIXEL_ID=your_pixel_id_here

# Stripe (for payments)
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Brevo (Email Marketing)
BREVO_API_KEY=your_brevo_api_key
BREVO_API_BASE_URL=https://api.brevo.com/v3

# Email (Nodemailer)
EMAIL_FROM=your_email@example.com
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_email_username
EMAIL_PASS=your_email_password

# Storage (optional - AWS S3 or Cloudflare R2)
S3_ENABLED=false
S3_BUCKET=your_bucket_name
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your_access_key
S3_SECRET_ACCESS_KEY=your_secret_key
S3_ENDPOINT=your_custom_endpoint (optional)
```

---

## 📦 Production Deployment

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Deploy to Payload Cloud

1. Visit https://payloadcms.com/new/import
2. Connect your GitHub repository
3. Add environment variables
4. Deploy

---

## 🎯 Conversion Optimization Tips

### 1. Set Up Campaigns

**Facebook:**
- Campaign objective: "Sales" or "Conversions"
- Optimization event: "Purchase"
- Add target ROAS if you have historical data

**Google:**
- Campaign type: Performance Max or Search
- Import GA4 purchase conversion
- Enable Smart Bidding (Target ROAS or Maximize Conversions)

### 2. Build Audiences

**High-Intent Audience** (Facebook & Google):
- Viewed tour but didn't book (ViewContent → no Purchase)
- Started checkout but didn't complete (InitiateCheckout → no Purchase)
- Use for retargeting campaigns

**Exclusion Audience**:
- Recent purchasers (last 30 days)
- Exclude from acquisition campaigns

**Lookalike Audience** (Facebook):
- Source: Website Custom Audience of purchasers
- Size: 1-3% for best quality
- Use for prospecting campaigns

### 3. Monitor Performance

**Key Metrics**:
- Purchase Conversion Rate
- Average Order Value (AOV)
- Cost Per Acquisition (CPA)
- Return on Ad Spend (ROAS)
- Funnel Drop-off Rates

**Optimization Actions**:
- A/B test ad creative
- Optimize landing pages with high drop-off
- Test different audiences
- Adjust bids based on performance

---

## 📞 Support

### For Tracking Issues

1. Check browser console for errors
2. Use Meta Pixel Helper extension
3. Review Events Manager → Test Events
4. Check GA4 DebugView for real-time events

### For General Issues

- [Payload Discord](https://discord.com/invite/payload)
- [Payload Documentation](https://payloadcms.com/docs)
- [GitHub Discussions](https://github.com/payloadcms/payload/discussions)

---

## ✅ Final Checklist

Before going live:

**Tracking:**
- [ ] Meta Pixel ID configured in `.env`
- [ ] Tested all events with Pixel Helper
- [ ] Purchase event fires on successful payment
- [ ] Events appear in Facebook Events Manager
- [ ] Events appear in GA4 Realtime reports
- [ ] All event parameters (value, currency, order_id) are correct
- [ ] GTM container published

**Brevo Integration:**
- [ ] Brevo API Key configured in `.env`
- [ ] Made test booking to verify sync
- [ ] Contacts appearing in Brevo dashboard
- [ ] All attributes (EVENT_NAME, TAGS, etc.) populated correctly
- [ ] Lists properly assigned (Sporting/Entertainment/Tours)
- [ ] Email automation workflows created
- [ ] Welcome/confirmation emails configured

**General:**
- [ ] Server restarted after env changes
- [ ] No errors in browser console
- [ ] Tested on mobile device
- [ ] Ad campaigns created and optimized
- [ ] Conversion audiences built
- [ ] Retargeting campaigns setup

---

## 🎉 You're All Set!

Your LA VIP Tours website now has:
- ✅ **Complete conversion tracking** across Google Analytics 4 and Meta Pixel
- ✅ **Automated email marketing** with Brevo integration
- ✅ **Rich customer data** with event/tour information and tags
- ✅ **Segmentation capabilities** for targeted campaigns
- ✅ **Full transaction tracking** with detailed booking data

Every booking is tracked, synced, and ready for marketing optimization. Maximize your return on ad spend and build lasting customer relationships!

**Happy tracking! 🚀📊📧**
