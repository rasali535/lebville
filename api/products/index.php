<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 1. Get the data
$json_path = dirname(__DIR__, 2) . '/products.json';
if (!file_exists($json_path)) {
    echo json_encode(["items" => [], "error" => "Data file not found"]);
    exit;
}

$json_content = file_get_contents($json_path);
if (substr($json_content, 0, 2) === "\xFF\xFE" || substr($json_content, 0, 2) === "\xFE\xFF") {
    $json_content = mb_convert_encoding($json_content, 'UTF-8', 'UTF-16');
}
$products = json_decode($json_content, true);

if (!$products) {
    echo json_encode(["items" => [], "error" => "Invalid JSON data"]);
    exit;
}

// 2. Handle specific endpoints
$slug = $_GET['slug'] ?? null;
if ($slug === 'categories') {
    $categories = array_values(array_unique(array_filter(array_map(function($p) {
        return $p['category'] ?? null;
    }, $products))));
    echo json_encode(["categories" => $categories]);
    exit;
}

if ($slug) {
    foreach ($products as $p) {
        if (($p['slug'] ?? '') === $slug || ($p['id'] ?? '') === $slug) {
            echo json_encode($p);
            exit;
        }
    }
    http_response_code(404);
    echo json_encode(["detail" => "Product not found"]);
    exit;
}

// 3. Filter
$category = $_GET['category'] ?? null;
$tag = $_GET['tag'] ?? null;
$search = $_GET['search'] ?? null;
$sort = $_GET['sort'] ?? null;

$filtered = $products;

if ($category && $category !== 'all') {
    $filtered = array_filter($filtered, function($p) use ($category) {
        return strtolower($p['category'] ?? '') === strtolower($category);
    });
}

if ($tag) {
    $filtered = array_filter($filtered, function($p) use ($tag) {
        return strtolower($p['tag'] ?? '') === strtolower($tag);
    });
}

if ($search) {
    $search = strtolower($search);
    $filtered = array_filter($filtered, function($p) use ($search) {
        return strpos(strtolower($p['name'] ?? ''), $search) !== false || 
               strpos(strtolower($p['description'] ?? ''), $search) !== false;
    });
}

// 4. Sort
if ($sort === 'price_asc') {
    usort($filtered, function($a, $b) { return ($a['price'] ?? 0) <=> ($b['price'] ?? 0); });
} elseif ($sort === 'price_desc') {
    usort($filtered, function($a, $b) { return ($b['price'] ?? 0) <=> ($a['price'] ?? 0); });
} elseif ($sort === 'recent') {
    usort($filtered, function($a, $b) { return ($b['created_at'] ?? '') <=> ($a['created_at'] ?? ''); });
}

$filtered = array_values($filtered);

// 5. Return result
echo json_encode(["items" => $filtered]);
