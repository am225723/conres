# Deployment Guide - Couples Texting Module

## Pre-Deployment Checklist

Before deploying, ensure:

- [x] Database schema applied to Supabase
- [x] Local testing completed successfully
- [x] Environment variables configured
- [x] All dependencies installed
- [x] Build process tested locally

## Deployment Options

### Option 1: Vercel (Recommended)

Vercel is the recommended platform for deploying this application.

#### Step 1: Prepare for Deployment

```bash
# Ensure all changes are committed
git add .
git commit -m "Add Supabase-powered Couples Texting module"
git push origin main
```

#### Step 2: Configure Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure environment variables:

```
VITE_SUPABASE_URL=https://vrzpwzwhdikmdmagkbtt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyenB3endoZGlrbWRtYWdrYnR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3ODUyMTAsImV4cCI6MjA3NjM2MTIxMH0.Q4SYhikV38ZcHeIxCo28wWUI1pqDPPz4SKETnzxfCYE

SUPABASE_URL=https://vrzpwzwhdikmdmagkbtt.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyenB3endoZGlrbWRtYWdrYnR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3ODUyMTAsImV4cCI6MjA3NjM2MTIxMH0.Q4SYhikV38ZcHeIxCo28wWUI1pqDPPz4SKETnzxfCYE
```

#### Step 3: Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Test the deployed application
4. Verify real-time features work

#### Step 4: Post-Deployment Testing

Test these features on the deployed site:

- [ ] Session creation
- [ ] Session joining
- [ ] Real-time messaging
- [ ] Tone analysis
- [ ] AI suggestions
- [ ] Multiple users in same session

### Option 2: Netlify

#### Step 1: Build Configuration

Create `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Step 2: Deploy

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

#### Step 3: Configure Environment Variables

In Netlify dashboard:
1. Go to Site Settings > Environment Variables
2. Add the same variables as Vercel

### Option 3: Self-Hosted

#### Requirements
- Node.js 18+
- PM2 or similar process manager
- Nginx or Apache for reverse proxy

#### Step 1: Build

```bash
npm run build
```

#### Step 2: Serve

```bash
# Using serve
npm install -g serve
serve -s dist -l 3000

# Or using PM2
pm2 start npm --name "couples-texting" -- run preview
```

#### Step 3: Configure Reverse Proxy

Nginx example:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGc...` |
| `SUPABASE_URL` | Server-side Supabase URL | Same as above |
| `SUPABASE_ANON_KEY` | Server-side Supabase key | Same as above |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_APP_NAME` | Application name | "ConRes" |
| `VITE_API_TIMEOUT` | API timeout (ms) | 30000 |

## Post-Deployment Configuration

### 1. Supabase Settings

Ensure these are enabled in Supabase:

- **Realtime**: Enabled for all tables
- **API**: Anonymous access allowed
- **CORS**: Your domain added to allowed origins

### 2. Domain Configuration

If using a custom domain:

1. Add domain to Vercel/Netlify
2. Configure DNS records
3. Enable SSL/HTTPS
4. Update CORS settings in Supabase

### 3. Performance Optimization

- Enable Vercel Edge Network
- Configure caching headers
- Enable compression
- Optimize images and assets

## Monitoring and Maintenance

### Health Checks

Monitor these endpoints:

- `/` - Main application
- `/api/create-session-proxy` - Session creation
- `/api/perplexity` - AI suggestions

### Metrics to Track

- Session creation rate
- Message delivery latency
- Real-time connection stability
- API response times
- Error rates

### Logging

Configure logging for:

- Application errors
- API failures
- Database errors
- Real-time disconnections

### Backup Strategy

- Supabase automatic backups (daily)
- Export session data periodically
- Backup environment variables
- Document configuration changes

## Troubleshooting Deployment Issues

### Build Failures

**Issue**: Build fails with module errors
**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Issue**: Environment variables not found
**Solution**: Verify variables are set in deployment platform

### Runtime Errors

**Issue**: "Cannot connect to Supabase"
**Solution**:
- Check environment variables are correct
- Verify Supabase project is active
- Check API keys haven't expired

**Issue**: Real-time not working
**Solution**:
- Verify Realtime is enabled in Supabase
- Check CORS settings
- Verify WebSocket connections aren't blocked

### Performance Issues

**Issue**: Slow message delivery
**Solution**:
- Check Supabase region (should be close to users)
- Verify database indexes are created
- Monitor Supabase performance metrics

**Issue**: High latency
**Solution**:
- Enable CDN/Edge network
- Optimize bundle size
- Use code splitting

## Rollback Procedure

If deployment fails:

1. Revert to previous Git commit
2. Redeploy previous version
3. Verify functionality
4. Investigate and fix issues
5. Redeploy when ready

## Security Considerations

### Production Checklist

- [ ] Environment variables secured
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Error messages don't expose sensitive data
- [ ] Database RLS policies reviewed
- [ ] API keys rotated regularly
- [ ] Monitoring and alerts configured

### Recommended Security Enhancements

1. **Rate Limiting**: Implement rate limiting on API endpoints
2. **Input Validation**: Validate all user inputs
3. **Session Expiry**: Implement session timeout
4. **Audit Logging**: Log all critical operations
5. **Regular Updates**: Keep dependencies updated

## Scaling Considerations

### Current Capacity

- Supabase Free Tier: 500MB database, 2GB bandwidth
- Suitable for: ~100 concurrent sessions

### Scaling Options

1. **Upgrade Supabase Plan**: More database space and bandwidth
2. **Optimize Queries**: Add indexes, optimize real-time subscriptions
3. **Implement Caching**: Cache session data, reduce database calls
4. **Load Balancing**: Distribute traffic across multiple instances

## Support and Resources

- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Vite Docs**: https://vitejs.dev/guide/
- **React Docs**: https://react.dev/

## Deployment Success Criteria

Your deployment is successful when:

- ✅ Application loads without errors
- ✅ Sessions can be created
- ✅ Users can join sessions
- ✅ Messages are delivered in real-time
- ✅ Tone analysis works correctly
- ✅ AI features respond properly
- ✅ Multiple users can chat simultaneously
- ✅ No console errors
- ✅ Performance is acceptable (<2s load time)
- ✅ Mobile devices work correctly

## Next Steps After Deployment

1. Share the URL with users
2. Monitor initial usage
3. Gather feedback
4. Plan feature enhancements
5. Schedule regular maintenance