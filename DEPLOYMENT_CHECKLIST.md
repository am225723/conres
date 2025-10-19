# Deployment Checklist
## Couple's Messaging Platform - Production Deployment

Use this checklist to ensure a smooth deployment to production.

---

## Pre-Deployment Checklist

### 1. Code Review
- [x] All code changes reviewed
- [x] No console.log statements in production code
- [x] Error handling implemented
- [x] Loading states added
- [x] User feedback messages added

### 2. Testing
- [x] Session creation tested locally
- [x] Real-time messaging tested locally
- [x] AI integration tested locally
- [x] Emotion tracking tested locally
- [x] All visualizations tested locally
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness testing
- [ ] Performance testing

### 3. Database
- [ ] Supabase schema applied (supabase-schema.sql)
- [ ] Emotion tracking schema applied (emotion-tracking-schema.sql)
- [ ] Database indexes created
- [ ] RLS policies enabled
- [ ] Test data cleaned up

### 4. Environment Variables
- [ ] Production environment variables configured
- [ ] VITE_SUPABASE_URL set
- [ ] VITE_SUPABASE_ANON_KEY set
- [ ] SUPABASE_URL set (server)
- [ ] SUPABASE_ANON_KEY set (server)
- [ ] PPLX_API_KEY set (optional)
- [ ] All secrets secured

### 5. Documentation
- [x] README.md updated
- [x] QUICK_START.md created
- [x] COMPREHENSIVE_DEBUG_REPORT.md created
- [x] EMOTION_TRACKING_README.md created
- [x] IMPLEMENTATION_SUMMARY.md created
- [x] API documentation complete

---

## Deployment Steps

### Step 1: Prepare Repository

```bash
# 1. Ensure you're on main branch
git checkout main

# 2. Pull latest changes
git pull origin main

# 3. Stage all changes
git add .

# 4. Commit changes
git commit -m "feat: Complete platform overhaul with emotion tracking system"

# 5. Push to GitHub
git push origin main
```

**Status:** [ ] Complete

### Step 2: Configure Vercel

1. **Connect Repository**
   - [ ] Go to https://vercel.com
   - [ ] Click "New Project"
   - [ ] Import from GitHub: am225723/conres
   - [ ] Select main branch

2. **Configure Build Settings**
   - [ ] Framework Preset: Vite
   - [ ] Build Command: `npm run build`
   - [ ] Output Directory: `dist`
   - [ ] Install Command: `npm install`

3. **Add Environment Variables**
   ```
   VITE_SUPABASE_URL=https://vrzpwzwhdikmdmagkbtt.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_URL=https://vrzpwzwhdikmdmagkbtt.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   PPLX_API_KEY=your_perplexity_api_key_here
   ```
   - [ ] All variables added
   - [ ] Variables marked as secret

4. **Deploy**
   - [ ] Click "Deploy"
   - [ ] Wait for deployment to complete
   - [ ] Note deployment URL

**Status:** [ ] Complete

### Step 3: Configure Supabase

1. **Apply Database Schema**
   - [ ] Go to Supabase Dashboard
   - [ ] Navigate to SQL Editor
   - [ ] Run `supabase-schema.sql`
   - [ ] Run `emotion-tracking-schema.sql`
   - [ ] Verify all tables created

2. **Enable Real-time**
   - [ ] Go to Database → Replication
   - [ ] Enable replication for:
     - [ ] messages table
     - [ ] participants table
     - [ ] message_emotions table
   - [ ] Save changes

3. **Verify RLS Policies**
   - [ ] Check all tables have RLS enabled
   - [ ] Verify policies are active
   - [ ] Test with anonymous access

**Status:** [ ] Complete

### Step 4: Post-Deployment Testing

1. **Basic Functionality**
   - [ ] Visit deployment URL
   - [ ] Create new session
   - [ ] Join session in another browser
   - [ ] Send messages
   - [ ] Verify real-time updates

2. **AI Features**
   - [ ] Test message suggestions
   - [ ] Test message rewording
   - [ ] Verify different tones work
   - [ ] Check error handling

3. **Emotion Tracking**
   - [ ] Send messages with different emotions
   - [ ] Verify background color changes
   - [ ] Check emotion timeline
   - [ ] Test emotion gauge
   - [ ] View emotion distribution
   - [ ] Create journal entry

4. **Performance**
   - [ ] Check page load time (< 3s)
   - [ ] Verify message send time (< 1s)
   - [ ] Test with multiple users
   - [ ] Monitor API response times

5. **Error Handling**
   - [ ] Test with invalid session code
   - [ ] Test with network disconnection
   - [ ] Test with API failures
   - [ ] Verify error messages display

**Status:** [ ] Complete

---

## Post-Deployment Checklist

### 1. Monitoring Setup
- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Configure analytics (Google Analytics, Plausible, etc.)
- [ ] Set up uptime monitoring
- [ ] Configure alerts for errors

### 2. Performance Optimization
- [ ] Enable Vercel Analytics
- [ ] Check Lighthouse scores
- [ ] Optimize images if needed
- [ ] Enable caching headers

### 3. Security
- [ ] Verify HTTPS is enabled
- [ ] Check CORS configuration
- [ ] Review RLS policies
- [ ] Test rate limiting

### 4. Documentation
- [ ] Update README with production URL
- [ ] Add deployment date to docs
- [ ] Document any production-specific settings
- [ ] Create user guide if needed

### 5. Communication
- [ ] Notify stakeholders of deployment
- [ ] Share production URL
- [ ] Provide user documentation
- [ ] Set up support channel

---

## Rollback Plan

If issues occur after deployment:

### Option 1: Revert Deployment
```bash
# In Vercel Dashboard
1. Go to Deployments
2. Find previous working deployment
3. Click "..." menu
4. Select "Promote to Production"
```

### Option 2: Revert Code
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Vercel will auto-deploy the reverted version
```

### Option 3: Disable Features
```bash
# Temporarily disable emotion tracking
# Set environment variable:
DISABLE_EMOTION_TRACKING=true

# Or modify code to skip emotion analysis
```

---

## Troubleshooting

### Issue: Deployment Fails

**Check:**
- Build logs in Vercel
- Environment variables are set
- Dependencies are installed
- Build command is correct

**Solution:**
- Review error messages
- Check package.json scripts
- Verify all imports are correct
- Test build locally: `npm run build`

### Issue: Database Connection Fails

**Check:**
- Supabase URL is correct
- Anon key is correct
- RLS policies allow access
- Tables exist

**Solution:**
- Verify environment variables
- Check Supabase dashboard
- Test connection with Supabase client
- Review RLS policies

### Issue: Real-time Not Working

**Check:**
- Replication is enabled
- RLS policies allow subscriptions
- WebSocket connection succeeds

**Solution:**
- Enable replication in Supabase
- Check browser console for errors
- Verify polling fallback works
- Test with different browsers

### Issue: AI Features Not Working

**Check:**
- PPLX_API_KEY is set
- API key is valid
- API endpoint is accessible
- Rate limits not exceeded

**Solution:**
- Verify API key in Vercel
- Check Perplexity dashboard
- Test API endpoint directly
- Review error logs

---

## Success Criteria

Deployment is successful when:

- [x] Application is accessible at production URL
- [ ] Session creation works
- [ ] Real-time messaging works
- [ ] AI features work (if API key provided)
- [ ] Emotion tracking works
- [ ] All visualizations load
- [ ] No console errors
- [ ] Performance is acceptable (< 3s load time)
- [ ] Mobile responsive
- [ ] Cross-browser compatible

---

## Maintenance Schedule

### Daily
- Monitor error logs
- Check uptime status
- Review user feedback

### Weekly
- Review analytics
- Check performance metrics
- Update dependencies if needed
- Backup database

### Monthly
- Security audit
- Performance optimization
- Feature planning
- User survey

---

## Support Contacts

### Technical Issues
- GitHub Issues: https://github.com/am225723/conres/issues
- Email: [your-email@example.com]

### Service Status
- Vercel Status: https://www.vercel-status.com
- Supabase Status: https://status.supabase.com

### Documentation
- Quick Start: QUICK_START.md
- Debug Report: COMPREHENSIVE_DEBUG_REPORT.md
- Emotion Tracking: EMOTION_TRACKING_README.md

---

## Final Notes

- Keep this checklist updated with each deployment
- Document any issues encountered
- Share learnings with the team
- Celebrate successful deployment! 🎉

---

**Deployment Date:** _______________  
**Deployed By:** _______________  
**Production URL:** _______________  
**Status:** [ ] Complete

---

*Good luck with your deployment! 🚀*