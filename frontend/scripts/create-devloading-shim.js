const fs = require('fs');
const path = require('path');

const shimPath = path.join(__dirname, '..', 'node_modules', 'react-native', 'Libraries', 'Utilities', 'DevLoadingView.js');
const shimDir = path.dirname(shimPath);
const wrapperPath = path.join(__dirname, '..', 'android', 'gradle', 'wrapper', 'gradle-wrapper.properties');
const desiredWrapperUrl = 'https://services.gradle.org/distributions/gradle-8.4-bin.zip';

try {
  if (!fs.existsSync(shimDir)) {
    fs.mkdirSync(shimDir, { recursive: true });
  }

  if (!fs.existsSync(shimPath)) {
    fs.writeFileSync(shimPath, `module.exports = require('react-native/Libraries/Utilities/DevLoadingView');\n`, 'utf8');
    console.log('Created DevLoadingView shim at', shimPath);
  } else {
    console.log('DevLoadingView shim already exists at', shimPath);
  }
} catch (error) {
  console.error('Failed to create DevLoadingView shim:', error);
  process.exit(1);
}

try {
  if (fs.existsSync(wrapperPath)) {
    const wrapperText = fs.readFileSync(wrapperPath, 'utf8');
    if (!wrapperText.includes(`distributionUrl=${desiredWrapperUrl}`)) {
      const updated = wrapperText.replace(/distributionUrl=.*\r?\n/, `distributionUrl=${desiredWrapperUrl}\n`);
      fs.writeFileSync(wrapperPath, updated, 'utf8');
      console.log('Patched Gradle wrapper distribution to', desiredWrapperUrl);
    } else {
      console.log('Gradle wrapper distribution already pinned to', desiredWrapperUrl);
    }
  } else {
    console.log('No Gradle wrapper properties file found at', wrapperPath);
  }
} catch (error) {
  console.error('Failed to patch Gradle wrapper distribution:', error);
  process.exit(1);
}

try {
  const settingsPath = path.join(__dirname, '..', 'android', 'settings.gradle');
  if (fs.existsSync(settingsPath)) {
    const settingsText = fs.readFileSync(settingsPath, 'utf8');
    const updatedSettingsText = settingsText.replace(
      /\s*pluginManager\.apply\(['\"]com\.facebook\.react\.settings['\"]\)\s*\r?\n/g,
      '// Removed unsupported com.facebook.react.settings apply for RN 0.73\n'
    );
    if (updatedSettingsText !== settingsText) {
      fs.writeFileSync(settingsPath, updatedSettingsText, 'utf8');
      console.log('Patched android/settings.gradle to remove unsupported com.facebook.react.settings apply');
    } else {
      console.log('android/settings.gradle does not contain unsupported com.facebook.react.settings apply');
    }
  } else {
    console.log('No android/settings.gradle file found at', settingsPath);
  }
} catch (error) {
  console.error('Failed to patch android/settings.gradle:', error);
  process.exit(1);
}
