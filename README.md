# Elevate Fitness Website

Professional gym website for Elevate Fitness in Pocatello, Idaho.

## Features

- 🎨 Modern red, white & blue design
- 💳 Stripe payment integration (one-time & recurring)
- 👤 Member login with password management
- 📊 Member dashboard with subscription tracking
- 🔄 Customer data migration from Wix
- 🔒 Bank-level security
- 📱 Fully responsive mobile design
- 🔍 SEO optimized for local search

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Netlify Functions (serverless)
- **Payments:** Stripe
- **Hosting:** Netlify
- **Authentication:** Custom email + password system

## Quick Setup

1. Upload all files to GitHub repository
2. Connect repository to Netlify
3. Add environment variables in Netlify:
   - `STRIPE_SECRET_KEY` = Your Stripe secret key
   - `ADMIN_IMPORT_KEY` = Password for customer import tool
4. Deploy!

## Documentation

See the documentation files included for complete guides on:
- Stripe setup
- Customer migration from Wix
- Payment processing
- Security configuration

## Structure

```
elevate-fitness/
├── index.html                    # Homepage
├── amenities.html                # Amenities page
├── classes.html                  # Classes & services
├── memberships.html              # Memberships with cart
├── about.html                    # About us
├── contact.html                  # Contact page
├── success.html                  # Payment success
├── login.html                    # Member login
├── dashboard.html                # Member dashboard
├── admin-import.html             # Customer import tool
├── netlify/
│   └── functions/
│       ├── auth.js               # Password management
│       ├── create-checkout.js    # One-time payments
│       ├── create-subscription.js # Recurring payments
│       ├── get-customer-info.js  # Dashboard data
│       ├── create-portal-session.js # Subscription management
│       └── import-customers.js   # Customer migration
├── netlify.toml                  # Netlify configuration
├── package.json                  # Project metadata
├── .gitignore                    # Git ignore rules
├── robots.txt                    # SEO crawling rules
├── sitemap.xml                   # SEO sitemap
└── wix_to_json.py               # CSV to JSON converter
```

## Contact

Elevate Fitness
1800 Garrett Way #19, Pocatello, ID 83201
Phone: (208) 233-8035
Website: https://elevatefitness.com

---

© 2025 Elevate Fitness. All rights reserved.
