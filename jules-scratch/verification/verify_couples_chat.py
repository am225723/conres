from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Capture and print console logs
    page.on("console", lambda msg: print(f"BROWSER LOG: {msg.text}"))

    page.goto("http://localhost:3000")

    # 1. Navigate to the Couples tab
    page.get_by_role("tab", name="Couples").click()

    # 2. Wait for the chat windows to be visible
    user1_chat = page.locator(".user1-chat")
    user2_chat = page.locator(".user2-chat")
    expect(user1_chat).to_be_visible()
    expect(user2_chat).to_be_visible()

    # 3. User 1 sends a message
    user1_input = user1_chat.get_by_placeholder("Type a message...")
    user1_input.fill("Hello from User 1!")
    user1_chat.get_by_role("button", name="Send").click()

    # 4. Give Pusher a moment to deliver the message
    page.wait_for_timeout(2000)

    # 5. Verify User 2 receives the message
    expect(user2_chat.locator("text=User1: Hello from User 1!")).to_be_visible()

    # 6. User 2 sends a reply
    user2_input = user2_chat.get_by_placeholder("Type a message...")
    user2_input.fill("Hello back from User 2!")
    user2_chat.get_by_role("button", name="Send").click()

    # 7. Give Pusher a moment to deliver the message
    page.wait_for_timeout(2000)

    # 8. Verify User 1 receives the reply
    expect(user1_chat.locator("text=User2: Hello back from User 2!")).to_be_visible()

    # 9. Take a final screenshot
    page.screenshot(path="jules-scratch/verification/final_verification.png")

    print("Successfully verified the two-party chat simulation.")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)