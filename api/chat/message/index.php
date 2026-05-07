<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);
$message = strtolower($input['message'] ?? '');
$session_id = $input['session_id'] ?? uniqid();

$reply = "";

if (strpos($message, 'product') !== false || strpos($message, 'shop') !== false || strpos($message, 'buy') !== false) {
    $reply = "You can explore our curated collection of luxury clothing and HL/SKIN beauty products on our Shop page. We feature everything from designer monogram coats to our signature lip gloss line. ✦";
} elseif (strpos($message, 'shipping') !== false || strpos($message, 'delivery') !== false) {
    $reply = "We offer free standard delivery across Botswana for orders over BWP 1,000. For smaller orders, a standard fee applies. You'll see the final amount at checkout. ✦";
} elseif (strpos($message, 'makeup') !== false || strpos($message, 'hl/skin') !== false || strpos($message, 'beauty') !== false || strpos($message, 'skin') !== false) {
    $reply = "Our HL/SKIN beauty line is designed for refined elegance. We recommend trying our 'Simply Elegant' Lip Gloss or 'The Fixer' Setting Spray for a flawless finish. All HL/SKIN products are cruelty-free and dermatologist-tested. ✦";
} elseif (strpos($message, 'contact') !== false || strpos($message, 'phone') !== false || strpos($message, 'whatsapp') !== false) {
    $reply = "You can reach us on WhatsApp or call at +267 73 011 600. Our team is also available via email at info@lebvilleboutique.com. ✦";
} elseif (strpos($message, 'location') !== false || strpos($message, 'where') !== false || strpos($message, 'gaborone') !== false) {
    $reply = "Lebville Boutique & Spa is located in Gaborone, Botswana. We invite you to visit our physical location for the full luxury experience, including our world-class spa treatments. ✦";
} elseif (strpos($message, 'spa') !== false || strpos($message, 'massage') !== false || strpos($message, 'facial') !== false) {
    $reply = "Our spa offers a range of exclusive treatments, including manicures, facials, and deep-tissue massages. You can view our services on the home page or contact us to book an appointment. ✦";
} elseif (strpos($message, 'hello') !== false || strpos($message, 'hi') !== false) {
    $reply = "Hello! I am Lebi, your Lebville concierge. How can I assist you with your luxury fashion or beauty journey today? ✦";
} else {
    $reply = "I'm Lebi, and I'd love to help. Could you please tell me more about what you're looking for? You can ask about our products, HL/SKIN beauty line, shipping, or how to contact our Gaborone boutique. ✦";
}

echo json_encode([
    "session_id" => $session_id,
    "reply" => $reply
]);
