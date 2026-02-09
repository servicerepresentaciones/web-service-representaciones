<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejo de preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Solo permitir POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit();
}

// Leer configuración de correos desde archivo JSON
$configFile = __DIR__ . '/email-config.json';
$config = [];

if (file_exists($configFile)) {
    $configContent = file_get_contents($configFile);
    $config = json_decode($configContent, true);
}

// Valores por defecto si no existe configuración
$defaultConfig = [
    'contact_email' => 'info@servicerepresentaciones.com',
    'complaints_email' => 'reclamaciones@servicerepresentaciones.com',
    'from_email' => 'noreply@servicerepresentaciones.com',
    'from_name' => 'Service Representaciones',
    'smtp_enabled' => false,
    'smtp_host' => '',
    'smtp_port' => 587,
    'smtp_username' => '',
    'smtp_password' => '',
    'smtp_secure' => 'tls'
];

$config = array_merge($defaultConfig, $config);

// Obtener datos del POST
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['type'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Datos inválidos']);
    exit();
}

$type = $data['type']; // 'contact' o 'complaint'
$formData = $data['data'];

// Función para enviar correo
function sendEmail($to, $subject, $message, $config) {
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: " . $config['from_name'] . " <" . $config['from_email'] . ">\r\n";
    $headers .= "Reply-To: " . $config['from_email'] . "\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
    
    // Si SMTP está habilitado, usar PHPMailer (requiere instalación)
    if ($config['smtp_enabled'] && class_exists('PHPMailer\PHPMailer\PHPMailer')) {
        require_once __DIR__ . '/vendor/autoload.php';
        
        $mail = new PHPMailer\PHPMailer\PHPMailer(true);
        
        try {
            // Configuración SMTP
            $mail->isSMTP();
            $mail->Host = $config['smtp_host'];
            $mail->SMTPAuth = true;
            $mail->Username = $config['smtp_username'];
            $mail->Password = $config['smtp_password'];
            $mail->SMTPSecure = $config['smtp_secure'];
            $mail->Port = $config['smtp_port'];
            $mail->CharSet = 'UTF-8';
            
            // Remitente y destinatario
            $mail->setFrom($config['from_email'], $config['from_name']);
            $mail->addAddress($to);
            
            // Contenido
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body = $message;
            
            $mail->send();
            return true;
        } catch (Exception $e) {
            error_log("Error enviando email con SMTP: " . $mail->ErrorInfo);
            return false;
        }
    } else {
        // Usar mail() nativo de PHP
        return mail($to, $subject, $message, $headers);
    }
}

// Procesar según el tipo
if ($type === 'contact') {
    // Formulario de contacto
    $to = $config['contact_email'];
    $subject = "Nuevo mensaje de contacto: " . ($formData['subject'] ?? 'Sin asunto');
    
    $message = "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .field { margin-bottom: 15px; }
            .field-label { font-weight: bold; color: #667eea; }
            .field-value { margin-top: 5px; padding: 10px; background: white; border-left: 3px solid #667eea; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h2>📧 Nuevo Mensaje de Contacto</h2>
            </div>
            <div class='content'>
                <div class='field'>
                    <div class='field-label'>Nombre:</div>
                    <div class='field-value'>" . htmlspecialchars($formData['name'] ?? '') . "</div>
                </div>
                <div class='field'>
                    <div class='field-label'>Email:</div>
                    <div class='field-value'>" . htmlspecialchars($formData['email'] ?? '') . "</div>
                </div>
                <div class='field'>
                    <div class='field-label'>Teléfono:</div>
                    <div class='field-value'>" . htmlspecialchars($formData['phone'] ?? 'No proporcionado') . "</div>
                </div>
                <div class='field'>
                    <div class='field-label'>Tipo de Cliente:</div>
                    <div class='field-value'>" . htmlspecialchars($formData['client_type'] === 'natural' ? 'Persona Natural' : 'Empresa') . "</div>
                </div>";
    
    if (!empty($formData['ruc'])) {
        $message .= "
                <div class='field'>
                    <div class='field-label'>RUC:</div>
                    <div class='field-value'>" . htmlspecialchars($formData['ruc']) . "</div>
                </div>";
    }
    
    $message .= "
                <div class='field'>
                    <div class='field-label'>Interés:</div>
                    <div class='field-value'>" . htmlspecialchars($formData['interest_type'] ?? '') . "</div>
                </div>";
    
    if (!empty($formData['items'])) {
        $message .= "
                <div class='field'>
                    <div class='field-label'>Productos solicitados:</div>
                    <div class='field-value'>";
        foreach ($formData['items'] as $item) {
            $message .= "• " . htmlspecialchars($item['product_name']) . " - Cantidad: " . htmlspecialchars($item['quantity']) . "<br>";
        }
        $message .= "</div></div>";
    }
    
    if (!empty($formData['requested_service'])) {
        $message .= "
                <div class='field'>
                    <div class='field-label'>Servicio solicitado:</div>
                    <div class='field-value'>" . htmlspecialchars($formData['requested_service']) . "</div>
                </div>";
    }
    
    $message .= "
                <div class='field'>
                    <div class='field-label'>Asunto:</div>
                    <div class='field-value'>" . htmlspecialchars($formData['subject'] ?? '') . "</div>
                </div>
                <div class='field'>
                    <div class='field-label'>Mensaje:</div>
                    <div class='field-value'>" . nl2br(htmlspecialchars($formData['message'] ?? '')) . "</div>
                </div>
                <div class='footer'>
                    <p>Este mensaje fue enviado desde el formulario de contacto de Service Representaciones</p>
                    <p>Fecha: " . date('d/m/Y H:i:s') . "</p>
                </div>
            </div>
        </div>
    </body>
    </html>";
    
} elseif ($type === 'complaint') {
    // Libro de reclamaciones
    $to = $config['complaints_email'];
    $subject = "Nueva " . ($formData['claim_type'] ?? 'Reclamación') . " - Libro de Reclamaciones";
    
    $message = "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 700px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 18px; font-weight: bold; color: #f5576c; margin-bottom: 15px; border-bottom: 2px solid #f5576c; padding-bottom: 5px; }
            .field { margin-bottom: 12px; }
            .field-label { font-weight: bold; color: #666; }
            .field-value { margin-top: 3px; padding: 8px; background: white; border-left: 3px solid #f5576c; }
            .alert { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h2>📋 " . htmlspecialchars($formData['claim_type'] ?? 'Reclamación') . " - Libro de Reclamaciones</h2>
            </div>
            <div class='content'>
                <div class='alert'>
                    <strong>⚠️ ATENCIÓN:</strong> Este reclamo debe ser respondido en un plazo no superior a 15 días naturales según la normativa vigente.
                </div>
                
                <div class='section'>
                    <div class='section-title'>1. Datos del Consumidor</div>
                    <div class='field'>
                        <div class='field-label'>Nombre completo:</div>
                        <div class='field-value'>" . htmlspecialchars($formData['first_name'] ?? '') . " " . htmlspecialchars($formData['last_name_1'] ?? '') . " " . htmlspecialchars($formData['last_name_2'] ?? '') . "</div>
                    </div>
                    <div class='field'>
                        <div class='field-label'>Documento:</div>
                        <div class='field-value'>" . htmlspecialchars($formData['document_type'] ?? '') . ": " . htmlspecialchars($formData['document_number'] ?? '') . "</div>
                    </div>
                    <div class='field'>
                        <div class='field-label'>Email:</div>
                        <div class='field-value'>" . htmlspecialchars($formData['email'] ?? '') . "</div>
                    </div>
                    <div class='field'>
                        <div class='field-label'>Teléfono:</div>
                        <div class='field-value'>" . htmlspecialchars($formData['phone'] ?? '') . "</div>
                    </div>
                    <div class='field'>
                        <div class='field-label'>Dirección:</div>
                        <div class='field-value'>" . htmlspecialchars($formData['address'] ?? '') . ", " . htmlspecialchars($formData['district'] ?? '') . ", " . htmlspecialchars($formData['province'] ?? '') . ", " . htmlspecialchars($formData['department'] ?? '') . "</div>
                    </div>";
    
    if (!empty($formData['reference'])) {
        $message .= "
                    <div class='field'>
                        <div class='field-label'>Referencia:</div>
                        <div class='field-value'>" . htmlspecialchars($formData['reference']) . "</div>
                    </div>";
    }
    
    $message .= "
                    <div class='field'>
                        <div class='field-label'>¿Es menor de edad?:</div>
                        <div class='field-value'>" . ($formData['is_minor'] === 'si' ? 'Sí' : 'No') . "</div>
                    </div>
                </div>
                
                <div class='section'>
                    <div class='section-title'>2. Detalle del Reclamo</div>
                    <div class='field'>
                        <div class='field-label'>Tipo:</div>
                        <div class='field-value'>" . htmlspecialchars($formData['claim_type'] ?? '') . "</div>
                    </div>
                    <div class='field'>
                        <div class='field-label'>Tipo de consumo:</div>
                        <div class='field-value'>" . htmlspecialchars($formData['consumption_type'] ?? '') . "</div>
                    </div>";
    
    if (!empty($formData['order_number'])) {
        $message .= "
                    <div class='field'>
                        <div class='field-label'>N° de pedido:</div>
                        <div class='field-value'>" . htmlspecialchars($formData['order_number']) . "</div>
                    </div>";
    }
    
    if (!empty($formData['claimed_amount'])) {
        $message .= "
                    <div class='field'>
                        <div class='field-label'>Monto reclamado:</div>
                        <div class='field-value'>S/. " . htmlspecialchars($formData['claimed_amount']) . "</div>
                    </div>";
    }
    
    $message .= "
                    <div class='field'>
                        <div class='field-label'>Descripción del producto/servicio:</div>
                        <div class='field-value'>" . nl2br(htmlspecialchars($formData['description'] ?? '')) . "</div>
                    </div>";
    
    if (!empty($formData['purchase_date'])) {
        $message .= "
                    <div class='field'>
                        <div class='field-label'>Fecha de compra:</div>
                        <div class='field-value'>" . htmlspecialchars($formData['purchase_date']) . "</div>
                    </div>";
    }
    
    if (!empty($formData['consumption_date_detail'])) {
        $message .= "
                    <div class='field'>
                        <div class='field-label'>Fecha de consumo:</div>
                        <div class='field-value'>" . htmlspecialchars($formData['consumption_date_detail']) . "</div>
                    </div>";
    }
    
    if (!empty($formData['expiry_date'])) {
        $message .= "
                    <div class='field'>
                        <div class='field-label'>Fecha de caducidad:</div>
                        <div class='field-value'>" . htmlspecialchars($formData['expiry_date']) . "</div>
                    </div>";
    }
    
    $message .= "
                    <div class='field'>
                        <div class='field-label'>Detalle de la reclamación/queja:</div>
                        <div class='field-value'>" . nl2br(htmlspecialchars($formData['claim_details'] ?? '')) . "</div>
                    </div>
                    <div class='field'>
                        <div class='field-label'>Pedido del cliente:</div>
                        <div class='field-value'>" . nl2br(htmlspecialchars($formData['customer_request'] ?? '')) . "</div>
                    </div>
                </div>
                
                <div class='footer'>
                    <p>Este reclamo fue registrado en el Libro de Reclamaciones Virtual de Service Representaciones</p>
                    <p>Fecha de registro: " . date('d/m/Y H:i:s') . "</p>
                    <p><strong>Proveedor:</strong> SERVICE REPRESENTACIONES</p>
                </div>
            </div>
        </div>
    </body>
    </html>";
    
} else {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Tipo de formulario no válido']);
    exit();
}

// Enviar el correo
$sent = sendEmail($to, $subject, $message, $config);

if ($sent) {
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Correo enviado correctamente']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al enviar el correo']);
}
?>
