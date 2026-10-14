# Newsletter and footer campaign

The public banner appears once above the footer on every public page, in all five languages. The WhatsApp link uses the owner's number `+359896343109`. The previous final CTA sections have been replaced by this shared banner.

## Activate subscriptions

Apply [`supabase/newsletter.sql`](../supabase/newsletter.sql) to the existing catalogue project. It creates a separate subscriber table, two narrow public RPC functions, and admin-only read/delete policies. It does not modify products, harvests, admin membership or authentication settings. The migration can be applied repeatedly.

The public client only checks `newsletter_ready()` and calls `subscribe_to_newsletter()`. Until the migration is available, the form stays disabled and the banner provides WhatsApp as the working contact method. Success appears only after the database accepts the request. No browser storage is used as a mailing list.

Subscriptions record a normalized unique email, selected locale, consent version and timestamp. Consent is required; a hidden website field filters simple bots. RPC responses do not disclose whether an address was already subscribed. Anonymous clients cannot read the list or insert directly into the table. Only existing catalogue admins can view, export or delete subscribers.

In `/admin`, use **Абонати → Зареди абонатите**. The CSV export includes all pages of records, locale and consent information. **Отпиши** deletes the selected record. The public unsubscribe link prepares a WhatsApp request; it does not claim to remove an address automatically.

This feature collects subscriptions. It does **not** send confirmation emails or marketing campaigns and does not claim to. To send newsletters later, connect an email delivery provider and add the appropriate unsubscribe mechanism to each campaign. Do not send test campaigns to real subscribers during development.

## Artwork

- Final asset: [`public/images/truffle-newsletter.jpg`](../public/images/truffle-newsletter.jpg), 1983 × 793, JPEG quality 92.
- Method: built-in `image_gen` tool; PNG output encoded as JPEG without changing the composition. This is decorative generated artwork, not a photograph of a specific available lot.
- Final generation prompt:

> Use case: ads-marketing. Asset type: wide photographic background for a premium Bulgarian fresh-truffle website's footer banner. Generate a photorealistic editorial still life, wide landscape aspect ratio approximately 2.5:1. On the far left third, several fresh black truffles resting naturally on damp moss and a little forest soil; one truffle sliced in half with detailed dark brown flesh and fine ivory marbling. Place the nearest truffle and cut face near lower-left and middle-left, with breathing room, not cut off at edges. Background soft woodland bokeh, rich very dark forest green, subtle warm natural side light, realistic organic texture, understated photographic color. The right two thirds must be very dark deep green, softly defocused and calm with ample clean negative space for separately coded headings and controls. No text, no letters, no logo, no borders, no buttons, no website mockup, no packaging, no people, no hands. Create only the background photograph, professional and believable, not shiny or artificial.
