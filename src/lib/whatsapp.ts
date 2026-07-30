/**
 * whatsapp.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * WhatsApp Business Integration for Mana Delivery (Kagaznagar).
 * Supports:
 *  1. Meta WhatsApp Business Cloud API (Automatic direct messaging)
 *     Req env vars: WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN
 *  2. Multilingual message generation (English, Telugu, Hindi)
 *  3. Fallback `wa.me` URL builder for web/mobile direct click
 */

export type SupportedLang = "en" | "te" | "hi";

export interface WhatsAppMessageInput {
    toPhone: string;
    customerName: string;
    orderShortId: string;
    status: "placed" | "assigned" | "shipped" | "delivered" | "cancelled";
    riderName?: string;
    totalAmount?: number;
    lang?: SupportedLang;
}

/** Format 10-digit number to 91XXXXXXXXXX format for WhatsApp */
export function formatWhatsAppNumber(phone: string): string {
    const clean = phone.replace(/\D/g, "");
    return clean.length === 10 ? `91${clean}` : clean;
}

/**
 * Builds localized text messages for WhatsApp
 */
export function buildLocalizedWhatsAppText(input: WhatsAppMessageInput): string {
    const { customerName, orderShortId, status, riderName, totalAmount, lang = "te" } = input;
    const shortId = orderShortId.toUpperCase();
    const fmtTotal = totalAmount ? `₹${totalAmount.toFixed(2)}` : "";

    if (lang === "te") {
        // Telugu (Local Kagaznagar priority)
        switch (status) {
            case "placed":
                return `నమస్కారం ${customerName}! మనా డెలివరీలో మీ ఆర్డర్ #${shortId} విజయవంతంగా నమోదైంది. మొత్తం: ${fmtTotal}. త్వరలోనే మీ వద్దకు చేరుస్తాము! 🛵`;
            case "assigned":
                return `నమస్కారం ${customerName}! మీ ఆర్డర్ #${shortId} కి డెలివరీ రైడర్ ${riderName || ""} కేటాయించబడ్డారు. డెలివరీ ప్రక్రియ ప్రారంభమైంది!`;
            case "shipped":
                return `నమస్కారం ${customerName}! మీ ఆర్డర్ #${shortId} మీ చిరునామాకు బయలుదేరింది! త్వరలోనే చేరుకుంటుంది. 📦`;
            case "delivered":
                return `నమస్కారం ${customerName}! మీ ఆర్డర్ #${shortId} విజయవంతంగా డెలివరీ చేయబడింది. మనా డెలివరీ ఉపయోగించినందుకు ధన్యవాదాలు! 🌟`;
            case "cancelled":
                return `నమస్కారం ${customerName}! మీ ఆర్డర్ #${shortId} రద్దు చేయబడింది. రీఫండ్ మీ వాలెట్‌కి జమ చేయబడింది.`;
        }
    } else if (lang === "hi") {
        // Hindi
        switch (status) {
            case "placed":
                return `नमस्ते ${customerName}! मना डिलीवरी पर आपका ऑर्डर #${shortId} सफलतापूर्वक दर्ज कर लिया गया है। कुल: ${fmtTotal}। जल्द ही आपके पास पहुँचेगा! 🛵`;
            case "assigned":
                return `नमस्ते ${customerName}! आपके ऑर्डर #${shortId} के लिए डिलीवरी राइडर ${riderName || ""} को असाइन कर दिया गया है।`;
            case "shipped":
                return `नमस्ते ${customerName}! आपका ऑर्डर #${shortId} डिलीवरी के लिए निकल चुका है! 📦`;
            case "delivered":
                return `नमस्ते ${customerName}! आपका ऑर्डर #${shortId} सफलतापूर्वक डिलीवर हो गया है। मना डिलीवरी का उपयोग करने के लिए धन्यवाद! 🌟`;
            case "cancelled":
                return `नमस्ते ${customerName}! आपका ऑर्डर #${shortId} रद्द कर दिया गया है। रिफंड आपके वॉलेट में जोड़ दिया गया है।`;
        }
    }

    // Default English
    switch (status) {
        case "placed":
            return `Hi ${customerName}! Your Mana Delivery order #${shortId} has been placed successfully. Total: ${fmtTotal}. We're preparing it now! 🛵`;
        case "assigned":
            return `Hi ${customerName}! Rider ${riderName || ""} has been assigned to your order #${shortId}.`;
        case "shipped":
            return `Hi ${customerName}! Your order #${shortId} is out for delivery and will arrive shortly! 📦`;
        case "delivered":
            return `Hi ${customerName}! Your order #${shortId} has been delivered. Thank you for ordering with Mana Delivery! 🌟`;
        case "cancelled":
            return `Hi ${customerName}! Your order #${shortId} was cancelled. Refund has been credited to your wallet.`;
    }
}

/**
 * Builds a direct clickable wa.me URL for fallback redirect
 */
export function buildWhatsAppClickUrl(phone: string, text: string): string {
    const formattedPhone = formatWhatsAppNumber(phone);
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Sends direct WhatsApp message using Meta WhatsApp Cloud API (if configured)
 * Fallback returns wa.me URL for frontend button click.
 */
export async function sendWhatsAppMessage(input: WhatsAppMessageInput): Promise<{
    success: boolean;
    directSent: boolean;
    waUrl: string;
    error?: string;
}> {
    const text = buildLocalizedWhatsAppText(input);
    const waUrl = buildWhatsAppClickUrl(input.toPhone, text);

    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const recipientPhone = formatWhatsAppNumber(input.toPhone);

    if (phoneId && token) {
        try {
            const res = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: recipientPhone,
                    type: "text",
                    text: { body: text },
                }),
            });

            const data = await res.json();
            if (res.ok && data?.messages?.[0]?.id) {
                console.log(`✅ WhatsApp Cloud API message sent to ${recipientPhone} (ID: ${data.messages[0].id})`);
                return { success: true, directSent: true, waUrl };
            } else {
                console.warn("⚠️ WhatsApp Cloud API error response:", data?.error || data);
            }
        } catch (err: any) {
            console.error("❌ WhatsApp Cloud API exception:", err.message);
        }
    }

    // Fallback mode — return clickable URL
    console.log(`💬 [WhatsApp wa.me Ready] To: ${recipientPhone} | Msg: "${text}"`);
    return { success: true, directSent: false, waUrl };
}
