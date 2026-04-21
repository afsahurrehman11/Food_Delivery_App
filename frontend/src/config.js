import {Platform} from 'react-native';

// Use EAS/Expo public env for production APK builds.
const RAW_ENV_API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || '').trim();
const HAS_PLACEHOLDER_ENV = /YOUR_LAN_IP|YOUR_IP|<.*?>/i.test(RAW_ENV_API_BASE_URL);
const ENV_API_BASE_URL = HAS_PLACEHOLDER_ENV ? '' : RAW_ENV_API_BASE_URL;

const DEFAULT_WEB_API = 'http://localhost:8000';
const DEFAULT_ANDROID_API = 'http://192.168.1.40:8000';
const DEFAULT_IOS_API = 'http://localhost:8000';

const FALLBACK_API_BASE_URL = Platform.select({
	web: DEFAULT_WEB_API,
	android: DEFAULT_ANDROID_API,
	ios: DEFAULT_IOS_API,
	default: DEFAULT_WEB_API,
});

export const API_BASE_URL = ENV_API_BASE_URL || FALLBACK_API_BASE_URL;
