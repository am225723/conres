from playwright.sync_api import Page, expect

def test_couples_messaging(page: Page):
    """
    This test verifies that a user can navigate to the couples messaging feature,
    create a new session, and see the chat interface.
    """
    # 1. Arrange: Go to the application's homepage.
    page.goto("http://localhost:3000")

    # 2. Act: Find the "Couples" tab and click it.
    couples_tab = page.get_by_role("link", name="Couples")
    couples_tab.click()

    # 3. Assert: Check that the URL is correct and the main heading is visible.
    expect(page).to_have_url("http://localhost:3000/couples")
    expect(page.get_by_role("heading", name="Couples Texting")).to_be_visible()

    # 4. Act: Click the "Create New Session" button.
    create_session_button = page.get_by_role("button", name="Create New Session")
    create_session_button.click()

    # 5. Assert: Verify that the chat interface is now visible.
    expect(page.get_by_text("Connecting...")).to_be_visible()

    # 6. Screenshot: Capture the final result for visual verification.
    page.screenshot(path="jules-scratch/verification/verification.png")
