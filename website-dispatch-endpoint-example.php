<?php
/**
 * GBC Kitchen App - Order Dispatch Endpoint
 * 
 * This PHP script should be placed on your hotel website to handle
 * dispatch notifications from the GBC Kitchen App.
 * 
 * Endpoint URL: https://hotel-website.com/api/order-dispatch
 * Method: POST
 * Content-Type: application/json
 * Authorization: Bearer <supabase-service-role-key>
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, Accept, User-Agent, X-Dispatch-Attempt');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed. Only POST requests are accepted.'
    ]);
    exit();
}

// Configuration
$EXPECTED_BEARER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cW12bWpuZmVlZmVlaXplbGpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjkzMTAwNSwiZXhwIjoyMDcyNTA3MDA1fQ.oGZNAksWjQhRB-NNMe93cPymPAujtamPeicKjvcmt3I';
$DATABASE_HOST = 'localhost';
$DATABASE_NAME = 'hotel_website_db';
$DATABASE_USER = 'your_db_user';
$DATABASE_PASS = 'your_db_password';

// Log function for debugging
function logDispatch($message, $data = null) {
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] $message";
    if ($data) {
        $logEntry .= " | Data: " . json_encode($data);
    }
    error_log($logEntry . "\n", 3, '/var/log/gbc-dispatch.log');
}

try {
    // Verify Authorization header
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
        logDispatch('Missing or invalid Authorization header', ['headers' => $headers]);
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Missing or invalid Authorization header'
        ]);
        exit();
    }
    
    $token = substr($authHeader, 7); // Remove "Bearer " prefix
    if ($token !== $EXPECTED_BEARER_TOKEN) {
        logDispatch('Invalid bearer token', ['provided_token' => substr($token, 0, 20) . '...']);
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid authorization token'
        ]);
        exit();
    }
    
    // Get and validate JSON payload
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        logDispatch('Invalid JSON payload', ['error' => json_last_error_msg(), 'input' => $input]);
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid JSON payload: ' . json_last_error_msg()
        ]);
        exit();
    }
    
    // Validate required fields
    $required_fields = ['order_id', 'status', 'timestamp'];
    foreach ($required_fields as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            logDispatch('Missing required field', ['field' => $field, 'data' => $data]);
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => "Missing required field: $field"
            ]);
            exit();
        }
    }
    
    // Validate status
    if ($data['status'] !== 'dispatched') {
        logDispatch('Invalid status', ['status' => $data['status']]);
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid status. Expected: dispatched'
        ]);
        exit();
    }
    
    // Extract data
    $order_id = $data['order_id'];
    $status = $data['status'];
    $timestamp = $data['timestamp'];
    $dispatched_by = $data['dispatched_by'] ?? 'kitchen_app';
    $app_version = $data['app_version'] ?? 'unknown';
    $notes = $data['notes'] ?? '';
    
    logDispatch('Processing dispatch request', $data);
    
    // Connect to database
    $pdo = new PDO(
        "mysql:host=$DATABASE_HOST;dbname=$DATABASE_NAME;charset=utf8mb4",
        $DATABASE_USER,
        $DATABASE_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
    
    // Check if order exists
    $stmt = $pdo->prepare("SELECT id, status, customer_name FROM orders WHERE id = ? OR order_number = ?");
    $stmt->execute([$order_id, $order_id]);
    $order = $stmt->fetch();
    
    if (!$order) {
        logDispatch('Order not found', ['order_id' => $order_id]);
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Order not found'
        ]);
        exit();
    }
    
    // Check if order is already dispatched
    if ($order['status'] === 'dispatched') {
        logDispatch('Order already dispatched', ['order_id' => $order_id]);
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Order was already dispatched',
            'order_id' => $order_id,
            'current_status' => 'dispatched'
        ]);
        exit();
    }
    
    // Update order status to dispatched
    $stmt = $pdo->prepare("
        UPDATE orders 
        SET status = ?, 
            dispatched_at = ?, 
            dispatched_by = ?,
            updated_at = NOW(),
            dispatch_notes = ?
        WHERE id = ?
    ");
    
    $result = $stmt->execute([
        $status,
        $timestamp,
        $dispatched_by,
        $notes,
        $order['id']
    ]);
    
    if (!$result) {
        logDispatch('Database update failed', ['order_id' => $order_id]);
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to update order status in database'
        ]);
        exit();
    }
    
    // Log successful dispatch
    logDispatch('Order dispatched successfully', [
        'order_id' => $order_id,
        'customer' => $order['customer_name'],
        'dispatched_by' => $dispatched_by,
        'app_version' => $app_version
    ]);
    
    // Optional: Send notification to customer (email, SMS, etc.)
    // sendCustomerNotification($order['id'], 'dispatched');
    
    // Optional: Update external systems (POS, delivery tracking, etc.)
    // updateExternalSystems($order['id'], 'dispatched');
    
    // Return success response
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Order dispatched successfully',
        'order_id' => $order_id,
        'status' => $status,
        'timestamp' => $timestamp,
        'customer_name' => $order['customer_name']
    ]);
    
} catch (PDOException $e) {
    logDispatch('Database error', ['error' => $e->getMessage()]);
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error occurred'
    ]);
    
} catch (Exception $e) {
    logDispatch('General error', ['error' => $e->getMessage()]);
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred while processing the request'
    ]);
}

/**
 * Optional function to send customer notification
 */
function sendCustomerNotification($order_id, $status) {
    // Implement customer notification logic here
    // This could be email, SMS, push notification, etc.
    logDispatch('Customer notification sent', ['order_id' => $order_id, 'status' => $status]);
}

/**
 * Optional function to update external systems
 */
function updateExternalSystems($order_id, $status) {
    // Implement integration with external systems here
    // This could be POS systems, delivery tracking, etc.
    logDispatch('External systems updated', ['order_id' => $order_id, 'status' => $status]);
}

/**
 * Database schema for orders table (MySQL example):
 * 
 * CREATE TABLE orders (
 *     id VARCHAR(255) PRIMARY KEY,
 *     order_number VARCHAR(50) UNIQUE,
 *     customer_name VARCHAR(255),
 *     status ENUM('pending', 'confirmed', 'preparing', 'completed', 'dispatched', 'delivered', 'cancelled'),
 *     total_amount DECIMAL(10,2),
 *     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 *     dispatched_at TIMESTAMP NULL,
 *     dispatched_by VARCHAR(100) NULL,
 *     dispatch_notes TEXT NULL
 * );
 */
?>
