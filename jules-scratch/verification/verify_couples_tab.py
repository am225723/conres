from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Listen for console events and print them
    page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))

    page.goto("http://localhost:3000")

    # Click the "Couples" tab
    couples_tab = page.get_by_role("tab", name="Couples")
    couples_tab.click()

    # Give it a moment to render
    page.wait_for_timeout(1000)

    # Take a screenshot
    page.screenshot(path="jules-scratch/verification/verification.png")

    # Expect the heading to be visible
    expect(page.get_by_role("heading", name="Couples Texting")).to_be_visible()

    browser.close()

with sync_playwright() as playwright:
    run(playwright)