from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://localhost:3000/couples")

        # Create a new session
        page.get_by_placeholder("Enter your nickname").fill("Jules")
        page.get_by_role("button", name="Create New Session").click()
        expect(page.get_by_role("heading", name="Session:")).to_be_visible()

        # Type a message and verify impact preview and text box color
        message_input = page.get_by_placeholder("Type a message...")
        message_input.fill("This is a calm message.")
        expect(page.locator("*:has-text('Impact Preview:')")).to_contain_text("Calm")
        expect(message_input).to_have_css("background-color", "rgb(160, 210, 235)") # #A0D2EB

        # Send the message and verify chat background color
        page.get_by_role("button", name="Send").click()
        chat_area = page.locator(".flex-grow.p-4.overflow-y-auto.space-y-4")
        expect(chat_area).to_have_css("background-color", "rgb(160, 210, 235)")

        # Click "Suggest a Reply" and verify modal opens
        page.get_by_role("button", name="Suggest a Reply").click()
        expect(page.get_by_role("heading", name="Suggest a Reply")).to_be_visible()

        # Close the modal
        page.get_by_role("button", name="×").click()
        expect(page.get_by_role("heading", name="Suggest a Reply")).not_to_be_visible()

        # Invite partner button is visible
        expect(page.get_by_role("button", name="Invite Partner")).to_be_visible()

        page.screenshot(path="jules-scratch/verification/verification.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run_verification(playwright)
