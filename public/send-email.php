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

// Helper para leer .env (simple)
function getEnvValue($key) {
    $path = __DIR__ . '/../.env.local';
    if (!file_exists($path)) {
        // Fallback a .env si existe
        $path = __DIR__ . '/../.env';
        if (!file_exists($path)) return null;
    }
    
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        if (trim($name) === $key) return trim($value);
    }
    return null;
}

// Intentar cargar configuración desde Supabase
$supabaseUrl = getEnvValue('VITE_SUPABASE_URL');
$supabaseKey = getEnvValue('VITE_SUPABASE_ANON_KEY');

if ($supabaseUrl && $supabaseKey) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/rest/v1/site_settings?select=*&limit=1');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "apikey: $supabaseKey",
        "Authorization: Bearer $supabaseKey"
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200) {
        $settings = json_decode($response, true);
        if ($settings && is_array($settings) && count($settings) > 0) {
            $s = $settings[0];
            // Mapear campos de Supabase a config local
            $supabaseConfig = [
                'contact_email' => $s['contact_form_recipients'] ?? null,
                'complaints_email' => $s['complaints_form_recipients'] ?? null,
                'from_email' => $s['smtp_from_email'] ?? null,
                'from_name' => $s['smtp_from_name'] ?? null,
                'smtp_enabled' => $s['smtp_enabled'] ?? null,
                'smtp_host' => $s['smtp_host'] ?? null,
                'smtp_port' => $s['smtp_port'] ?? null,
                'smtp_username' => $s['smtp_username'] ?? null,
                'smtp_password' => $s['smtp_password'] ?? null,
                'smtp_secure' => $s['smtp_secure'] ?? null
            ];
            
            // Eliminar valores nulos para no sobrescribir defaults con null
            $supabaseConfig = array_filter($supabaseConfig, function($v) { return !is_null($v); });
            
            // Prioridad: Supabase > JSON > Default
            // Primero mezclamos JSON sobre Default
            $config = array_merge($defaultConfig, $config);
            // Luego mezclamos Supabase sobre el resultado
            $config = array_merge($config, $supabaseConfig);
        } else {
             $config = array_merge($defaultConfig, $config);
        }
    } else {
        $config = array_merge($defaultConfig, $config);
    }
} else {
    $config = array_merge($defaultConfig, $config);
}

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
function sendEmail($to, $subject, $message, $config, $attachments = [], $isCustomerCopy = false) {
    // Si es copia al cliente y no hay email, salir
    if ($isCustomerCopy && empty($to)) return false;

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
            
            // Remitente
            $mail->setFrom($config['from_email'], $config['from_name']);
            
            // Destinatarios (Manejo de múltiples correos separados por coma)
            $recipients = explode(',', $to);
            foreach ($recipients as $recipient) {
                if (filter_var(trim($recipient), FILTER_VALIDATE_EMAIL)) {
                    $mail->addAddress(trim($recipient));
                }
            }
            
            // Adjuntos
            if (!empty($attachments)) {
                foreach ($attachments as $attachment) {
                    if (isset($attachment['content']) && isset($attachment['filename'])) {
                        $content = base64_decode($attachment['content']);
                        $type = $attachment['type'] ?? 'application/pdf';
                        $mail->addStringAttachment($content, $attachment['filename'], 'base64', $type);
                    }
                }
            }
            
            // Contenido
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body = $message;
            
            $mail->send();
            return true;
        } catch (Exception $e) {
            error_log("Error enviando email con SMTP: " . $mail->ErrorInfo . " - TO: " . $to);
            return false;
        }
    } else {
        // Usar mail() nativo de PHP
        // Para garantizar la entrega a múltiples destinatarios en servidores que no soportan cabeceras 'To' múltiples correctamente,
        // enviamos un correo individual a cada destinatario.
        $recipients = explode(',', $to);
        $successCount = 0;
        $attemptedCount = 0;
        
        foreach ($recipients as $recipient) {
            $currentTo = trim($recipient);
            if (!empty($currentTo)) {
                $attemptedCount++;
                // Enviamos individualmente
                if (mail($currentTo, $subject, $message, $headers)) {
                    $successCount++;
                } else {
                    error_log("Fallo mail() nativo a: " . $currentTo);
                }
            }
        }
        
        // Si no había destinatarios válidos, retornamos false, de lo contrario true si se envió al menos uno
        return $attemptedCount === 0 ? false : ($successCount > 0);
    }
}

// Logo URL (Idealmente pasar desde frontend, fallback local o remoto)
$logoUrl = isset($formData['logo_url']) ? $formData['logo_url'] : 'https://placehold.co/200x60?text=Service+Representaciones';

// Procesar según el tipo
if ($type === 'contact') {
    // 1. Correo a la Empresa (Admin)
    // Priorizar el email enviado desde el frontend (base de datos), sino usar config local/default
    $toAdmin = !empty($formData['to_email']) ? $formData['to_email'] : $config['contact_email'];
    $subjectAdmin = "Nuevo mensaje de contacto: " . ($formData['subject'] ?? 'Sin asunto');
    
    $messageAdmin = "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); overflow: hidden; }
            .hero { background: linear-gradient(135deg, #0f172a 0%, #1e40af 100%); color: white; padding: 40px 30px; text-align: center; }
            .hero img { max-height: 60px; margin-bottom: 20px; }
            .content { padding: 30px; }
            .field { margin-bottom: 15px; }
            .field-label { font-weight: bold; color: #1e40af; font-size: 14px; }
            .field-value { margin-top: 5px; padding: 10px; background: #f8f9fa; border-left: 3px solid #3b82f6; border-radius: 4px; font-size: 15px; }
            .footer { background-color: #f4f4f4; text-align: center; padding: 15px; color: #888; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='hero'>
                <img src='" . $logoUrl . "' alt='Service Representaciones'>
                <h2 style='margin:0;'>Nuevo Cliente Potencial</h2>
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
        $messageAdmin .= "
                <div class='field'>
                    <div class='field-label'>RUC:</div>
                    <div class='field-value'>" . htmlspecialchars($formData['ruc']) . "</div>
                </div>";
    }
    
    $messageAdmin .= "
                <div class='field'>
                    <div class='field-label'>Interés:</div>
                    <div class='field-value'>" . htmlspecialchars($formData['interest_type'] ?? '') . "</div>
                </div>";
    
    if (!empty($formData['items'])) {
        $messageAdmin .= "
                <div class='field'>
                    <div class='field-label'>Productos solicitados:</div>
                    <div class='field-value'>";
        foreach ($formData['items'] as $item) {
            $messageAdmin .= "• " . htmlspecialchars($item['product_name']) . " - Cantidad: " . htmlspecialchars($item['quantity']) . "<br>";
        }
        $messageAdmin .= "</div></div>";
    }
    
    if (!empty($formData['requested_service'])) {
        $messageAdmin .= "
                <div class='field'>
                    <div class='field-label'>Servicio solicitado:</div>
                    <div class='field-value'>" . htmlspecialchars($formData['requested_service']) . "</div>
                </div>";
    }
    
    $messageAdmin .= "
                <div class='field'>
                    <div class='field-label'>Asunto:</div>
                    <div class='field-value'>" . htmlspecialchars($formData['subject'] ?? '') . "</div>
                </div>
                <div class='field'>
                    <div class='field-label'>Mensaje:</div>
                    <div class='field-value'>" . nl2br(htmlspecialchars($formData['message'] ?? '')) . "</div>
                </div>
            </div>
            <div class='footer'>
                <p>Mensaje enviado desde el sitio web.</p>
                <p>" . date('d/m/Y H:i:s') . "</p>
            </div>
        </div>
    </body>
    </html>";

    $sentAdmin = sendEmail($toAdmin, $subjectAdmin, $messageAdmin, $config);

    // 2. Correo de Confirmación al Cliente
    $sentClient = true;
    if (!empty($formData['email'])) {
        $toClient = $formData['email'];
        $subjectClient = "Hemos recibido tu mensaje - Service Representaciones";
        
        $messageClient = "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); overflow: hidden; }
                .hero { background: linear-gradient(135deg, #0f172a 0%, #1e40af 100%); color: white; padding: 40px 30px; text-align: center; }
                .hero img { max-height: 80px; margin-bottom: 20px; }
                .hero h1 { margin: 0 0 10px 0; font-size: 24px; }
                .content { padding: 30px; text-align: center; }
                .button { display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 30px; font-weight: bold; margin-top: 20px; }
                .footer { background-color: #f4f4f4; text-align: center; padding: 20px; color: #888; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='hero'>
                    <img src='" . $logoUrl . "' alt='Service Representaciones'>
                    <h1>¡Gracias por contactarnos!</h1>
                    <p>Hemos recibido tu solicitud correctamente.</p>
                </div>
                <div class='content'>
                    <p>Hola <strong>" . htmlspecialchars($formData['name'] ?? 'Cliente') . "</strong>,</p>
                    <p>Gracias por tu interés en Service Representaciones. Nuestro equipo revisará tu mensaje y nos pondremos en contacto contigo a la brevedad posible.</p>
                    <p>Si tienes alguna consulta urgente, no dudes en llamarnos directamente.</p>
                    <a href='https://servicerepresentaciones.com' class='button'>Visitar Sitio Web</a>
                </div>
                <div class='footer'>
                    <p>© " . date('Y') . " Service Representaciones. Todos los derechos reservados.</p>
                </div>
            </div>
        </body>
        </html>";
        
        // Enviar confirmación (sin adjuntos y marcando como copia cliente)
        $sentClient = sendEmail($toClient, $subjectClient, $messageClient, $config, [], true);
    }
    
    // Si se envió al admin, consideramos éxito (el del cliente es secundario pero importante)
    $sent = $sentAdmin;

} elseif ($type === 'complaint') {
    // 1. Configurar adjuntos PDF
    $attachments = [];
    if (!empty($formData['pdf_base64'])) {
        $attachments[] = [
            'content' => $formData['pdf_base64'],
            'filename' => 'Reclamacion-' . ($formData['document_number'] ?? 'doc') . '.pdf',
            'type' => 'application/pdf'
        ];
    }

    // 2. Correo a la Empresa (Admin)
    // Priorizar el email enviado desde el frontend (base de datos), sino usar config local/default
    $toAdmin = !empty($formData['to_email']) ? $formData['to_email'] : $config['complaints_email'];
    $subjectAdmin = "NUEVO RECLAMO - Libro de Reclamaciones";
    
    $messageBody = "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 0; border-radius: 8px; overflow: hidden; }
            .header { background: #d32f2f; color: white; padding: 30px; text-align: center; }
            .header img { max-height: 60px; margin-bottom: 15px; display: block; margin: 0 auto 15px auto; filter: brightness(0) invert(1); } /* Force white logo if valid */
            .content { padding: 30px; }
            .footer { background-color: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <img src='" . $logoUrl . "' alt='Service Representaciones'>
                <h2 style='margin:0;'>Nueva Hoja de Reclamación</h2>
            </div>
            <div class='content'>
                <p>Se ha registrado una nueva hoja de reclamación en el sistema.</p>
                <p><strong>Remitente:</strong> " . htmlspecialchars($formData['first_name'] ?? '') . " " . htmlspecialchars($formData['last_name_1'] ?? '') . "</p>
                <p><strong>Documento:</strong> " . htmlspecialchars($formData['document_number'] ?? '') . "</p>
                <p><strong>Tipo:</strong> " . htmlspecialchars($formData['claim_type'] ?? '') . "</p>
                <hr>
                <p>Se adjunta el archivo PDF con el detalle completo de la reclamación.</p>
                <p><em>Por favor atender dentro de los plazos establecidos por ley.</em></p>
            </div>
            <div class='footer'>
                <p>Service Representaciones - Libro de Reclamaciones Virtual</p>
            </div>
        </div>
    </body>
    </html>";

    $sentAdmin = sendEmail($toAdmin, $subjectAdmin, $messageBody, $config, $attachments);

    // 3. Correo al Cliente
    $sentClient = true;
    if (!empty($formData['email'])) {
        $toClient = $formData['email'];
        $subjectClient = "Constancia de " . ($formData['claim_type'] ?? 'Reclamación') . " - Service Representaciones";
        
        $messageClient = "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; }
                .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 0; border-radius: 8px; overflow: hidden; }
                .hero { background: linear-gradient(135deg, #0f172a 0%, #1e40af 100%); color: white; padding: 40px 30px; text-align: center; }
                .hero img { max-height: 60px; margin-bottom: 20px; }
                .hero h1 { margin: 0 0 10px 0; font-size: 24px; }
                .content { padding: 30px; }
                .footer { background-color: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='hero'>
                    <img src='" . $logoUrl . "' alt='Service Representaciones'>
                    <h1 style='margin:0;'>Constancia de Registro</h1>
                </div>
                <div class='content'>
                    <p>Estimado(a) <strong>" . htmlspecialchars($formData['first_name'] ?? 'Cliente') . "</strong>,</p>
                    <p>Hemos recibido su registro en nuestro Libro de Reclamaciones Virtual.</p>
                    <p>Adjunto a este correo encontrará una copia en PDF de su hoja de reclamación con los detalles ingresados.</p>
                    <p>Atenderemos su caso a la brevedad posible dentro del plazo legal establecido.</p>
                </div>
                <div class='footer'>
                    <p>Service Representaciones</p>
                </div>
            </div>
        </body>
        </html>";

        $sentClient = sendEmail($toClient, $subjectClient, $messageClient, $config, $attachments, true);
    }

    $sent = $sentAdmin;

} else {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Tipo de formulario no válido']);
    exit();
}

// Enviar el correo final
if ($sent) {
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Correos enviados correctamente']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al enviar los correos']);
}
?>
