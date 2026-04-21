import React from 'react';
import {Platform, View, Text, Image, StyleSheet} from 'react-native';

const isWeb = Platform.OS === 'web';

/**
 * KhushiBites Logo — renders the exact brand logo PNG image.
 * Accepts a `size` prop to control width/height.
 */
const KhushiBitesLogo = ({size = 44, showText = false}) => {
  if (isWeb) {
    return (
      <View style={{alignItems: 'center'}}>
        <img
          src="/coin.png"
          alt="KhushiBites"
          width={size}
          height={size}
          style={{
            display: 'block',
            objectFit: 'contain',
            mixBlendMode: 'multiply',
          }}
        />
        {showText && (
          <View style={styles.textRow}>
            <Text style={[styles.textOrange, {fontSize: size * 0.38}]}>Khushi</Text>
            <Text style={[styles.textRed, {fontSize: size * 0.38}]}>Bites</Text>
          </View>
        )}
      </View>
    );
  }

  // React Native fallback — uses require (place logo.png in project assets)
  return (
    <View style={{alignItems: 'center'}}>
      <Image
        source={require('../../public/coin.png')}
        style={{width: size, height: size}}
        resizeMode="contain"
      />
      {showText && (
        <View style={styles.textRow}>
          <Text style={[styles.textOrange, {fontSize: size * 0.38}]}>Khushi</Text>
          <Text style={[styles.textRed, {fontSize: size * 0.38}]}>Bites</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  textRow: {
    flexDirection: 'row',
    marginTop: 4,
    alignItems: 'center',
  },
  textOrange: {
    color: '#F97316',
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  textRed: {
    color: '#DC2626',
    fontWeight: '900',
    letterSpacing: -0.5,
  },
});

export default KhushiBitesLogo;

