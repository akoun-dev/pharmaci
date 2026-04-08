/**
 * QR Code Generator - Version améliorée pour Pharma CI
 *
 * Génère des QR codes professionnels avec :
 * - Couleurs teal/vert évoquant la santé et la confiance
 * - Symbole de croix médicale au centre
 * - Bordures arrondies modernes
 * - Nom de l'application pour la reconnaissance de marque
 * - Design scannable et lisible
 */

interface QRCodeOptions {
  value: string;
  size?: number;
  filename?: string;
  verificationCode?: string;
}

/**
 * Crée un QR Code stylisé pour Pharma CI
 */
export async function generateStyledQRCode(options: QRCodeOptions): Promise<string> {
  const { value, size = 400, filename = 'pharmaci-qr', verificationCode } = options;

  // Importer qrcode library
  const QRCode = (await import('qrcode')).default;

  // Créer un canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Impossible de créer le contexte canvas');

  // Taille du canvas avec marges pour le branding
  const padding = 40;
  const qrSize = size;
  const headerHeight = 60;
  const footerHeight = verificationCode ? 50 : 0;
  const canvasSize = qrSize + padding * 2 + headerHeight + footerHeight;

  canvas.width = canvasSize;
  canvas.height = canvasSize;

  // Fond principal avec dégradé subtil
  const gradient = ctx.createLinearGradient(0, 0, canvasSize, canvasSize);
  gradient.addColorStop(0, '#f0fdfa'); // teal-50
  gradient.addColorStop(1, '#ecfdf5'); // teal-50/50
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  // Bordure arrondie principale
  ctx.strokeStyle = '#14b8a6'; // teal-500
  ctx.lineWidth = 3;
  roundRect(ctx, 10, 10, canvasSize - 20, canvasSize - 20, 20);
  ctx.stroke();

  // === HEADER avec logo Pharma CI ===
  ctx.fillStyle = '#0d9488'; // teal-600
  roundRect(ctx, 20, 20, canvasSize - 40, headerHeight, 12);
  ctx.fill();

  // Logo/Texte Pharma CI
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PHARMA CI', canvasSize / 2, 20 + headerHeight / 2);

  // === GÉNÉRATION DU QR CODE ===
  const qrDataUrl = await QRCode.toDataURL(value, {
    width: qrSize,
    margin: 0,
    color: {
      dark: '#0f766e', // teal-700
      light: '#ffffff',
    },
    errorCorrectionLevel: 'M',
  });

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      // Dessiner le QR code avec ombre
      const qrY = 20 + headerHeight + padding;
      const qrX = (canvasSize - qrSize) / 2;

      // Ombre portée
      ctx.shadowColor = 'rgba(20, 184, 166, 0.3)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 10;

      // Fond blanc pour le QR code
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 16);
      ctx.fill();

      // Reset ombre
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Dessiner le QR code
      ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

      // === CROIX MÉDICALE AU CENTRE ===
      const crossSize = 24;
      const crossX = canvasSize / 2;
      const crossY = qrY + qrSize / 2;

      // Cercle de fond pour la croix
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(crossX, crossY, crossSize + 4, 0, Math.PI * 2);
      ctx.fill();

      // Bordure du cercle
      ctx.strokeStyle = '#14b8a6'; // teal-500
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(crossX, crossY, crossSize + 4, 0, Math.PI * 2);
      ctx.stroke();

      // Dessiner la croix
      ctx.fillStyle = '#f97316'; // orange-600
      const barWidth = 6;
      const barLength = crossSize * 0.8;

      // Barre verticale
      ctx.fillRect(crossX - barWidth / 2, crossY - barLength / 2, barWidth, barLength);

      // Barre horizontale
      ctx.fillRect(crossX - barLength / 2, crossY - barWidth / 2, barLength, barWidth);

      // === FOOTER avec code de vérification ===
      if (verificationCode) {
        const footerY = qrY + qrSize + padding + 10;

        // Fond du footer
        ctx.fillStyle = '#f0fdfa'; // teal-50
        roundRect(ctx, 30, footerY, canvasSize - 60, footerHeight - 10, 10);
        ctx.fill();

        ctx.strokeStyle = '#14b8a6'; // teal-500
        ctx.lineWidth = 1;
        roundRect(ctx, 30, footerY, canvasSize - 60, footerHeight - 10, 10);
        ctx.stroke();

        // Texte "Code de vérification"
        ctx.fillStyle = '#0d9488'; // teal-600
        ctx.font = '12px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CODE DE VÉRIFICATION', canvasSize / 2, footerY + 18);

        // Code de vérification en grand
        ctx.fillStyle = '#0f766e'; // teal-700
        ctx.font = 'bold 20px "SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace';
        ctx.fillText(verificationCode, canvasSize / 2, footerY + 38);
      }

      // Retourner l'image en base64
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => {
      reject(new Error('Erreur lors du chargement du QR code'));
    };

    img.src = qrDataUrl;
  });
}

/**
 * Fonction utilitaire pour dessiner un rectangle arrondi
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Télécharge le QR Code stylisé
 */
export async function downloadStyledQRCode(options: QRCodeOptions): Promise<void> {
  try {
    const dataUrl = await generateStyledQRCode(options);

    const link = document.createElement('a');
    link.download = `${options.filename || 'pharmaci-qr'}.png`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Erreur lors de la génération du QR code:', error);
    throw error;
  }
}

/**
 * Génère un QR Code stylisé et retourne l'URL de l'image
 */
export async function generateStyledQRCodeDataUrl(options: QRCodeOptions): Promise<string> {
  return generateStyledQRCode(options);
}
