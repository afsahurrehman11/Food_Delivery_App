import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import AppHeader from '../../components/AppHeader';
import AppButton from '../../components/AppButton';
import LoadingSpinner from '../../components/LoadingSpinner';
import {getRiders, createRider, updateRider, deleteRider} from '../../services/apiService';
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

const AnimatedRiderCard = ({item, index, onDelete, onEdit}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-25)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {toValue: 1, duration: 400, delay: index * 70, useNativeDriver: false}),
      Animated.timing(translateX, {toValue: 0, duration: 400, delay: index * 70, useNativeDriver: false}),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.card, {opacity, transform: [{translateX}]}]}>
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarText}>🏍️</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{item.name}</Text>
        <View style={styles.phoneRow}>
          <Text style={styles.phoneIcon}>📞</Text>
          <Text style={styles.cardPhone}>{item.phone}</Text>
        </View>
        <View style={styles.ordersBadge}>
          <Text style={styles.ordersText}>
            {item.assigned_orders?.length || 0} orders assigned
          </Text>
        </View>
      </View>
      <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
        <Text style={{fontSize: 14}}>✏️</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
        <Text style={{fontSize: 14}}>🗑️</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const AdminRidersScreen = ({navigation}) => {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const formAnim = useRef(new Animated.Value(0)).current;

  // Edit state
  const [editingRider, setEditingRider] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchRiders = async () => {
    try {
      const res = await getRiders();
      setRiders(res.data);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiders();
  }, []);

  useEffect(() => {
    Animated.spring(formAnim, {
      toValue: showForm ? 1 : 0,
      friction: 8,
      useNativeDriver: false,
    }).start();
  }, [showForm]);

  const handleCreate = async () => {
    if (!name.trim() || !phone.trim() || !password.trim()) {
      showAlert('Error', 'All fields are required.');
      return;
    }
    setSubmitting(true);
    try {
      await createRider({
        name: name.trim(),
        phone: phone.trim(),
        password: password.trim(),
      });
      setName('');
      setPhone('');
      setPassword('');
      setShowForm(false);
      fetchRiders();
      showAlert('Success', 'Rider created!');
    } catch (e) {
      showAlert('Error', 'Failed to create rider.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (riderId, riderName) => {
    showAlert('Delete', `Delete rider "${riderName}"?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRider(riderId);
            fetchRiders();
          } catch (e) {
            showAlert('Error', 'Failed to delete rider.');
          }
        },
      },
    ]);
  };

  const handleStartEdit = (rider) => {
    setEditingRider(rider.id);
    setEditName(rider.name || '');
    setEditPhone(rider.phone || '');
    setEditPassword('');
  };

  const handleSaveEdit = async () => {
    if (!editName.trim() || !editPhone.trim()) {
      showAlert('Error', 'Name and phone are required.');
      return;
    }
    setSavingEdit(true);
    try {
      const data = {
        name: editName.trim(),
        phone: editPhone.trim(),
      };
      if (editPassword.trim()) {
        data.password = editPassword.trim();
      }
      await updateRider(editingRider, data);
      setEditingRider(null);
      fetchRiders();
      showAlert('Success', 'Rider updated!');
    } catch (e) {
      showAlert('Error', 'Failed to update rider.');
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <AppHeader title="Riders" navigation={navigation} />

      {showForm ? (
        <View style={styles.form}>
          <Text style={styles.formTitle}>New Rider</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Rider Name"
              value={name}
              onChangeText={setName}
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
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
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
              onPress={() => setShowForm(false)}
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
          <Text style={styles.addButtonText}>Add Rider</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={riders}
        keyExtractor={item => item.id}
        renderItem={({item, index}) => (
          editingRider === item.id ? (
            <View style={styles.form}>
              <Text style={styles.formTitle}>Edit Rider</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Rider Name"
                  value={editName}
                  onChangeText={setEditName}
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
                <Text style={styles.inputLabel}>New Password (leave empty to keep)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="New Password (optional)"
                  value={editPassword}
                  onChangeText={setEditPassword}
                  secureTextEntry
                  placeholderTextColor={COLORS.grey}
                />
              </View>
              <View style={styles.formActions}>
                <AppButton
                  title="Save"
                  onPress={handleSaveEdit}
                  loading={savingEdit}
                  style={{flex: 1, marginRight: 8}}
                />
                <AppButton
                  title="Cancel"
                  variant="outline"
                  onPress={() => setEditingRider(null)}
                  style={{flex: 1}}
                />
              </View>
            </View>
          ) : (
            <AnimatedRiderCard
              item={item}
              index={index}
              onEdit={() => handleStartEdit(item)}
              onDelete={() => handleDelete(item.id, item.name)}
            />
          )
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🏍️</Text>
            <Text style={styles.emptyText}>No riders yet</Text>
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
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.secondarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {fontSize: 22},
  cardInfo: {flex: 1},
  cardName: {fontSize: SIZES.base, ...FONTS.bold, color: COLORS.text},
  phoneRow: {flexDirection: 'row', alignItems: 'center', marginTop: 3},
  phoneIcon: {fontSize: 11, marginRight: 4},
  cardPhone: {fontSize: SIZES.sm, color: COLORS.textLight},
  ordersBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 6,
  },
  ordersText: {fontSize: SIZES.xs - 1, color: COLORS.primary, ...FONTS.semiBold},
  deleteBtn: {
    padding: 10,
    backgroundColor: COLORS.dangerLight,
    borderRadius: 8,
    marginLeft: 4,
  },
  editBtn: {
    padding: 10,
    backgroundColor: COLORS.primarySoft,
    borderRadius: 8,
    marginLeft: 4,
  },
  empty: {flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80},
  emptyEmoji: {fontSize: 60, marginBottom: 12},
  emptyText: {fontSize: SIZES.base, color: COLORS.textMuted, ...FONTS.semiBold},
});

export default AdminRidersScreen;
