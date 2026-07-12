import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { cloudinaryUrl } from '@/utils/cloudinary';
import { resolveAssetUrl } from '@/utils/assetUrl';
import { getAvatarColor, getInitials } from '@/utils/avatar';
import { colors } from '@/theme';

interface Props {
  uri?: string | null;
  name: string;
  size?: number;
}

/**
 * User avatar photo (Cloudinary-transformed to the rendered size) or a
 * deterministic initials-color fallback (01-DOCUMENTATION.md §8 `Avatar`).
 * A local `file://`/`content://` URI (mid-upload preview) is passed through
 * untransformed since it isn't a Cloudinary asset.
 */
export function Avatar({ uri, name, size = 48 }: Props) {
  const dimension = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    const isLocal = uri.startsWith('file://') || uri.startsWith('content://');
    const source = isLocal ? uri : cloudinaryUrl(resolveAssetUrl(uri), size * 2);
    return <Image source={{ uri: source }} style={[styles.image, dimension]} contentFit="cover" />;
  }

  return (
    <View style={[styles.fallback, dimension, { backgroundColor: getAvatarColor(name) }]}>
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{getInitials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: { backgroundColor: colors.gray100 },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initials: { color: colors.white, fontWeight: '700' },
});
