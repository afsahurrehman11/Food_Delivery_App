import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Image,
  Animated,
  Platform,
} from 'react-native';
import AppHeader from '../../components/AppHeader';
import AppButton from '../../components/AppButton';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  getRestaurants,
  createRestaurant,
  deleteRestaurant,
  getRestaurantImageUrl,
} from '../../services/apiService';
import {COLORS, FONTS, SIZES, SHADOWS} from '../../utils/theme';

/* Web-safe alert helper */
const showAlert = (title, message, buttons) => {
  if (Platform.OS === 'web') {
    if (buttons && buttons.length > 1) {
      const confirmed = window.confirm(`${title}\n\n${message}`);
      if (confirmed) {
        const action = buttons.find(b => b.style === 'destructive' || (b.text !== 'Cancel'));
        if (action?.onPress) action.onPress();
      }
    } else {
      window.alert(`${title}\n\n${message}`);
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};

const AnimatedRestaurantCard = ({item, index, onPress, onDelete}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.card}>
      <View>
        <View style={styles.cardMain}>
          {item.has_image ? (
            <Image
              source={{uri: getRestaurantImageUrl(item.id)}}
              style={styles.cardRestaurantImg}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.cardIcon}>
              <Text style={{fontSize: 26}}>🏪</Text>
            </View>
          )}
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <View style={styles.cardDetail}>
              <Text style={styles.detailIcon}>📍</Text>
              <Text style={styles.cardSub} numberOfLines={1}>{item.address}</Text>
            </View>
            <View style={styles.commissionBadge}>
              <Text style={styles.commissionText}>{item.commission_rate}% commission</Text>
            </View>
          </View>
          {item.qr_code && (
            <Image
              source={{uri: `data:image/png;base64,${item.qr_code}`}}
              style={styles.qrImage}
            />
          )}
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
          <Text style={styles.deleteIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const AdminRestaurantsScreen = ({navigation}) => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [commission, setCommission] = useState('10');
  const [submitting, setSubmitting] = useState(false);
  const [restaurantImage, setRestaurantImage] = useState(null);
  const restaurantImageRef = useRef(null);
  const formAnim = useRef(new Animated.Value(0)).current;

  const fetchData = async () => {
    try {
      const res = await getRestaurants();
      setRestaurants(res.data);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    Animated.spring(formAnim, {
      toValue: showForm ? 1 : 0,
      friction: 8,
      useNativeDriver: false,
    }).start();
  }, [showForm]);

  const handleCreate = async () => {
    if (!name.trim() || !address.trim()) {
      showAlert('Error', 'Name and address are required.');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('address', address.trim());
      formData.append('phone', phone.trim());
      formData.append('commission_rate', parseFloat(commission) || 10);
      if (restaurantImage) {
        formData.append('image', restaurantImage);
      }
      await createRestaurant(formData);
      setName('');
      setAddress('');
      setPhone('');
      setCommission('10');
      setRestaurantImage(null);
      setShowForm(false);
      fetchData();
      showAlert('Success', 'Restaurant created!');
    } catch (e) {
      showAlert('Error', 'Failed to create restaurant.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id, restaurantName) => {
    showAlert('Delete', `Delete "${restaurantName}"?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRestaurant(id);
            fetchData();
          } catch (e) {
            showAlert('Error', 'Failed to delete.');
          }
        },
      },
    ]);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <AppHeader title="Restaurants" navigation={navigation} />

      {showForm ? (
        <View style={styles.form}>
          <Text style={styles.formTitle}>New Restaurant</Text>

          {/* Photo Upload */}
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Restaurant Photo</Text>
            <TouchableOpacity
              style={styles.imagePickerBtn}
              onPress={() => { if (restaurantImageRef.current) restaurantImageRef.current.click(); }}>
              <Text style={styles.imagePickerText}>
                {restaurantImage ? `📷  ${restaurantImage.name}` : '📷  Choose Photo (optional)'}
              </Text>
            </TouchableOpacity>
            {restaurantImage && (
              <Image
                source={{uri: URL.createObjectURL(restaurantImage)}}
                style={styles.imagePreview}
                resizeMode="cover"
              />
            )}
            {Platform.OS === 'web' && (
              <input
                ref={restaurantImageRef}
                type="file"
                accept="image/*"
                style={{display: 'none'}}
                onChange={e => { const f = e.target.files[0]; if (f) setRestaurantImage(f); }}
              />
            )}
          </View>

          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Restaurant Name"
              value={name}
              onChangeText={setName}
              placeholderTextColor={COLORS.grey}
            />
          </View>
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Address"
              value={address}
              onChangeText={setAddress}
              placeholderTextColor={COLORS.grey}
            />
          </View>
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="Phone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholderTextColor={COLORS.grey}
            />
          </View>
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Commission Rate %</Text>
            <TextInput
              style={styles.input}
              placeholder="Commission Rate %"
              value={commission}
              onChangeText={setCommission}
              keyboardType="numeric"
              placeholderTextColor={COLORS.grey}
            />
          </View>
          <View style={styles.formActions}>
            <AppButton
              title="Save"
              onPress={handleCreate}
              loading={submitting}
              style={{flex: 1, marginRight: 8}}
            />
            <AppButton
              title="Cancel"
              variant="outline"
              onPress={() => { setShowForm(false); setRestaurantImage(null); }}
              style={{flex: 1}}
            />
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowForm(true)}
          activeOpacity={0.7}>
          <View style={styles.addIconCircle}>
            <Text style={styles.addIconText}>+</Text>
          </View>
          <Text style={styles.addButtonText}>Add Restaurant</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={restaurants}
        keyExtractor={item => item.id}
        renderItem={({item, index}) => (
          <AnimatedRestaurantCard
            item={item}
            index={index}
            onPress={() =>
              navigation.navigate('AdminRestaurantDetail', {
                restaurantId: item.id,
                restaurantName: item.name,
              })
            }
            onDelete={() => handleDelete(item.id, item.name)}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🏪</Text>
            <Text style={styles.emptyText}>No restaurants yet</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  list: {padding: SIZES.padding, paddingTop: 4},
  form: {
    margin: SIZES.padding,
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    padding: 18,
    ...SHADOWS.medium,
  },
  formTitle: {fontSize: SIZES.lg, ...FONTS.bold, color: COLORS.text, marginBottom: 14},
  inputWrap: {marginBottom: 12},
  inputLabel: {fontSize: SIZES.xs, color: COLORS.textMuted, ...FONTS.semiBold, marginBottom: 4, marginLeft: 2},
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: SIZES.md,
    color: COLORS.text,
  },
  formActions: {flexDirection: 'row', marginTop: 8},
  imagePickerBtn: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: SIZES.radius,
    borderStyle: 'dashed',
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  imagePickerText: {color: COLORS.primary, ...FONTS.semiBold, fontSize: SIZES.sm},
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: SIZES.radius,
    marginTop: 10,
    backgroundColor: COLORS.border,
  },
  cardRestaurantImg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    marginRight: 12,
    backgroundColor: COLORS.border,
  },
  addButton: {
    margin: SIZES.padding,
    padding: 16,
    borderRadius: SIZES.radiusLg,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  addIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  addIconText: {fontSize: 18, color: COLORS.primary, ...FONTS.bold},
  addButtonText: {color: COLORS.primary, ...FONTS.semiBold, fontSize: SIZES.base},
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.medium,
  },
  cardMain: {flexDirection: 'row', alignItems: 'center'},
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardContent: {flex: 1},
  cardTitle: {fontSize: SIZES.base, ...FONTS.bold, color: COLORS.text},
  cardDetail: {flexDirection: 'row', alignItems: 'center', marginTop: 3},
  detailIcon: {fontSize: 11, marginRight: 4},
  cardSub: {fontSize: SIZES.xs, color: COLORS.textLight, flex: 1},
  commissionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.secondarySoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 6,
  },
  commissionText: {fontSize: SIZES.xs - 1, color: COLORS.secondary, ...FONTS.semiBold},
  qrImage: {width: 50, height: 50, borderRadius: 8, marginLeft: 8},
  deleteBtn: {
    alignSelf: 'flex-end',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: COLORS.dangerLight,
    borderRadius: 8,
  },
  deleteIcon: {fontSize: 14},
  empty: {flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60},
  emptyEmoji: {fontSize: 50, marginBottom: 12},
  emptyText: {fontSize: SIZES.base, color: COLORS.textMuted, ...FONTS.semiBold},
});

export default AdminRestaurantsScreen;
