from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:3000")

    # Click the "Couples" tab
    couples_tab = page.get_by_role("tab", name="Couples")
    couples_tab.click()

    # Give it a moment to render
    page.wait_for_timeout(1000)

    # Check for the heading using a more reliable selector
    heading = page.locator("h1:has-text('Couples Texting')")
    expect(heading).to_be_visible()

    print("Successfully verified that the Couples Texting component renders.")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)