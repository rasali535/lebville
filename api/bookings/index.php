<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$service_name = $input['service_name'] ?? 'Service';
$customer_name = $input['customer_name'] ?? 'Guest';
$phone = $input['phone'] ?? '';
$preferred_date = $input['preferred_date'] ?? '';
$preferred_time = $input['preferred_time'] ?? '';
$guests = $input['guests'] ?? 1;
$notes = $input['notes'] ?? 'None';

$booking_number = 'LBK-' . date('ymd') . '-' . strtoupper(substr(bin2hex(random_bytes(4)), 0, 5));
$whatsapp_num = '26773011600';

$message = "Hello Lebville, I would like to request a booking.\n\n"
         . "Booking: {$booking_number}\nService: {$service_name}\n"
         . "Name: {$customer_name}\nPhone: {$phone}\n"
         . "Preferred date: {$preferred_date}\nPreferred time: {$preferred_time}\n"
         . "Guests: {$guests}\nNotes: {$notes}";

$whatsapp_url = "https://wa.me/{$whatsapp_num}?text=" . rawurlencode($message);

echo json_encode([
    "id" => uniqid(),
    "booking_number" => $booking_number,
    "service_name" => $service_name,
    "customer_name" => $customer_name,
    "phone" => $phone,
    "preferred_date" => $preferred_date,
    "preferred_time" => $preferred_time,
    "guests" => $guests,
    "notes" => $notes,
    "whatsapp_url" => $whatsapp_url,
    "status" => "new",
    "created_at" => date('c'),
]);
