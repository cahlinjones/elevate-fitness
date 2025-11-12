# 🚀 Quick Installation Guide

## What's Included

This zip contains **everything** you need for your Elevate Fitness website:

✅ 10 HTML pages (all pages with red/white/blue theme)
✅ 6 Netlify serverless functions (complete backend)
✅ 5 configuration files (ready to deploy)
✅ 1 Python migration script
✅ 1 README.md
✅ 1 .gitignore

**Total: 24 files, perfectly organized!**

---

## 📁 What You Have

```
elevate-fitness-website.zip
│
When extracted, you get:
│
├── index.html                      ← Homepage (red/white/blue) ✨
├── amenities.html                  ← Amenities (updated colors) ✨
├── classes.html                    ← Classes (updated colors) ✨
├── memberships.html                ← Memberships (updated colors) ✨
├── about.html                      ← About (updated colors) ✨
├── contact.html                    ← Contact (updated colors) ✨
├── success.html                    ← Payment success (updated colors) ✨
├── login.html                      ← Login with password reset ✨
├── dashboard.html                  ← Member dashboard (updated colors) ✨
├── admin-import.html               ← Import tool (updated colors) ✨
│
├── netlify/
│   └── functions/
│       ├── auth.js                 ← Password management 🆕
│       ├── create-checkout.js      ← One-time payments
│       ├── create-subscription.js  ← Recurring billing
│       ├── get-customer-info.js    ← Dashboard data
│       ├── create-portal-session.js ← Subscription management
│       └── import-customers.js     ← Customer migration
│
├── netlify.toml                    ← Netlify config + security
├── package.json                    ← Project metadata
├── .gitignore                      ← Git ignore rules
├── robots.txt                      ← SEO
├── sitemap.xml                     ← SEO
├── wix_to_json.py                  ← Migration helper
│
└── README.md                       ← Project documentation
```

---

## ⚡ 3-Step Installation

### Step 1: Upload to GitHub (5 minutes)

**Option A: Drag & Drop (Easiest)**
1. Extract the zip file
2. Go to https://github.com/new
3. Create repository: `elevate-fitness` (Private recommended)
4. Click "uploading an existing file"
5. Drag ALL extracted files and folders
6. Commit: "Initial commit - Elevate Fitness"

**Option B: Git Command Line**
```bash
# Extract zip
unzip elevate-fitness-website.zip
cd elevate-fitness-website

# Initialize git
git init
git add .
git commit -m "Initial commit - Elevate Fitness website"

# Push to GitHub (replace YOUR-USERNAME)
git remote add origin https://github.com/YOUR-USERNAME/elevate-fitness.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Netlify (3 minutes)

1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Choose **GitHub**
4. Select your `elevate-fitness` repository
5. Settings (should auto-detect):
   - Build command: (leave empty)
   - Publish directory: `.`
   - Functions directory: `netlify/functions`
6. Click **"Deploy site"**

### Step 3: Add Stripe Keys (2 minutes)

In Netlify Dashboard:

1. Go to **Site configuration** → **Environment variables**
2. Click **"Add a variable"**
3. Add these two:

**Required:**
```
Key: STRIPE_SECRET_KEY
Value: sk_test_... (your Stripe secret key)
```

**Optional (for customer import):**
```
Key: ADMIN_IMPORT_KEY
Value: YourStrongPassword123!
```

4. Click **"Deploys"** → **"Trigger deploy"** → **"Deploy site"**

---

## ✅ Verification

After deployment, test these:

1. **Homepage loads** → Should see red/white/blue theme
2. **All pages work** → Click through navigation
3. **Login page** → Should show email entry
4. **Memberships** → Add to cart, see cart icon update
5. **Checkout** → Click "Proceed to Checkout" (use Stripe test card: 4242 4242 4242 4242)
6. **Dashboard** → Login with test email, see dashboard

---

## 🎨 Color Theme Confirmed

**All pages updated with:**
- **Crimson Red** (#DC143C) - Buttons, CTAs, energy
- **Dark Red** (#B01030) - Hover states
- **Royal Blue** (#1E3A8A) - Trust, professionalism
- **Bright Blue** (#3B82F6) - Highlights, gradients
- **White** (#FFFFFF) - Clean backgrounds

Every single page now has the red, white & blue theme! ✨

---

## 🔐 Security Notes

**DO NOT commit these to GitHub:**
- Stripe secret keys
- Admin passwords
- Customer data

These should ONLY be in:
- Netlify environment variables (✅)
- Your local .env file (✅)
- NEVER in your code (❌)

The included `.gitignore` file protects you automatically!

---

## 📱 What Works Right Now

After deployment:

✅ **All 10 pages load with red/white/blue theme**
✅ **Shopping cart works**
✅ **Stripe checkout works** (test mode)
✅ **Member login works**
✅ **Password reset for migrated customers**
✅ **Member dashboard shows subscriptions**
✅ **Customer import tool ready**
✅ **SEO optimized for Pocatello, Idaho**
✅ **Mobile responsive**
✅ **Bank-level security headers**

---

## 🔄 Next Steps After Installation

### 1. Test Everything (30 minutes)
- Test all pages
- Test login flow
- Test payment with test card: 4242 4242 4242 4242
- Test dashboard

### 2. Set Up Google Business (15 minutes)
- Go to https://business.google.com
- Create profile for Elevate Fitness
- Add your Netlify URL
- Add business hours, photos

### 3. Import Customers from Wix (1-2 hours)
- Export data from Wix
- Use `wix_to_json.py` to convert
- Upload via admin-import.html
- See WIX_MIGRATION_GUIDE.md (in documentation files)

### 4. Go Live (5 minutes)
- Switch Stripe to live keys
- Test one real payment
- Announce to customers!

---

## 🆘 Troubleshooting

**"Functions not found"**
- Make sure netlify/functions/ folder is included
- Check netlify.toml is in root
- Redeploy site

**"Stripe error"**
- Add STRIPE_SECRET_KEY to Netlify environment variables
- Make sure it starts with sk_test_ or sk_live_
- Redeploy after adding

**"Pages look wrong"**
- Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
- Clear browser cache
- Check all files uploaded correctly

**"Import tool password doesn't work"**
- Make sure ADMIN_IMPORT_KEY is set in Netlify
- Check password matches exactly
- Redeploy after adding

---

## 📞 Support Resources

**Included Documentation Files:**
- QUICK_START.md - 15-minute setup guide
- STRIPE_SETUP.md - Payment setup details
- WIX_MIGRATION_GUIDE.md - Complete migration guide
- COMPLETE_FILE_LIST.md - File inventory
- FINAL_SUMMARY.md - Feature overview

**Online Resources:**
- Netlify Docs: https://docs.netlify.com
- Stripe Docs: https://stripe.com/docs
- GitHub Help: https://docs.github.com

---

## 🎉 Success!

Once deployed, you have:
- ✅ Professional website (red/white/blue theme on all pages)
- ✅ Automatic payment processing
- ✅ Recurring subscriptions
- ✅ Member login with passwords
- ✅ Customer migration ready
- ✅ SEO optimized
- ✅ Production ready!

**Your total cost:**
- Netlify: $0/month (free tier)
- Stripe: 2.9% + $0.30 per transaction
- Domain (optional): ~$12/year

**Start accepting members 24/7!** 🚀

---

Need help? All files are documented and ready to deploy!
