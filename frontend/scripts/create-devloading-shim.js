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

// Disable expo's gradle plugin build inside node_modules to avoid compiling
// the Kotlin plugin on the builder (which can fail due to internal Gradle APIs).
try {
  const expoPluginDir = path.join(__dirname, '..', 'node_modules', 'expo-modules-autolinking', 'android', 'expo-gradle-plugin');
  if (fs.existsSync(expoPluginDir)) {
    const disabledPath = expoPluginDir + '.disabled_by_shim';
    try {
      fs.renameSync(expoPluginDir, disabledPath);
      console.log('Renamed expo gradle plugin directory to', disabledPath);
    } catch (err) {
      // If rename fails (e.g., on some filesystems), try removing it.
      try {
        fs.rmSync(expoPluginDir, { recursive: true, force: true });
        console.log('Removed expo gradle plugin directory at', expoPluginDir);
      } catch (rmErr) {
        console.error('Failed to disable expo gradle plugin directory:', rmErr);
        // Don't fatal here; proceed so we can still attempt the settings patch.
      }
    }
  } else {
    console.log('No expo gradle plugin directory found at', expoPluginDir);
  }
} catch (error) {
  console.error('Failed while disabling expo gradle plugin directory:', error);
}

try {
  const androidDir = path.join(__dirname, '..', 'android');
  const candidates = [
    path.join(androidDir, 'settings.gradle'),
    path.join(androidDir, 'settings.gradle.kts')
  ];

  let patchedAny = false;
  for (const settingsPath of candidates) {
    if (!fs.existsSync(settingsPath)) {
      continue;
    }

    const settingsText = fs.readFileSync(settingsPath, 'utf8');

    // Remove any line that references the legacy settings plugin id in any form
    const cleaned = settingsText.replace(/.*com\.facebook\.react\.settings.*(?:\r?\n)?/g, function (m) {
      patchedAny = true;
      return '// Removed legacy com.facebook.react.settings reference\n';
    });

    if (cleaned !== settingsText) {
      fs.writeFileSync(settingsPath, cleaned, 'utf8');
      console.log('Patched', settingsPath, 'to remove com.facebook.react.settings references');
    } else {
      console.log('No legacy com.facebook.react.settings references found in', settingsPath);
    }
  }

  if (!patchedAny) {
    console.log('No android settings files found to patch');
  }
} catch (error) {
  console.error('Failed to patch android settings files:', error);
  process.exit(1);
}
