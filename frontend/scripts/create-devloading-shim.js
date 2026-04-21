const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const shimPath = path.join(projectRoot, 'node_modules', 'react-native', 'Libraries', 'Utilities', 'DevLoadingView.js');
const wrapperPath = path.join(projectRoot, 'android', 'gradle', 'wrapper', 'gradle-wrapper.properties');
const desiredWrapperUrl = 'https://services.gradle.org/distributions/gradle-9.0.0-bin.zip';
const autolinkingCachePath = path.join(projectRoot, 'android', 'build', 'generated', 'autolinking');
const cxxBuildPath = path.join(projectRoot, 'android', 'app', '.cxx');

function ensureDevLoadingShim() {
  try {
    fs.mkdirSync(path.dirname(shimPath), { recursive: true });

    if (!fs.existsSync(shimPath)) {
      fs.writeFileSync(
        shimPath,
        "module.exports = require('react-native/Libraries/Utilities/DevLoadingView');\n",
        'utf8'
      );
      console.log('[create-devloading-shim] created DevLoadingView shim');
    } else {
      console.log('[create-devloading-shim] DevLoadingView shim already present');
    }
  } catch (error) {
    console.error('[create-devloading-shim] failed to ensure DevLoadingView shim:', error);
  }
}

function ensureGradleWrapperVersion() {
  try {
    if (!fs.existsSync(wrapperPath)) {
      console.log('[create-devloading-shim] no gradle-wrapper.properties found, skipping');
      return;
    }

    const wrapperText = fs.readFileSync(wrapperPath, 'utf8');
    if (wrapperText.includes(`distributionUrl=${desiredWrapperUrl}`)) {
      console.log('[create-devloading-shim] Gradle wrapper distribution already pinned');
      return;
    }

    const updated = wrapperText.replace(/distributionUrl=.*\r?\n/, `distributionUrl=${desiredWrapperUrl}\n`);
    fs.writeFileSync(wrapperPath, updated, 'utf8');
    console.log('[create-devloading-shim] patched Gradle wrapper distribution');
  } catch (error) {
    console.error('[create-devloading-shim] failed to patch Gradle wrapper distribution:', error);
  }
}

function purgeAndroidGeneratedArtifacts() {
  [autolinkingCachePath, cxxBuildPath].forEach((targetPath) => {
    try {
      if (fs.existsSync(targetPath)) {
        fs.rmSync(targetPath, { recursive: true, force: true });
        console.log(`[create-devloading-shim] removed stale generated artifacts at ${targetPath}`);
      }
    } catch (error) {
      console.error(`[create-devloading-shim] failed to clean ${targetPath}:`, error);
    }
  });
}

function restoreExpoGradlePluginLayout() {
  const pluginsRoot = path.join(projectRoot, 'node_modules', 'expo-modules-autolinking', 'android');
  const activeDir = path.join(pluginsRoot, 'expo-gradle-plugin');
  const disabledDir = activeDir + '.disabled_by_shim';
  const placeholderMarker = path.join(
    activeDir,
    'src',
    'main',
    'java',
    'com',
    'expo',
    'autolinking',
    'ExpoAutolinkingSettingsNoop.java'
  );

  try {
    if (!fs.existsSync(disabledDir)) {
      console.log('[create-devloading-shim] no disabled expo-gradle-plugin directory found');
      return;
    }

    if (fs.existsSync(placeholderMarker)) {
      fs.rmSync(activeDir, { recursive: true, force: true });
      console.log('[create-devloading-shim] removed stale noop expo-gradle-plugin placeholder');
    }

    if (!fs.existsSync(activeDir)) {
      fs.renameSync(disabledDir, activeDir);
      console.log('[create-devloading-shim] restored real expo-gradle-plugin directory');
      return;
    }

    console.log('[create-devloading-shim] expo-gradle-plugin already present; leaving disabled backup untouched');
  } catch (error) {
    console.error('[create-devloading-shim] failed to restore expo-gradle-plugin layout:', error);
  }
}

ensureDevLoadingShim();
ensureGradleWrapperVersion();
restoreExpoGradlePluginLayout();
purgeAndroidGeneratedArtifacts();
