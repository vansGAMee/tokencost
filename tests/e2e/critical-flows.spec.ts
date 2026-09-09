import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("calculator counts code and updates real input cost", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/tokens · exact/i).first()).not.toContainText(
    /^0 tokens/,
  );
  const model = page.locator("label.model-select:visible select");
  await model.selectOption("gpt-5.6-luna");
  await expect(model).toHaveValue("gpt-5.6-luna");
  await page.getByLabel("Language").selectOption("cpp");
  await expect(page.getByLabel("Language")).toHaveValue("cpp");
});

test("animated cost never clips standard or long values", async ({ page }) => {
  await page.goto("/");
  const cost = page.locator(".cost-value:visible");
  await expect(cost).toHaveAttribute("data-length", "standard");
  const referenceGeometry = await cost.evaluate((node) => {
    const style = getComputedStyle(node);
    const faceStyle = getComputedStyle(
      node.querySelector<HTMLElement>(".animated-value__face")!,
    );
    return {
      fontSize: Number.parseFloat(style.fontSize),
      fontWeight: Number.parseInt(style.fontWeight, 10),
      glyphEndPadding: Number.parseFloat(faceStyle.paddingInlineEnd),
      letterSpacing: Number.parseFloat(faceStyle.letterSpacing),
      lineHeight: Number.parseFloat(style.lineHeight),
      marginTop: style.marginTop,
      overflow: style.overflow,
    };
  });
  expect(referenceGeometry.overflow).toBe("visible");
  expect(referenceGeometry.glyphEndPadding).toBeGreaterThan(
    Math.abs(referenceGeometry.letterSpacing),
  );
  expect(referenceGeometry.fontWeight).toBeGreaterThanOrEqual(600);
  if ((page.viewportSize()?.width ?? 0) >= 900) {
    expect(referenceGeometry.marginTop).toBe("23px");
    expect(referenceGeometry.lineHeight / referenceGeometry.fontSize).toBeCloseTo(
      0.95,
      2,
    );
  } else {
    expect(referenceGeometry.marginTop).toBe("5px");
    expect(referenceGeometry.lineHeight / referenceGeometry.fontSize).toBeCloseTo(
      1,
      2,
    );
  }

  await page
    .locator("label.model-select:visible select")
    .selectOption("gpt-5.6-luna");
  await page.getByRole("textbox").first().fill("x");
  await expect(cost).toHaveAttribute("data-length", "long");
  await expect(cost.locator(".animated-value__face--entering")).toHaveCSS(
    "animation-name",
    /value-enter.*premium-metal-drift/,
  );

  const container = page
    .locator(".cost-panel:visible, .mobile-summary:visible")
    .first();
  const [costBox, containerBox] = await Promise.all([
    cost.boundingBox(),
    container.boundingBox(),
  ]);
  expect(costBox).not.toBeNull();
  expect(containerBox).not.toBeNull();
  expect(costBox!.x).toBeGreaterThanOrEqual(containerBox!.x);
  expect(costBox!.x + costBox!.width).toBeLessThanOrEqual(
    containerBox!.x + containerBox!.width,
  );
});

test("share link opens a private read-only calculation", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await page
    .getByRole("button", { name: "Share", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Copy short link" }).click();
  await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
  const url = await page.evaluate(() => navigator.clipboard.readText());
  expect(url).toMatch(/\/s\/[A-Za-z0-9_-]{8}$/);
  expect(url.length).toBeLessThan(100);
  await page.goto(url);
  await expect(page.getByText("Shared code calculation")).toBeVisible();
  await expect(page.getByLabel("Shared code")).toBeVisible();
  await expect(page.locator(".shared-code .cm-content")).toHaveAttribute(
    "contenteditable",
    "false",
  );
});

test("share receipt exports as a retina PNG", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Share", exact: true })
    .first()
    .click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PNG" }).click();
  const receipt = await download;
  expect(receipt.suggestedFilename()).toMatch(/^tokencost-.*\.png$/);
  const filePath = await receipt.path();
  expect(filePath).toBeTruthy();
  const bytes = await readFile(filePath!);
  expect(bytes.readUInt32BE(16)).toBe(1200);
  expect(bytes.readUInt32BE(20)).toBe(800);
});

test("rates search and inspector preserve deep-link state", async ({
  page,
}) => {
  await page.goto("/rates");
  await page.getByPlaceholder(/Filter by model/).fill("Anthropic");
  await expect(page.getByRole("row")).toHaveCount(4);
  await page.getByText("Claude Sonnet 5", { exact: true }).click();
  await expect(page).toHaveURL(/model=claude-sonnet-5/);
  await expect(page.getByText("Source provenance")).toBeVisible();
});
