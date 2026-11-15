import heroBannerImg from '../assets/images/regenerated_image_1794730584122.webp';
import saryMaiJarImg from '../assets/images/product_sary_mai_jar_1794738803072.jpg';
import perfectoLuxImg from '../assets/images/product_perfecto_lux_1794738805329.jpg';
import vitalityLuxImg from '../assets/images/product_vitality_lux_1794738804995.jpg';
import smartLuxPavlovImg from '../assets/images/product_smart_lux_pavlov_1794738805271.jpg';

const IMAGE_MAP: Record<string, string> = {
  '/src/assets/images/regenerated_image_1794730584122.webp': heroBannerImg,
  '/src/assets/images/hero_sary_mai_banner_1794738803636.jpg': heroBannerImg,
  '/src/assets/images/product_sary_mai_jar_1794738803072.jpg': saryMaiJarImg,
  '/src/assets/images/product_perfecto_lux_1794738805329.jpg': perfectoLuxImg,
  '/src/assets/images/product_vitality_lux_1794738804995.jpg': vitalityLuxImg,
  '/src/assets/images/product_smart_lux_pavlov_1794738805271.jpg': smartLuxPavlovImg,
};

export const HERO_BANNER_SRC = heroBannerImg;

export const PRESET_IMAGES = [
  {
    labelKk: 'Таза сары май (әйнек ыдыс)',
    labelRu: 'Чистое сары май (банка)',
    path: '/src/assets/images/product_sary_mai_jar_1794738803072.jpg',
    preview: saryMaiJarImg,
  },
  {
    labelKk: 'Perfecto Lux (бальзам)',
    labelRu: 'Perfecto Lux (бальзам)',
    path: '/src/assets/images/product_perfecto_lux_1794738805329.jpg',
    preview: perfectoLuxImg,
  },
  {
    labelKk: 'Vitality Lux (бальзам)',
    labelRu: 'Vitality Lux (бальзам)',
    path: '/src/assets/images/product_vitality_lux_1794738804995.jpg',
    preview: vitalityLuxImg,
  },
  {
    labelKk: 'Smart Lux / Pavlov Spring',
    labelRu: 'Smart Lux / Pavlov Spring',
    path: '/src/assets/images/product_smart_lux_pavlov_1794738805271.jpg',
    preview: smartLuxPavlovImg,
  },
];

export function resolveProductImage(imageUrl: string): string {
  if (IMAGE_MAP[imageUrl]) {
    return IMAGE_MAP[imageUrl];
  }
  return imageUrl;
}

export async function compressImageFile(file: File, maxDimension = 1000): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
