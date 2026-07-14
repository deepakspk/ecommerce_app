import { useState } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Promotion } from '@/types/promotion';
import { cloudinaryUrl } from '@/utils/cloudinary';
import { resolveAssetUrl } from '@/utils/assetUrl';
import { colors, spacing } from '@/theme';

const WIDTH = Dimensions.get('window').width - spacing.lg * 2;
const DEFAULT_ASPECT = 2;

/**
 * Full-width promotional banner (docs/PROMPT-home-screen.md §7): mobile URL
 * with web fallback, natural aspect ratio measured from the loaded image
 * (2:1 until it loads). Non-interactive by design for v1 — the web version
 * isn't linked either.
 */
export function PromoBanner({ promotion }: { promotion: Promotion }) {
  const [aspect, setAspect] = useState(DEFAULT_ASPECT);
  const src = promotion.mobileBannerUrl || promotion.webBannerUrl;
  if (!src) return null;

  return (
    <Image
      source={{ uri: cloudinaryUrl(resolveAssetUrl(src), 800) }}
      style={[styles.image, { aspectRatio: aspect }]}
      contentFit="cover"
      onLoad={(e) => {
        const { width, height } = e.source;
        if (width > 0 && height > 0) setAspect(width / height);
      }}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    width: WIDTH,
    marginHorizontal: spacing.lg,
    borderRadius: 16,
    backgroundColor: colors.gray100,
  },
});
