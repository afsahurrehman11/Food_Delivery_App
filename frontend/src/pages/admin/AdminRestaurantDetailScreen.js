import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import AppHeader from '../../components/AppHeader';
import AppButton from '../../components/AppButton';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  getRestaurant,
  updateRestaurant,
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getMenuItemImageUrl,
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
    showAlert(title, message, buttons);
  }
};

const AnimatedSection = ({children, delay = 0, style}) => {
  return (
    <View style={style}>
      {children}
    </View>
  );
};

const AnimatedMenuItem = ({item, index, onDelete, onEdit, imageUrl}) => {
  return (
    <View style={styles.menuCard}>
      {item.has_image ? (
        <Image source={{uri: imageUrl}} style={styles.menuImage} />
      ) : (
        <View style={[styles.menuImage, styles.placeholder]}>
          <Text style={{fontSize: 24}}>🍽️</Text>
        </View>
      )}
      <View style={styles.menuInfo}>
        <Text style={styles.menuName}>{item.name}</Text>
        <View style={styles.menuCatBadge}>
          <Text style={styles.menuCategory}>{item.category}</Text>
        </View>
        <Text style={styles.menuPrice}>Rs. {item.price?.toFixed(2)}</Text>
      </View>
      <TouchableOpacity style={styles.editItemBtn} onPress={onEdit}>
        <Text style={{fontSize: 14}}>✏️</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
        <Text style={{fontSize: 14}}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );
};

const AdminRestaurantDetailScreen = ({route, navigation}) => {
  const {restaurantId, restaurantName} = route.params;
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategory, setItemCategory] = useState('General');
  const [submitting, setSubmitting] = useState(false);
  const [showPricingForm, setShowPricingForm] = useState(false);
  const [deliveryPricing, setDeliveryPricing] = useState([]);
  const [newMaxKm, setNewMaxKm] = useState('');
  const [newCharge, setNewCharge] = useState('');
  const [savingPricing, setSavingPricing] = useState(false);
  const formAnim = useRef(new Animated.Value(0)).current;

  // Restaurant Edit State
  const [showEditRestaurant, setShowEditRestaurant] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCommission, setEditCommission] = useState('');
  const [savingRestaurant, setSavingRestaurant] = useState(false);

  // Menu Item Edit State
  const [editingItem, setEditingItem] = useState(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemDesc, setEditItemDesc] = useState('');
  const [editItemPrice, setEditItemPrice] = useState('');
  const [editItemCategory, setEditItemCategory] = useState('');
  const [savingItem, setSavingItem] = useState(false);

  // Image Upload State
  const [selectedImage, setSelectedImage] = useState(null);
  const [editSelectedImage, setEditSelectedImage] = useState(null);
  const [restaurantImage, setRestaurantImage] = useState(null);
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);
  const restaurantImageRef = useRef(null);

  const handlePickImage = (imageType = 'item') => {
    if (Platform.OS === 'web') {
      const ref = 
        imageType === 'restaurant' ? restaurantImageRef :
        imageType === 'editItem' ? editFileInputRef : 
        fileInputRef;
      if (ref.current) ref.current.click();
    } else {
      // For native, we would use react-native-image-picker
      showAlert('Info', 'Image upload from device is available on web. On mobile, use the web admin panel.');
    }
  };

  const handleFileSelected = (event, imageType = 'item') => {
    const file = event.target.files[0];
    if (file) {
      if (imageType === 'restaurant') {
        setRestaurantImage(file);
      } else if (imageType === 'editItem') {
        setEditSelectedImage(file);
      } else {
        setSelectedImage(file);
      }
    }
  };

  const fetchData = async () => {
    try {
      const [restRes, menuRes] = await Promise.all([
        getRestaurant(restaurantId),
        getMenuItems(restaurantId),
      ]);
      setRestaurant(restRes.data);
      setMenuItems(menuRes.data);
      setDeliveryPricing(restRes.data.delivery_pricing || []);
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

  const handleCreateItem = async () => {
    if (!itemName.trim() || !itemPrice.trim()) {
      showAlert('Error', 'Name and price are required.');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('restaurant_id', restaurantId);
      formData.append('name', itemName.trim());
      formData.append('description', itemDesc.trim());
      formData.append('price', parseFloat(itemPrice));
      formData.append('category', itemCategory.trim() || 'General');
      if (selectedImage) {
        formData.append('image', selectedImage);
      }
      await createMenuItem(formData);
      setItemName('');
      setItemDesc('');
      setItemPrice('');
      setItemCategory('General');
      setSelectedImage(null);
      setShowForm(false);
      fetchData();
      showAlert('Success', 'Menu item created!');
    } catch (e) {
      showAlert('Error', 'Failed to create menu item.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = (itemId, name) => {
    showAlert('Delete', `Delete "${name}"?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMenuItem(itemId);
            fetchData();
          } catch (e) {
            showAlert('Error', 'Failed to delete.');
          }
        },
      },
    ]);
  };

  const handleEditRestaurant = () => {
    if (restaurant) {
      setEditName(restaurant.name || '');
      setEditAddress(restaurant.address || '');
      setEditPhone(restaurant.phone || '');
      setEditCommission(String(restaurant.commission_rate || 10));
      setShowEditRestaurant(true);
    }
  };

  const handleSaveRestaurant = async () => {
    if (!editName.trim() || !editAddress.trim()) {
      showAlert('Error', 'Name and address are required.');
      return;
    }
    setSavingRestaurant(true);
    try {
      const formData = new FormData();
      formData.append('name', editName.trim());
      formData.append('address', editAddress.trim());
      formData.append('phone', editPhone.trim());
      formData.append('commission_rate', parseFloat(editCommission) || 10);
      if (deliveryPricing.length > 0) {
        formData.append('delivery_pricing', JSON.stringify(deliveryPricing));
      }
      if (restaurantImage) {
        formData.append('image', restaurantImage);
      }
      await updateRestaurant(restaurantId, formData);
      setShowEditRestaurant(false);
      setRestaurantImage(null);
      fetchData();
      showAlert('Success', 'Restaurant updated!');
    } catch (e) {
      showAlert('Error', 'Failed to update restaurant.');
    } finally {
      setSavingRestaurant(false);
    }
  };

  const handleStartEditItem = (item) => {
    setEditingItem(item.id);
    setEditItemName(item.name || '');
    setEditItemDesc(item.description || '');
    setEditItemPrice(String(item.price || ''));
    setEditItemCategory(item.category || 'General');
  };

  const handleSaveEditItem = async () => {
    if (!editItemName.trim() || !editItemPrice.trim()) {
      showAlert('Error', 'Name and price are required.');
      return;
    }
    setSavingItem(true);
    try {
      const formData = new FormData();
      formData.append('name', editItemName.trim());
      formData.append('description', editItemDesc.trim());
      formData.append('price', parseFloat(editItemPrice));
      formData.append('category', editItemCategory.trim() || 'General');
      if (editSelectedImage) {
        formData.append('image', editSelectedImage);
      }
      await updateMenuItem(editingItem, formData);
      setEditingItem(null);
      setEditSelectedImage(null);
      fetchData();
      showAlert('Success', 'Menu item updated!');
    } catch (e) {
      showAlert('Error', 'Failed to update menu item.');
    } finally {
      setSavingItem(false);
    }
  };

  const handleAddPricingTier = () => {
    if (!newMaxKm || !newCharge) {
      showAlert('Error', 'Both distance and charge are required.');
      return;
    }
    const km = parseFloat(newMaxKm);
    const charge = parseFloat(newCharge);
    if (isNaN(km) || isNaN(charge) || km <= 0 || charge < 0) {
      showAlert('Error', 'Enter valid numeric values.');
      return;
    }
    setDeliveryPricing(prev => [...prev, {max_distance_km: km, charge}]);
    setNewMaxKm('');
    setNewCharge('');
  };

  const handleRemovePricingTier = idx => {
    setDeliveryPricing(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSavePricing = async () => {
    setSavingPricing(true);
    try {
      await updateRestaurant(restaurantId, {delivery_pricing: deliveryPricing});
      showAlert('Success', 'Delivery pricing saved!');
      setShowPricingForm(false);
    } catch (e) {
      showAlert('Error', 'Failed to save delivery pricing.');
    } finally {
      setSavingPricing(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <AppHeader title={restaurantName} navigation={navigation} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Restaurant Info */}
        {restaurant && (
          <AnimatedSection delay={0} style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <View style={styles.infoIcon}>
                <Text style={{fontSize: 26}}>🏪</Text>
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.infoName}>{restaurant.name}</Text>
                <Text style={styles.infoAddress}>📍 {restaurant.address}</Text>
              </View>
            </View>
            <View style={styles.infoStats}>
              <View style={styles.infoStatItem}>
                <Text style={styles.infoStatVal}>{restaurant.commission_rate}%</Text>
                <Text style={styles.infoStatLbl}>Commission</Text>
              </View>
              {restaurant.phone ? (
                <View style={styles.infoStatItem}>
                  <Text style={styles.infoStatVal}>📞</Text>
                  <Text style={styles.infoStatLbl}>{restaurant.phone}</Text>
                </View>
              ) : null}
            </View>
            <TouchableOpacity style={styles.editRestaurantBtn} onPress={handleEditRestaurant}>
              <Text style={styles.editRestaurantText}>✏️ Edit Restaurant</Text>
            </TouchableOpacity>
            {restaurant.qr_code && (
              <View style={styles.qrContainer}>
                <Text style={styles.qrLabel}>QR Code</Text>
                <Image
                  source={{uri: `data:image/png;base64,${restaurant.qr_code}`}}
                  style={styles.qrImage}
                />
              </View>
            )}
          </AnimatedSection>
        )}

        {/* Edit Restaurant Form */}
        {showEditRestaurant && (
          <AnimatedSection delay={0} style={styles.form}>
            <Text style={styles.formTitle}>Edit Restaurant</Text>
            
            {/* Restaurant Image Upload */}
            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>Restaurant Photo</Text>
              <TouchableOpacity style={styles.imagePickerBtn} onPress={() => handlePickImage('restaurant')}>
                <Text style={styles.imagePickerText}>
                  {restaurantImage ? `📷 ${restaurantImage.name || 'Image selected'}` : '📷 Upload Restaurant Photo'}
                </Text>
              </TouchableOpacity>
              {restaurantImage && (
                <View style={styles.imagePreview}>
                  <Text style={styles.previewLabel}>Preview:</Text>
                  <Image
                    source={{uri: URL.createObjectURL(restaurantImage)}}
                    style={styles.previewImage}
                  />
                </View>
              )}
              {Platform.OS === 'web' && (
                <input
                  ref={restaurantImageRef}
                  type="file"
                  accept="image/*"
                  style={{display: 'none'}}
                  onChange={(e) => handleFileSelected(e, 'restaurant')}
                />
              )}
            </View>

            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Restaurant Name"
                value={editName}
                onChangeText={setEditName}
                placeholderTextColor={COLORS.grey}
              />
            </View>
            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Address"
                value={editAddress}
                onChangeText={setEditAddress}
                placeholderTextColor={COLORS.grey}
              />
            </View>
            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="Phone"
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
                placeholderTextColor={COLORS.grey}
              />
            </View>
            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>Commission Rate %</Text>
              <TextInput
                style={styles.input}
                placeholder="Commission %"
                value={editCommission}
                onChangeText={setEditCommission}
                keyboardType="numeric"
                placeholderTextColor={COLORS.grey}
              />
            </View>
            <View style={styles.formActions}>
              <AppButton
                title="Save"
                onPress={handleSaveRestaurant}
                loading={savingRestaurant}
                style={{flex: 1, marginRight: 8}}
              />
              <AppButton
                title="Cancel"
                variant="outline"
                onPress={() => setShowEditRestaurant(false)}
                style={{flex: 1}}
              />
            </View>
          </AnimatedSection>
        )}

        {/* Delivery Pricing */}
        <AnimatedSection delay={75} style={styles.pricingCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Pricing</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{deliveryPricing.length}</Text>
            </View>
          </View>
          {deliveryPricing.length > 0 ? (
            deliveryPricing.map((tier, idx) => (
              <View key={idx} style={styles.pricingRow}>
                <View style={styles.pricingInfo}>
                  <Text style={styles.pricingKm}>Up to {tier.max_distance_km} km</Text>
                  <Text style={styles.pricingCharge}>Rs. {tier.charge?.toFixed(2)}</Text>
                </View>
                {showPricingForm && (
                  <TouchableOpacity
                    style={styles.pricingRemoveBtn}
                    onPress={() => handleRemovePricingTier(idx)}>
                    <Text style={{fontSize: 12}}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.pricingEmpty}>No delivery pricing tiers configured</Text>
          )}
          {showPricingForm ? (
            <View style={styles.pricingForm}>
              <View style={styles.pricingInputRow}>
                <View style={{flex: 1, marginRight: 8}}>
                  <Text style={styles.inputLabel}>Max Distance (km)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 5"
                    value={newMaxKm}
                    onChangeText={setNewMaxKm}
                    keyboardType="numeric"
                    placeholderTextColor={COLORS.grey}
                  />
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.inputLabel}>Charge (Rs.)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 50"
                    value={newCharge}
                    onChangeText={setNewCharge}
                    keyboardType="numeric"
                    placeholderTextColor={COLORS.grey}
                  />
                </View>
              </View>
              <TouchableOpacity style={styles.pricingAddTierBtn} onPress={handleAddPricingTier}>
                <Text style={styles.pricingAddTierText}>+ Add Tier</Text>
              </TouchableOpacity>
              <View style={styles.formActions}>
                <AppButton
                  title="Save Pricing"
                  onPress={handleSavePricing}
                  loading={savingPricing}
                  style={{flex: 1, marginRight: 8}}
                />
                <AppButton
                  title="Cancel"
                  variant="outline"
                  onPress={() => setShowPricingForm(false)}
                  style={{flex: 1}}
                />
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.pricingEditBtn}
              onPress={() => setShowPricingForm(true)}
              activeOpacity={0.7}>
              <Text style={styles.pricingEditText}>⚙️ Edit Pricing</Text>
            </TouchableOpacity>
          )}
        </AnimatedSection>

        {/* Add Menu Item */}
        {showForm ? (
          <View style={styles.form}>
            <Text style={styles.formTitle}>Add Menu Item</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>Item Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Item Name"
                value={itemName}
                onChangeText={setItemName}
                placeholderTextColor={COLORS.grey}
              />
            </View>
            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={styles.input}
                placeholder="Description (optional)"
                value={itemDesc}
                onChangeText={setItemDesc}
                placeholderTextColor={COLORS.grey}
              />
            </View>
            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>Price</Text>
              <TextInput
                style={styles.input}
                placeholder="Price"
                value={itemPrice}
                onChangeText={setItemPrice}
                keyboardType="numeric"
                placeholderTextColor={COLORS.grey}
              />
            </View>
            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>Category</Text>
              <TextInput
                style={styles.input}
                placeholder="Category"
                value={itemCategory}
                onChangeText={setItemCategory}
                placeholderTextColor={COLORS.grey}
              />
            </View>
            {/* Image Upload */}
            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>Image (optional)</Text>
              <TouchableOpacity style={styles.imagePickerBtn} onPress={() => handlePickImage('item')}>
                <Text style={styles.imagePickerText}>
                  {selectedImage ? `📷 ${selectedImage.name || 'Image selected'}` : '📷 Choose Image'}
                </Text>
              </TouchableOpacity>
              {selectedImage && (
                <Image
                  source={{uri: URL.createObjectURL(selectedImage)}}
                  style={styles.imagePreviewLarge}
                  resizeMode="cover"
                />
              )}
              {Platform.OS === 'web' && (
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{display: 'none'}}
                  onChange={(e) => handleFileSelected(e, 'item')}
                />
              )}
            </View>
            <View style={styles.formActions}>
              <AppButton
                title="Save"
                onPress={handleCreateItem}
                loading={submitting}
                style={{flex: 1, marginRight: 8}}
              />
              <AppButton
                title="Cancel"
                variant="outline"
                onPress={() => { setShowForm(false); setSelectedImage(null); }}
                style={{flex: 1}}
              />
            </View>
          </View>
        ) : (
          <AnimatedSection delay={150}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowForm(true)}
              activeOpacity={0.7}>
              <View style={styles.addIconCircle}>
                <Text style={styles.addIconText}>+</Text>
              </View>
              <Text style={styles.addButtonText}>Add Menu Item</Text>
            </TouchableOpacity>
          </AnimatedSection>
        )}

        {/* Menu Items List */}
        <AnimatedSection delay={250}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Menu Items
            </Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{menuItems.length}</Text>
            </View>
          </View>
        </AnimatedSection>
        {menuItems.map((item, idx) => (
          editingItem === item.id ? (
            <View key={item.id} style={styles.form}>
              <Text style={styles.formTitle}>Edit Menu Item</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>Item Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Item Name"
                  value={editItemName}
                  onChangeText={setEditItemName}
                  placeholderTextColor={COLORS.grey}
                />
              </View>
              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Description"
                  value={editItemDesc}
                  onChangeText={setEditItemDesc}
                  placeholderTextColor={COLORS.grey}
                />
              </View>
              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>Price</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Price"
                  value={editItemPrice}
                  onChangeText={setEditItemPrice}
                  keyboardType="numeric"
                  placeholderTextColor={COLORS.grey}
                />
              </View>
              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>Category</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Category"
                  value={editItemCategory}
                  onChangeText={setEditItemCategory}
                  placeholderTextColor={COLORS.grey}
                />
              </View>
              {/* Image Upload (Edit) */}
              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>New Image (optional)</Text>
                <TouchableOpacity style={styles.imagePickerBtn} onPress={() => handlePickImage('editItem')}>
                  <Text style={styles.imagePickerText}>
                    {editSelectedImage ? `📷 ${editSelectedImage.name || 'Image selected'}` : '📷 Change Image'}
                  </Text>
                </TouchableOpacity>
                {editSelectedImage && (
                  <Image
                    source={{uri: URL.createObjectURL(editSelectedImage)}}
                    style={styles.imagePreviewLarge}
                    resizeMode="cover"
                  />
                )}
                {Platform.OS === 'web' && (
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/*"
                    style={{display: 'none'}}
                    onChange={(e) => handleFileSelected(e, 'editItem')}
                  />
                )}
              </View>
              <View style={styles.formActions}>
                <AppButton
                  title="Save"
                  onPress={handleSaveEditItem}
                  loading={savingItem}
                  style={{flex: 1, marginRight: 8}}
                />
                <AppButton
                  title="Cancel"
                  variant="outline"
                  onPress={() => { setEditingItem(null); setEditSelectedImage(null); }}
                  style={{flex: 1}}
                />
              </View>
            </View>
          ) : (
            <AnimatedMenuItem
              key={item.id}
              item={item}
              index={idx}
              imageUrl={getMenuItemImageUrl(item.id)}
              onEdit={() => handleStartEditItem(item)}
              onDelete={() => handleDeleteItem(item.id, item.name)}
            />
          )
        ))}
        {menuItems.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={styles.emptyText}>No menu items yet</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  content: {padding: SIZES.padding, paddingBottom: 30},
  infoCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    padding: 18,
    marginBottom: 14,
    ...SHADOWS.medium,
  },
  infoHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 14},
  infoIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoName: {fontSize: SIZES.lg, ...FONTS.bold, color: COLORS.text},
  infoAddress: {fontSize: SIZES.sm, color: COLORS.textLight, marginTop: 2},
  infoStats: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  infoStatItem: {alignItems: 'center'},
  infoStatVal: {fontSize: SIZES.lg, color: COLORS.primary, ...FONTS.bold},
  infoStatLbl: {fontSize: SIZES.xs, color: COLORS.textMuted, marginTop: 2},
  qrContainer: {marginTop: 14, alignItems: 'center'},
  qrLabel: {fontSize: SIZES.sm, color: COLORS.textMuted, ...FONTS.semiBold, marginBottom: 8},
  qrImage: {width: 150, height: 150, borderRadius: 12},
  form: {
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    padding: 18,
    marginBottom: 14,
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
    paddingVertical: 11,
    fontSize: SIZES.md,
    color: COLORS.text,
  },
  formActions: {flexDirection: 'row', marginTop: 8},
  addButton: {
    padding: 16,
    borderRadius: SIZES.radiusLg,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 14,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {fontSize: SIZES.lg, ...FONTS.bold, color: COLORS.text},
  countBadge: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginLeft: 10,
  },
  countText: {fontSize: SIZES.xs, color: COLORS.primary, ...FONTS.bold},
  menuCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    marginBottom: 10,
    overflow: 'hidden',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  menuImage: {width: 72, height: 72},
  placeholder: {
    backgroundColor: COLORS.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuInfo: {flex: 1, padding: 12},
  menuName: {fontSize: SIZES.md, ...FONTS.semiBold, color: COLORS.text},
  menuCatBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.secondarySoft,
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 6,
    marginTop: 3,
  },
  menuCategory: {fontSize: SIZES.xs - 1, color: COLORS.secondary, ...FONTS.medium},
  menuPrice: {fontSize: SIZES.md, color: COLORS.primary, ...FONTS.bold, marginTop: 4},
  deleteBtn: {
    padding: 10,
    marginRight: 4,
    backgroundColor: COLORS.dangerLight,
    borderRadius: 8,
    marginLeft: 4,
  },
  empty: {alignItems: 'center', paddingVertical: 40},
  emptyEmoji: {fontSize: 50, marginBottom: 10},
  emptyText: {fontSize: SIZES.base, color: COLORS.textMuted, ...FONTS.semiBold},
  pricingCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    padding: 18,
    marginBottom: 14,
    ...SHADOWS.medium,
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  pricingInfo: {flexDirection: 'row', alignItems: 'center', flex: 1},
  pricingKm: {fontSize: SIZES.md, color: COLORS.text, ...FONTS.medium, flex: 1},
  pricingCharge: {fontSize: SIZES.md, color: COLORS.primary, ...FONTS.bold},
  pricingRemoveBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.dangerLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  pricingEmpty: {fontSize: SIZES.sm, color: COLORS.textMuted, textAlign: 'center', paddingVertical: 12},
  pricingForm: {marginTop: 8},
  pricingInputRow: {flexDirection: 'row', marginBottom: 8},
  pricingAddTierBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: COLORS.secondarySoft,
    borderRadius: SIZES.radius,
    marginBottom: 12,
  },
  pricingAddTierText: {fontSize: SIZES.sm, color: COLORS.secondary, ...FONTS.bold},
  pricingEditBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: COLORS.primarySoft,
    borderRadius: SIZES.radius,
    marginTop: 4,
  },
  pricingEditText: {fontSize: SIZES.sm, color: COLORS.primary, ...FONTS.semiBold},
  editRestaurantBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: COLORS.primarySoft,
    borderRadius: SIZES.radius,
    marginTop: 10,
  },
  editRestaurantText: {fontSize: SIZES.sm, color: COLORS.primary, ...FONTS.semiBold},
  editItemBtn: {
    padding: 10,
    backgroundColor: COLORS.primarySoft,
    borderRadius: 8,
    marginLeft: 4,
  },
  imagePickerBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: SIZES.radius,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  imagePickerText: {
    fontSize: SIZES.sm,
    color: COLORS.primary,
    ...FONTS.semiBold,
  },
  imagePreview: {
    marginTop: 12,
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  imagePreviewLarge: {
    width: '100%',
    height: 200,
    borderRadius: SIZES.radius,
    marginTop: 10,
    backgroundColor: COLORS.border,
  },
  previewLabel: {
    fontSize: SIZES.xs,
    color: COLORS.grey,
    ...FONTS.medium,
    marginBottom: 8,
  },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: SIZES.radius,
    marginTop: 8,
  },
  infoStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});

export default AdminRestaurantDetailScreen;
