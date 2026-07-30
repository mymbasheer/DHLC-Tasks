/**
 * Utility to compress image files on the client side using Canvas.
 * Shrinks file size by resizing the image (max width/height 1024px)
 * and compressing it to JPEG format with a quality factor.
 */
export function compressImage(file: File, maxWidth = 1024, maxHeight = 1024, quality = 0.7): Promise<Blob> {
  return new Promise((resolve, _reject) => {
    // If not an image, resolve with the original file
    if (!file.type.startsWith('image/')) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(file); // Fallback to original file
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Convert blob to File if needed, or return blob
              resolve(blob);
            } else {
              resolve(file); // Fallback to original file
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = (err) => {
        console.error('Image loading error for compression:', err);
        resolve(file); // Fallback
      };
    };
    
    reader.onerror = (err) => {
      console.error('FileReader error for compression:', err);
      resolve(file); // Fallback
    };
  });
}
