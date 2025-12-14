# Testing Guide - Couples Texting Module

## Overview
This guide provides comprehensive testing procedures to verify the Couples Texting module is working correctly.

## Pre-Testing Setup

### 1. Database Setup Verification
```bash
# Run the connection test
cd conres
node test-supabase-connection.js
```

Expected output:
```
🎉 All tests passed! The Supabase integration is working correctly.
```

### 2. Development Server
```bash
npm run dev
```

Server should start on `http://localhost:3000`

## Manual Testing Checklist

### Test 1: Session Creation ✅

**Steps:**
1. Open the application
2. Enter a nickname (e.g., "Alice")
3. Click "Create New Session"

**Expected Results:**
- ✅ Session code appears (8 characters, uppercase)
- ✅ Toast notification shows "Session created!"
- ✅ Redirected to chat interface
- ✅ Session code displayed in header
- ✅ Participant count shows "1 participant online"

**Database Verification:**
```sql
SELECT * FROM sessions ORDER BY created_at DESC LIMIT 1;
-- Should show new session with status 'waiting'

SELECT * FROM participants WHERE session_id = '<session_id>';
-- Should show one participant
```

---

### Test 2: Session Joining ✅

**Steps:**
1. Copy the session code from Test 1
2. Open application in new browser/incognito window
3. Enter a different nickname (e.g., "Bob")
4. Paste session code
5. Click "Join"

**Expected Results:**
- ✅ Successfully joins session
- ✅ Toast notification shows "Joined session successfully!"
- ✅ Redirected to chat interface
- ✅ Participant count shows "2 participants online"
- ✅ Both windows show updated participant count

**Database Verification:**
```sql
SELECT * FROM participants WHERE session_id = '<session_id>';
-- Should show two participants

SELECT * FROM sessions WHERE id = '<session_id>';
-- participant_count should be 2
-- status should be 'active'
```

---

### Test 3: Real-Time Messaging ✅

**Steps:**
1. In Alice's window, type "Hello Bob!"
2. Click Send
3. Observe Bob's window

**Expected Results:**
- ✅ Message appears in Alice's window immediately
- ✅ Message appears in Bob's window within 1 second
- ✅ Message shows correct sender name
- ✅ Message shows tone analysis
- ✅ Timestamp is displayed
- ✅ Message has appropriate color coding

**Database Verification:**
```sql
SELECT * FROM messages WHERE session_id = '<session_id>' ORDER BY created_at;
-- Should show the message with all fields populated
```

---

### Test 4: Tone Analysis ✅

**Steps:**
1. Type different messages and observe tone preview:
   - "I feel happy when we talk" (gentle)
   - "You never listen to me" (firm/accusatory)
   - "I would appreciate if we could discuss this" (balanced)

**Expected Results:**
- ✅ Impact preview updates in real-time
- ✅ Gentle messages show green border
- ✅ Balanced messages show blue border
- ✅ Firm messages show red border
- ✅ Accusatory language is detected and warned

---

### Test 5: Message History Persistence ✅

**Steps:**
1. Send 5-10 messages between Alice and Bob
2. Close Bob's browser
3. Reopen and rejoin the same session

**Expected Results:**
- ✅ All previous messages are displayed
- ✅ Messages are in correct chronological order
- ✅ All tone indicators are preserved
- ✅ Timestamps are correct
- ✅ Auto-scrolls to latest message

---

### Test 6: AI Features (Suggest Reply) ✅

**Steps:**
1. Alice sends: "I'm feeling stressed about work"
2. Bob clicks "Suggest a Reply"
3. Wait for AI response

**Expected Results:**
- ✅ Suggested reply appears in message box
- ✅ Reply is supportive and constructive
- ✅ Toast notification confirms suggestion
- ✅ Bob can edit before sending
- ✅ No errors in console

**Note:** Requires Perplexity API to be configured

---

### Test 7: AI Features (Reword as I-Statement) ✅

**Steps:**
1. Bob types: "You always interrupt me"
2. Click "Reword as I-Statement"
3. Wait for AI response

**Expected Results:**
- ✅ Message is reworded (e.g., "I feel unheard when I'm interrupted")
- ✅ Toast notification confirms reword
- ✅ Reworded message is in message box
- ✅ Bob can edit before sending

**Note:** Requires Perplexity API to be configured

---

### Test 8: Leave Session ✅

**Steps:**
1. Bob clicks "Leave" button
2. Observe both windows

**Expected Results:**
- ✅ Bob returns to session creation screen
- ✅ Alice's window shows updated participant count
- ✅ Bob's participant record marked as inactive
- ✅ No errors in console

**Database Verification:**
```sql
SELECT * FROM participants WHERE session_id = '<session_id>' AND user_id = '<bob_user_id>';
-- is_active should be false
```

---

### Test 9: Rejoin Session ✅

**Steps:**
1. Bob enters the same session code again
2. Click "Join"

**Expected Results:**
- ✅ Successfully rejoins
- ✅ Toast shows "Rejoined session successfully!"
- ✅ All previous messages visible
- ✅ Participant count updates
- ✅ Can send new messages

---

### Test 10: Multiple Messages Rapid Fire ✅

**Steps:**
1. Send 10 messages rapidly from Alice
2. Observe Bob's window

**Expected Results:**
- ✅ All messages appear in Bob's window
- ✅ Messages are in correct order
- ✅ No messages are lost
- ✅ No duplicate messages
- ✅ Performance remains smooth

---

### Test 11: Long Messages ✅

**Steps:**
1. Send a message with 500+ characters
2. Send a message with line breaks

**Expected Results:**
- ✅ Long messages display correctly
- ✅ Text wraps properly
- ✅ Line breaks are preserved
- ✅ Message bubble adjusts size
- ✅ Scrolling works correctly

---

### Test 12: Special Characters ✅

**Steps:**
1. Send messages with:
   - Emojis: "I love you! ❤️😊"
   - Special chars: "What?! @#$%"
   - Unicode: "Café, naïve, 日本語"

**Expected Results:**
- ✅ All characters display correctly
- ✅ No encoding issues
- ✅ Emojis render properly
- ✅ Database stores correctly

---

### Test 13: Session Code Validation ✅

**Steps:**
1. Try to join with invalid codes:
   - Empty code
   - Too short (less than 8 chars)
   - Non-existent code
   - Lowercase letters

**Expected Results:**
- ✅ Empty code shows error
- ✅ Invalid code shows error
- ✅ Non-existent code shows error
- ✅ Lowercase automatically converts to uppercase

---

### Test 14: Nickname Validation ✅

**Steps:**
1. Try to create/join without nickname
2. Try very long nickname (100+ chars)
3. Try nickname with special characters

**Expected Results:**
- ✅ Empty nickname shows error
- ✅ Long nickname is truncated to 50 chars
- ✅ Special characters are allowed
- ✅ Nickname is stored correctly

---

### Test 15: Browser Compatibility ✅

**Test on multiple browsers:**
- Chrome/Chromium
- Firefox
- Safari
- Edge

**Expected Results:**
- ✅ Works on all major browsers
- ✅ Real-time updates work
- ✅ UI renders correctly
- ✅ No browser-specific errors

---

### Test 16: Mobile Responsiveness ✅

**Steps:**
1. Open on mobile device or use browser dev tools
2. Test all features

**Expected Results:**
- ✅ Layout adapts to mobile screen
- ✅ Touch interactions work
- ✅ Keyboard doesn't obscure input
- ✅ Messages are readable
- ✅ Buttons are tappable

---

### Test 17: Network Interruption ✅

**Steps:**
1. Start a session
2. Disable network connection
3. Try to send a message
4. Re-enable network

**Expected Results:**
- ✅ Error message shown when offline
- ✅ Message queued or error displayed
- ✅ Reconnects automatically when online
- ✅ Pending messages sent after reconnection

---

### Test 18: Concurrent Sessions ✅

**Steps:**
1. Create Session A with Alice and Bob
2. Create Session B with Charlie and Diana
3. Send messages in both sessions

**Expected Results:**
- ✅ Messages don't cross between sessions
- ✅ Each session maintains separate state
- ✅ Real-time updates work in both
- ✅ No interference between sessions

---

### Test 19: Session Timeout ✅

**Steps:**
1. Create a session
2. Leave it idle for extended period
3. Try to send a message

**Expected Results:**
- ✅ Session remains active
- ✅ Real-time connection may need reconnect
- ✅ Messages still send after reconnection
- ✅ No data loss

---

### Test 20: Database Triggers ✅

**Verification:**
```sql
-- Check that triggers are working

-- 1. Participant count updates
SELECT id, session_code, participant_count FROM sessions;

-- 2. Last activity updates
SELECT id, session_code, last_activity FROM sessions;

-- 3. Session status changes
SELECT id, session_code, status, participant_count FROM sessions;
```

**Expected Results:**
- ✅ Participant count matches actual participants
- ✅ Last activity updates with new messages
- ✅ Status changes from 'waiting' to 'active' with 2+ participants

---

## Automated Testing (Future Implementation)

### Unit Tests
```javascript
// Example test structure
describe('Supabase Helper Functions', () => {
  test('createSession generates unique code', async () => {
    const result = await createSession();
    expect(result.success).toBe(true);
    expect(result.session.session_code).toHaveLength(8);
  });

  test('joinSession adds participant', async () => {
    const session = await createSession();
    const result = await joinSession(session.session_code, 'user123', 'Test User');
    expect(result.success).toBe(true);
  });
});
```

### Integration Tests
```javascript
describe('Real-time Messaging', () => {
  test('message appears in real-time', async () => {
    // Create session
    // Join from two clients
    // Send message from client 1
    // Verify client 2 receives it
  });
});
```

### E2E Tests (Playwright/Cypress)
```javascript
describe('Complete User Flow', () => {
  test('user can create and join session', async () => {
    // Navigate to app
    // Create session
    // Copy code
    // Open new window
    // Join session
    // Send messages
    // Verify real-time updates
  });
});
```

## Performance Testing

### Load Testing
```bash
# Use Apache Bench or similar
ab -n 1000 -c 10 http://localhost:3000/api/create-session-proxy
```

**Metrics to Monitor:**
- Response time (should be < 500ms)
- Throughput (requests per second)
- Error rate (should be < 1%)
- Database connection pool usage

### Real-time Performance
- Message delivery latency (should be < 1 second)
- Concurrent connections (test with 50+ users)
- Memory usage over time
- CPU usage during peak load

## Security Testing

### Input Validation
- SQL injection attempts
- XSS attempts
- CSRF protection
- Rate limiting

### Authentication
- Session hijacking attempts
- Token validation
- Unauthorized access attempts

## Accessibility Testing

### WCAG 2.1 Compliance
- Keyboard navigation
- Screen reader compatibility
- Color contrast ratios
- Focus indicators
- ARIA labels

## Bug Reporting Template

When reporting bugs, include:

```markdown
**Bug Title:** Brief description

**Severity:** Critical / High / Medium / Low

**Steps to Reproduce:**
1. Step one
2. Step two
3. Step three

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Environment:**
- Browser: Chrome 120
- OS: Windows 11
- Device: Desktop
- Network: WiFi

**Screenshots/Videos:**
Attach if applicable

**Console Errors:**
```
Error messages from console
```

**Database State:**
Relevant database records
```

## Test Results Log

| Test # | Test Name | Status | Date | Tester | Notes |
|--------|-----------|--------|------|--------|-------|
| 1 | Session Creation | ✅ | 2025-01-18 | - | - |
| 2 | Session Joining | ✅ | 2025-01-18 | - | - |
| ... | ... | ... | ... | ... | ... |

## Continuous Testing

### Daily Checks
- [ ] Application loads without errors
- [ ] Sessions can be created
- [ ] Real-time messaging works
- [ ] Database is accessible

### Weekly Checks
- [ ] All manual tests pass
- [ ] Performance metrics acceptable
- [ ] No new console errors
- [ ] Database cleanup running

### Monthly Checks
- [ ] Security audit
- [ ] Performance optimization review
- [ ] User feedback analysis
- [ ] Feature usage statistics

## Conclusion

This testing guide ensures the Couples Texting module is thoroughly validated before deployment and maintains quality over time. Regular testing helps catch issues early and ensures a reliable user experience.