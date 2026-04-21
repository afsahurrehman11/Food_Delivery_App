import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import AppHeader from '../../components/AppHeader';
import AppButton from '../../components/AppButton';
import {useAuth} from '../../context/AuthContext';
import {adminLogin, adminRegister, riderLogin} from '../../services/apiService';
import {COLORS, FONTS, SIZES, SHADOWS} from '../../utils/theme';

/* Web-safe alert helper */
const showAlert = (title, message) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

const {width} = Dimensions.get('window');

const LoginScreen = ({navigation}) => {
  const {login} = useAuth();
  const [mode, setMode] = useState('admin');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(30)).current;
  const toggleAnim = useRef(new Animated.Value(0)).current; // 0 = admin, 1 = rider

  useEffect(() => {
    Animated.stagger(150, [
      Animated.parallel([
        Animated.timing(headerOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.timing(headerTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }),
      ]),
      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: false,
        }),
        Animated.spring(formTranslateY, {
          toValue: 0,
          friction: 6,
          useNativeDriver: false,
        }),
      ]),
    ]).start();
  }, []);

  const switchMode = newMode => {
    setMode(newMode);
    Animated.spring(toggleAnim, {
      toValue: newMode === 'admin' ? 0 : 1,
      friction: 6,
      tension: 50,
      useNativeDriver: false,
    }).start();
  };

  const indicatorTranslate = toggleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, (width - SIZES.padding * 4 - 8) / 2],
  });

  const handleLogin = async () => {
    setLoading(true);
    try {
      let res;
      if (mode === 'admin') {
        if (!username.trim() || !password.trim()) {
          showAlert('Error', 'Please enter username and password');
          setLoading(false);
          return;
        }
        res = await adminLogin(username.trim(), password.trim());
      } else {
        if (!phone.trim() || !password.trim()) {
          showAlert('Error', 'Please enter phone and password');
          setLoading(false);
          return;
        }
        res = await riderLogin(phone.trim(), password.trim());
      }
      await login(res.data);
      if (res.data.role === 'admin') {
        navigation.reset({index: 0, routes: [{name: 'AdminDashboard'}]});
      } else {
        navigation.reset({index: 0, routes: [{name: 'RiderDashboard'}]});
      }
    } catch (e) {
      const msg =
        e.response?.data?.detail || 'Login failed. Please check your credentials.';
      showAlert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminRegister = async () => {
    if (!username.trim() || !password.trim()) {
      showAlert('Error', 'Please enter username and password');
      return;
    }
    setLoading(true);

    try {
      const res = await adminRegister(username.trim(), password.trim());
      await login(res.data);
      navigation.reset({index: 0, routes: [{name: 'AdminDashboard'}]});
    } catch (e) {
      const msg =
        e.response?.data?.detail || 'Registration failed. Admin may already exist.';
      showAlert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Staff Login" navigation={navigation} />
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          {/* Header Icon */}
          <Animated.View
            style={[
              styles.headerIcon,
              {
                opacity: headerOpacity,
                transform: [{translateY: headerTranslateY}],
              },
            ]}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconEmoji}>
                {mode === 'admin' ? '👨‍💼' : '🏍️'}
              </Text>
            </View>
            <Text style={styles.welcomeText}>Welcome Back!</Text>
            <Text style={styles.subtitleText}>
              Sign in as {mode === 'admin' ? 'Admin' : 'Rider'} to continue
            </Text>
          </Animated.View>

          {/* Toggle */}
          <Animated.View
            style={[
              styles.toggleContainer,
              {
                opacity: formOpacity,
                transform: [{translateY: formTranslateY}],
              },
            ]}>
            <View style={styles.toggleRow}>
              <Animated.View
                style={[
                  styles.toggleIndicator,
                  {transform: [{translateX: indicatorTranslate}]},
                ]}
              />
              <TouchableOpacity
                style={styles.toggleBtn}
                onPress={() => switchMode('admin')}>
                <Text
                  style={[
                    styles.toggleText,
                    mode === 'admin' && styles.toggleTextActive,
                  ]}>
                  👨‍💼 Admin
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.toggleBtn}
                onPress={() => switchMode('rider')}>
                <Text
                  style={[
                    styles.toggleText,
                    mode === 'rider' && styles.toggleTextActive,
                  ]}>
                  🏍️ Rider
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Form */}
          <Animated.View
            style={[
              styles.formCard,
              {
                opacity: formOpacity,
                transform: [{translateY: formTranslateY}],
              },
            ]}>
            {mode === 'admin' ? (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Username</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your username"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your phone number"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            )}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            <AppButton
              title="Login"
              onPress={handleLogin}
              loading={loading}
              size="large"
              style={{marginTop: 16}}
            />

            {mode === 'admin' && (
              <>
                <View style={styles.credentialsHint}>
                  <Text style={styles.credentialsHintText}>Default: admin / admin123</Text>
                </View>
                <TouchableOpacity
                  style={styles.registerLink}
                  onPress={handleAdminRegister}>
                  <Text style={styles.registerText}>
                    First time? <Text style={styles.registerBold}>Register as Admin</Text>
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  content: {padding: SIZES.padding * 1.5, paddingTop: 30},
  headerIcon: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...SHADOWS.medium,
  },
  iconEmoji: {fontSize: 36},
  welcomeText: {
    fontSize: SIZES.xxl,
    ...FONTS.bold,
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: SIZES.sm,
    color: COLORS.textLight,
    ...FONTS.medium,
  },
  toggleContainer: {
    marginBottom: 24,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.lightGrey,
    borderRadius: SIZES.radiusLg,
    padding: 4,
    position: 'relative',
  },
  toggleIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: '50%',
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    ...SHADOWS.medium,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    zIndex: 1,
  },
  toggleText: {
    fontSize: SIZES.base,
    ...FONTS.semiBold,
    color: COLORS.darkGrey,
  },
  toggleTextActive: {
    color: COLORS.white,
  },
  formCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    padding: 24,
    ...SHADOWS.medium,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: SIZES.sm,
    ...FONTS.semiBold,
    color: COLORS.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: SIZES.md,
    color: COLORS.text,
  },
  registerLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  registerText: {
    color: COLORS.textLight,
    fontSize: SIZES.sm,
    ...FONTS.medium,
  },
  registerBold: {
    color: COLORS.primary,
    ...FONTS.bold,
  },
  credentialsHint: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: COLORS.primarySoft || '#e8f4ea',
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.primaryLight || COLORS.primary,
    alignItems: 'center',
  },
  credentialsHintText: {
    fontSize: SIZES.sm,
    color: COLORS.primary,
    ...FONTS.semiBold,
  },
});

export default LoginScreen;
