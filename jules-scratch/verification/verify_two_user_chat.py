from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    # Create a new session
    api_context = playwright.request.new_context()
    response = api_context.post("http://localhost:3000/api/create-session")
    session = response.json()
    session_id = session['sessionId']

    # Create two browser contexts for the two users
    browser = playwright.chromium.launch(headless=True)
    user1_context = browser.new_context()
    user2_context = browser.new_context()

    user1_page = user1_context.new_page()
    user2_page = user2_context.new_page()

    # Navigate both users to the session URL
    user1_page.goto(f"http://localhost:3000/couples/{session_id}")
    user2_page.goto(f"http://localhost:3000/couples/{session_id}")

    # Wait for the chat windows to be visible for both users
    expect(user1_page.locator(".user1-chat")).to_be_visible()
    expect(user1_page.locator(".user2-chat")).to_be_visible()
    expect(user2_page.locator(".user1-chat")).to_be_visible()
    expect(user2_page.locator(".user2-chat")).to_be_visible()

    # Verify that both users are in the session
    expect(user1_page.locator("text=User1")).to_be_visible()
    expect(user1_page.locator("text=User2")).to_be_visible()
    expect(user2_page.locator("text=User1")).to_be_visible()
    expect(user2_page.locator("text=User2")).to_be_visible()

    # User 1 sends a message
    user1_input = user1_page.locator(".user1-chat").get_by_placeholder("Type a message...")
    user1_input.fill("Hello from User 1!")
    user1_page.locator(".user1-chat").get_by_role("button", name="Send").click()

    # Verify User 2 receives the message
    expect(user2_page.locator(".user2-chat").locator("text=User1: Hello from User 1!")).to_be_visible()

    # User 2 sends a reply
    user2_input = user2_page.locator(".user2-chat").get_by_placeholder("Type a message...")
    user2_input.fill("Hello back from User 2!")
    user2_page.locator(".user2-chat").get_by_role("button", name="Send").click()

    # Verify User 1 receives the reply
    expect(user1_page.locator(".user1-chat").locator("text=User2: Hello back from User 2!")).to_be_visible()

    # Take a final screenshot
    user1_page.screenshot(path="jules-scratch/verification/final_verification.png")

    print("Successfully verified the two-user chat simulation.")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)