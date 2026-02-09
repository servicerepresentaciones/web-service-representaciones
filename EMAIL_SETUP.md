# Sistema de Envío de Correos - Instrucciones de Instalación

## 📧 Descripción
Este sistema permite enviar notificaciones por correo electrónico cuando los usuarios completan el formulario de contacto o el libro de reclamaciones.

## 🚀 Instalación en cPanel

### Paso 1: Compilar el Proyecto
```bash
npm run build
```

### Paso 2: Subir Archivos al Hosting
1. Sube todo el contenido de la carpeta `dist/` a la carpeta `public_html` de tu hosting cPanel
2. Los archivos PHP ya están incluidos en la carpeta `dist/`:
   - `send-email.php` - Script principal de envío
   - `email-config.json` - Archivo de configuración

### Paso 3: Configurar los Correos
1. Accede al panel de administración: `tudominio.com/admin`
2. Ve a **"Envío de Correos"** en el menú lateral
3. Configura:
   - **Correo para Formulario de Contacto**: Donde llegarán los mensajes del formulario
   - **Correo para Libro de Reclamaciones**: Donde llegarán las reclamaciones
   - **Nombre del Remitente**: Cómo aparecerá el remitente
   - **Email del Remitente**: Email que aparecerá como remitente

4. (Opcional) Configura SMTP si tu hosting lo requiere:
   - Activa "Habilitar SMTP"
   - Completa los datos de tu servidor SMTP
   - Para Gmail:
     - Host: `smtp.gmail.com`
     - Puerto: `587`
     - Seguridad: `TLS`
     - Usuario: tu correo de Gmail
     - Contraseña: [Contraseña de aplicación](https://support.google.com/accounts/answer/185833)

5. Haz clic en **"Guardar Configuración"**
6. Se descargará el archivo `email-config.json`
7. Sube este archivo a la carpeta raíz de tu hosting (donde está `send-email.php`)

### Paso 4: Verificar Permisos
Asegúrate de que los archivos tengan los permisos correctos:
- `send-email.php`: 644
- `email-config.json`: 644

## 📝 Notas Importantes

### Función mail() de PHP
Si NO usas SMTP, el sistema usará la función `mail()` nativa de PHP. Asegúrate de que:
- Tu hosting tenga configurado el envío de correos
- Los correos no caigan en spam (configura SPF, DKIM, DMARC en tu dominio)

### SMTP (Recomendado)
Para mayor confiabilidad, usa SMTP:
1. Instala PHPMailer en tu servidor (si no está instalado):
   ```bash
   composer require phpmailer/phpmailer
   ```
2. Configura SMTP en el panel de administración

### Pruebas
Después de configurar:
1. Envía un mensaje de prueba desde el formulario de contacto
2. Envía una reclamación de prueba desde el libro de reclamaciones
3. Verifica que los correos lleguen a las direcciones configuradas

## 🔧 Solución de Problemas

### Los correos no llegan
1. Verifica que `email-config.json` esté en la carpeta correcta
2. Revisa los logs de error de PHP en cPanel
3. Verifica que tu hosting permita el envío de correos
4. Prueba con SMTP si la función `mail()` no funciona

### Error 500
1. Verifica los permisos de los archivos
2. Revisa los logs de error de PHP
3. Asegúrate de que el archivo `email-config.json` tenga formato JSON válido

### Los correos van a spam
1. Configura SPF, DKIM y DMARC en tu dominio
2. Usa SMTP con un servidor confiable (Gmail, SendGrid, etc.)
3. Usa un correo del mismo dominio como remitente

## 📞 Soporte
Si tienes problemas, contacta al desarrollador del proyecto.
