
<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Gérer les requêtes OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Vérifier que c'est une requête POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Inclure PHPMailer (vous devrez l'installer via Composer)
require_once 'vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

try {
    // Lire les données JSON
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data) {
        throw new Exception('Invalid JSON data');
    }
    
    // Extraire les données
    $clientName = $data['clientName'] ?? '';
    $clientEmail = $data['clientEmail'] ?? '';
    $quoteAmount = $data['quoteAmount'] ?? 0;
    $desiredDate = $data['desiredDate'] ?? '';
    $pdfBase64 = $data['pdfBase64'] ?? '';
    $companySettings = $data['companySettings'] ?? [];
    
    // Vérifications
    if (empty($clientEmail)) {
        throw new Exception('Email client requis');
    }
    
    if (empty($pdfBase64)) {
        throw new Exception('PDF requis');
    }
    
    // Paramètres par défaut
    $defaultSettings = [
        'company_name' => 'MatchMove',
        'company_email' => 'contact@matchmove.fr',
        'company_phone' => '+33 1 23 45 67 89',
        'company_address' => 'France',
        'smtp_enabled' => false,
        'smtp_host' => '',
        'smtp_port' => 587,
        'smtp_username' => '',
        'smtp_password' => ''
    ];
    
    $settings = array_merge($defaultSettings, $companySettings);
    
    // Créer une instance PHPMailer
    $mail = new PHPMailer(true);
    
    // Configuration SMTP si activée
    if ($settings['smtp_enabled'] && !empty($settings['smtp_host'])) {
        $mail->isSMTP();
        $mail->Host = $settings['smtp_host'];
        $mail->SMTPAuth = true;
        $mail->Username = $settings['smtp_username'];
        $mail->Password = $settings['smtp_password'];
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = $settings['smtp_port'];
        
        // Utiliser l'email SMTP comme expéditeur
        $mail->setFrom($settings['smtp_username'], $settings['company_name']);
    } else {
        // Configuration par défaut (mail() function)
        $mail->isMail();
        $mail->setFrom($settings['company_email'], $settings['company_name']);
    }
    
    // Destinataire
    $mail->addAddress($clientEmail, $clientName);
    
    // Sujet
    $mail->Subject = 'Votre devis de déménagement du ' . date('d/m/Y', strtotime($desiredDate));
    
    // Corps HTML
    $mail->isHTML(true);
    $mail->Body = '
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background-color: #22c55e; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .footer { background-color: #f8f9fa; padding: 15px; text-align: center; color: #666; }
            .highlight { background-color: #f0fdf4; padding: 15px; border-left: 4px solid #22c55e; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>' . htmlspecialchars($settings['company_name']) . '</h1>
            <p>Solutions de déménagement professionnelles</p>
        </div>
        
        <div class="content">
            <p>Bonjour ' . htmlspecialchars($clientName ?: 'Madame, Monsieur') . ',</p>
            
            <p>Nous avons le plaisir de vous transmettre votre devis personnalisé pour votre projet de déménagement.</p>
            
            <div class="highlight">
                <h3>📋 DÉTAILS DE VOTRE DEMANDE :</h3>
                <ul>
                    <li><strong>Date souhaitée :</strong> ' . date('d/m/Y', strtotime($desiredDate)) . '</li>
                    <li><strong>Montant du devis :</strong> ' . number_format($quoteAmount, 2, ',', ' ') . ' € TTC</li>
                </ul>
            </div>
            
            <p>📎 Vous trouverez en pièce jointe votre devis détaillé au format PDF.</p>
            
            <div class="highlight">
                <h3>✅ POURQUOI CHOISIR ' . strtoupper(htmlspecialchars($settings['company_name'])) . ' ?</h3>
                <ul>
                    <li>Solutions de déménagement professionnelles et personnalisées</li>
                    <li>Équipe expérimentée et matériel de qualité</li>
                    <li>Assurance tous risques incluse</li>
                    <li>Devis transparent sans surprise</li>
                    <li>Service client disponible 6j/7</li>
                </ul>
            </div>
            
            <p>Ce devis est valable 30 jours à compter de sa date d\'émission. Pour toute question ou pour confirmer votre réservation, n\'hésitez pas à nous contacter.</p>
            
            <p>Nous restons à votre disposition pour vous accompagner dans votre projet de déménagement.</p>
            
            <p>Cordialement,<br>L\'équipe ' . htmlspecialchars($settings['company_name']) . '</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p><strong>📞 Téléphone :</strong> ' . htmlspecialchars($settings['company_phone']) . '<br>
                <strong>📧 Email :</strong> ' . htmlspecialchars($settings['company_email']) . '<br>
                <strong>📍 Adresse :</strong> ' . htmlspecialchars($settings['company_address']) . '</p>
            </div>
        </div>
        
        <div class="footer">
            <p>' . htmlspecialchars($settings['company_name']) . ' - Solutions de déménagement professionnelles<br>
            Votre satisfaction, notre priorité.</p>
        </div>
    </body>
    </html>';
    
    // Ajouter la pièce jointe PDF
    $fileName = 'devis_' . preg_replace('/[^a-zA-Z0-9]/', '_', $clientName ?: 'client') . '_' . date('Y-m-d') . '.pdf';
    $mail->addStringAttachment(base64_decode($pdfBase64), $fileName, 'base64', 'application/pdf');
    
    // Envoyer l'email
    $mail->send();
    
    // Réponse de succès
    echo json_encode([
        'success' => true,
        'message' => 'Email envoyé avec succès',
        'method' => $settings['smtp_enabled'] ? 'SMTP' : 'Mail'
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
