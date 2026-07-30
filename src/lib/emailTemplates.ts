/**
 * emailTemplates.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized HTML email templates for Mana Delivery transactional emails.
 * All templates are mobile-responsive, inline-styled for email client compat.
 *
 * Templates exported:
 *  • orderConfirmationEmail(...)  – Sent immediately after order placement
 *  • refundProcessedEmail(...)    – Sent when admin approves a refund
 *  • riderAssignedEmail(...)      – Sent when a rider is assigned to an order
 *  • orderDeliveredEmail(...)     – Sent when order is marked delivered
 */

const BRAND_RED = "#c62828";
const BRAND_DARK = "#090405";
const BRAND_GOLD = "#d6a046";

/** Shared header/footer wrappers to avoid repetition */
function emailShell(body: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Mana Delivery</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,${BRAND_RED},#7b0f13);padding:28px 36px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:900;letter-spacing:-0.5px;">🛵 Mana Delivery</h1>
            <p style="margin:6px 0 0;color:#fca5a5;font-size:12px;font-weight:600;">Kagaznagar ki apni delivery service</p>
          </td>
        </tr>

        <!-- Body -->
        ${body}

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:18px 36px;text-align:center;border-top:1px solid #f3f4f6;">
            <p style="margin:0;color:#9ca3af;font-size:11px;">
              © ${new Date().getFullYear()} Mana Delivery, Kagaznagar.<br>
              Questions? Call us at <a href="tel:+919494378247" style="color:${BRAND_RED};">+91 94943 78247</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** A styled info row for order details table */
function detailRow(label: string, value: string, highlight = false): string {
    return `<tr>
      <td style="padding:8px 0;color:#6b7280;font-size:13px;font-weight:600;width:45%;">${label}</td>
      <td style="padding:8px 0;color:${highlight ? BRAND_RED : "#111827"};font-size:13px;font-weight:${highlight ? "900" : "700"};text-align:right;">${value}</td>
    </tr>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDER CONFIRMATION EMAIL
// ─────────────────────────────────────────────────────────────────────────────

export interface OrderConfirmationInput {
    customerName: string;
    orderId: string;        // Last 6 chars uppercase short ID
    orderTotal: number;
    paymentMethod: string;
    deliveryAddress: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    promoDiscount?: number;
    walletUsed?: number;
    tipAmount?: number;
    deliveryFee: number;
    platformFee: number;
    tax: number;
    subtotal: number;
    type: "product" | "service";
    serviceCategory?: string;
}

export function orderConfirmationEmail(input: OrderConfirmationInput): string {
    const fmt = (n: number) => `₹${n.toFixed(2)}`;
    const paymentLabel: Record<string, string> = {
        cod: "Cash on Delivery",
        upi: "UPI",
        razorpay: "Online (Razorpay)",
        wallet: "Wallet",
    };

    const itemsRows =
        input.type === "product" && input.items.length > 0
            ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
              ${input.items
                  .map(
                      (item) => `
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#111827;font-size:13px;font-weight:700;">${item.name}</td>
                  <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:12px;text-align:center;">x${item.quantity}</td>
                  <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#111827;font-size:13px;font-weight:700;text-align:right;">${fmt(item.price * item.quantity)}</td>
                </tr>`
                  )
                  .join("")}
            </table>`
            : input.type === "service"
            ? `<p style="margin:0 0 16px;padding:12px 16px;background:#fef2f2;border-radius:12px;color:${BRAND_RED};font-size:13px;font-weight:700;">Service: ${input.serviceCategory || "Custom Service"}</p>`
            : "";

    const body = `
    <tr><td style="padding:32px 36px;">
      <h2 style="margin:0 0 6px;color:#111827;font-size:20px;font-weight:900;">Order Confirmed! 🎉</h2>
      <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
        Hi <strong style="color:#111827;">${input.customerName}</strong>, your order has been placed successfully.
        We'll start processing it right away.
      </p>

      <!-- Order ID Badge -->
      <div style="background:#fef2f2;border:2px dashed #fca5a5;border-radius:14px;padding:16px 20px;text-align:center;margin-bottom:24px;">
        <p style="margin:0 0 4px;color:${BRAND_RED};font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;">Order ID</p>
        <p style="margin:0;color:${BRAND_RED};font-size:28px;font-weight:900;letter-spacing:6px;font-family:'Courier New',monospace;">#${input.orderId}</p>
      </div>

      <!-- Items -->
      ${itemsRows}

      <!-- Pricing Summary -->
      <table width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid #f3f4f6;padding-top:16px;">
        ${detailRow("Subtotal", fmt(input.subtotal))}
        ${detailRow("Delivery Fee", fmt(input.deliveryFee))}
        ${detailRow("Platform Fee", fmt(input.platformFee))}
        ${detailRow("Tax (5%)", fmt(input.tax))}
        ${input.promoDiscount ? detailRow("Promo Discount", `−${fmt(input.promoDiscount)}`) : ""}
        ${input.walletUsed ? detailRow("Wallet Applied", `−${fmt(input.walletUsed)}`) : ""}
        ${input.tipAmount ? detailRow("Rider Tip", `+${fmt(input.tipAmount)}`) : ""}
        <tr>
          <td colspan="2" style="border-top:2px solid #f3f4f6;padding-top:12px;"></td>
        </tr>
        ${detailRow("Total Paid", fmt(input.orderTotal), true)}
        ${detailRow("Payment", paymentLabel[input.paymentMethod] || input.paymentMethod)}
      </table>

      <!-- Delivery Address -->
      <div style="margin-top:20px;padding:14px 16px;background:#f9fafb;border-radius:12px;">
        <p style="margin:0 0 4px;color:#6b7280;font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;">Delivery Address</p>
        <p style="margin:0;color:#111827;font-size:13px;font-weight:700;line-height:1.5;">${input.deliveryAddress}</p>
      </div>

      <p style="margin:20px 0 0;color:#9ca3af;font-size:12px;line-height:1.6;">
        You can track your order in real-time on the <a href="https://manadelivery.in/profile" style="color:${BRAND_RED};font-weight:700;">Mana Delivery app</a>.
      </p>
    </td></tr>`;

    return emailShell(body);
}

// ─────────────────────────────────────────────────────────────────────────────
// REFUND PROCESSED EMAIL
// ─────────────────────────────────────────────────────────────────────────────

export interface RefundProcessedInput {
    customerName: string;
    orderId: string;
    refundAmount: number;
    refundReason?: string;
    newWalletBalance?: number;
}

export function refundProcessedEmail(input: RefundProcessedInput): string {
    const fmt = (n: number) => `₹${n.toFixed(2)}`;

    const body = `
    <tr><td style="padding:32px 36px;">
      <h2 style="margin:0 0 6px;color:#111827;font-size:20px;font-weight:900;">Refund Processed ✅</h2>
      <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
        Hi <strong style="color:#111827;">${input.customerName}</strong>,
        your refund for order <strong>#${input.orderId}</strong> has been credited to your Mana Delivery wallet.
      </p>

      <!-- Refund Amount Highlight -->
      <div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:2px solid #86efac;border-radius:14px;padding:20px 24px;text-align:center;margin-bottom:24px;">
        <p style="margin:0 0 4px;color:#166534;font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;">Amount Refunded</p>
        <p style="margin:0;color:#15803d;font-size:36px;font-weight:900;">${fmt(input.refundAmount)}</p>
        <p style="margin:6px 0 0;color:#166534;font-size:12px;font-weight:700;">Added to your Mana Wallet</p>
      </div>

      <!-- Details -->
      <table width="100%" cellpadding="0" cellspacing="0">
        ${detailRow("Order ID", `#${input.orderId}`)}
        ${detailRow("Refund Amount", fmt(input.refundAmount), true)}
        ${input.newWalletBalance !== undefined ? detailRow("New Wallet Balance", fmt(input.newWalletBalance)) : ""}
        ${input.refundReason ? detailRow("Reason", input.refundReason) : ""}
      </table>

      <div style="margin-top:24px;padding:14px 16px;background:#fefce8;border-radius:12px;border:1px solid #fde68a;">
        <p style="margin:0;color:#92400e;font-size:12px;font-weight:700;line-height:1.6;">
          💡 Your wallet balance can be used for your next Mana Delivery order directly at checkout.
        </p>
      </div>

      <p style="margin:20px 0 0;color:#9ca3af;font-size:12px;">
        View your wallet at <a href="https://manadelivery.in/profile/wallet" style="color:${BRAND_RED};font-weight:700;">manadelivery.in/profile/wallet</a>
      </p>
    </td></tr>`;

    return emailShell(body);
}

// ─────────────────────────────────────────────────────────────────────────────
// RIDER ASSIGNED EMAIL
// ─────────────────────────────────────────────────────────────────────────────

export interface RiderAssignedInput {
    customerName: string;
    orderId: string;
    riderName: string;
}

export function riderAssignedEmail(input: RiderAssignedInput): string {
    const body = `
    <tr><td style="padding:32px 36px;">
      <h2 style="margin:0 0 6px;color:#111827;font-size:20px;font-weight:900;">Rider Assigned 🛵</h2>
      <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
        Hi <strong style="color:#111827;">${input.customerName}</strong>,
        great news! A delivery rider has been assigned to your order <strong>#${input.orderId}</strong>.
      </p>
      <div style="background:#fef2f2;border-radius:14px;padding:20px 24px;text-align:center;margin-bottom:20px;">
        <p style="margin:0 0 4px;color:${BRAND_RED};font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;">Your Rider</p>
        <p style="margin:0;color:#111827;font-size:22px;font-weight:900;">${input.riderName}</p>
      </div>
      <p style="margin:0;color:#9ca3af;font-size:12px;">
        Track your delivery live at <a href="https://manadelivery.in/profile" style="color:${BRAND_RED};font-weight:700;">manadelivery.in</a>
      </p>
    </td></tr>`;

    return emailShell(body);
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDER DELIVERED EMAIL
// ─────────────────────────────────────────────────────────────────────────────

export interface OrderDeliveredInput {
    customerName: string;
    orderId: string;
    orderTotal: number;
}

export function orderDeliveredEmail(input: OrderDeliveredInput): string {
    const body = `
    <tr><td style="padding:32px 36px;">
      <h2 style="margin:0 0 6px;color:#111827;font-size:20px;font-weight:900;">Order Delivered! 🎉</h2>
      <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
        Hi <strong style="color:#111827;">${input.customerName}</strong>,
        your Mana Delivery order <strong>#${input.orderId}</strong> has been delivered successfully. Enjoy!
      </p>
      <div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:2px solid #86efac;border-radius:14px;padding:20px 24px;text-align:center;margin-bottom:24px;">
        <p style="margin:0 0 4px;color:#166534;font-size:36px;">✓</p>
        <p style="margin:0;color:#15803d;font-size:16px;font-weight:900;">Successfully Delivered</p>
      </div>
      <p style="margin:0 0 16px;color:#6b7280;font-size:13px;line-height:1.6;">
        We hope you loved your order! Rate your experience and help us improve.
      </p>
      <div style="text-align:center;">
        <a href="https://manadelivery.in/profile" style="display:inline-block;background:${BRAND_RED};color:#fff;padding:12px 28px;border-radius:12px;font-size:13px;font-weight:900;text-decoration:none;letter-spacing:0.5px;">
          Rate Your Order
        </a>
      </div>
    </td></tr>`;

    return emailShell(body);
}
