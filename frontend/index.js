import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';
import App from './src/App';
import AppWeb from './src/AppWeb';

const RootComponent = Platform.OS === 'web' ? AppWeb : App;

registerRootComponent(RootComponent);
