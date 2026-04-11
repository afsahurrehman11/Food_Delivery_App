const fs = require('fs');
const path = require('path');

const shimPath = path.join(__dirname, '..', 'node_modules', 'react-native', 'Libraries', 'Utilities', 'DevLoadingView.js');
const shimDir = path.dirname(shimPath);
const wrapperPath = path.join(__dirname, '..', 'android', 'gradle', 'wrapper', 'gradle-wrapper.properties');
const desiredWrapperUrl = 'https://services.gradle.org/distributions/gradle-8.4-bin.zip';

function replaceLegacyReactSettingsBlock(settingsText) {
  const lines = settingsText.split(/\r?\n/);
  const out = [];
  let replaced = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (!replaced && line.includes('extensions.configure(com.facebook.react.ReactSettingsExtension)')) {
      replaced = true;

      let depth = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      while (i + 1 < lines.length && depth > 0) {
        i += 1;
        const blockLine = lines[i];
        depth += (blockLine.match(/\{/g) || []).length - (blockLine.match(/\}/g) || []).length;
      }

      out.push(
        'try {',
        "  def reactSettingsClass = Class.forName('com.facebook.react.ReactSettingsExtension')",
        '  extensions.configure(reactSettingsClass) { ex ->',
        "    if (System.getenv('EXPO_USE_COMMUNITY_AUTOLINKING') == '1') {",
        '      ex.autolinkLibrariesFromCommand()',
        "    } else if (extensions.findByName('expoAutolinking') != null && expoAutolinking?.rnConfigCommand != null) {",
        '      ex.autolinkLibrariesFromCommand(expoAutolinking.rnConfigCommand)',
        '    } else {',
        '      ex.autolinkLibrariesFromCommand()',
        '    }',
        '  }',
        '} catch (Exception e) {',
        '  println("DEBUG: ReactSettingsExtension unavailable; skipping autolinking configuration: " + e.toString())',
        '}'
      );

      continue;
    }

    out.push(line);
  }

  return {
    text: out.join('\n'),
    replaced
  };
}

function rewriteExpoAutolinkingReferences(settingsText) {
  let text = settingsText;
  let changed = false;

  // Remove previously injected helper block if present. That block can break
  // Gradle because pluginManagement {} must be at the top of settings.gradle.
  const helperBlockRegex = /def __expoAutolinkingExt = null\r?\ntry \{\r?\n\s*__expoAutolinkingExt = extensions\.findByName\("expoAutolinking"\)\r?\n\} catch \(Exception ignored\) \{\r?\n\s*__expoAutolinkingExt = null\r?\n\}\r?\n?/;
  if (helperBlockRegex.test(text)) {
    text = text.replace(helperBlockRegex, '');
    changed = true;
  }

  // Guard includeBuild calls so Gradle never receives a null path.
  const includeBuildRegex = /(^\s*)includeBuild\(\s*expoAutolinking(?:\?\.|\.)reactNativeGradlePlugin\s*\)\s*$/gm;
  const guardedIncludeBuild = text.replace(
    includeBuildRegex,
    "$1if (extensions.findByName('expoAutolinking')?.reactNativeGradlePlugin != null) {\n$1  includeBuild(extensions.findByName('expoAutolinking')?.reactNativeGradlePlugin)\n$1}"
  );
  if (guardedIncludeBuild !== text) {
    text = guardedIncludeBuild;
    changed = true;
  }

  const replacements = [
    ['extensions.findByName("expoAutolinking")', "extensions.findByName('expoAutolinking')"],
    ["__expoAutolinkingExt?.", "extensions.findByName('expoAutolinking')?."],
    ["expoAutolinking?.rnConfigCommand", "extensions.findByName('expoAutolinking')?.rnConfigCommand"],
    ["expoAutolinking.rnConfigCommand", "extensions.findByName('expoAutolinking')?.rnConfigCommand"],
    ["expoAutolinking.useExpoModules()", "extensions.findByName('expoAutolinking')?.useExpoModules()"],
    ["expoAutolinking.useExpoVersionCatalog()", "extensions.findByName('expoAutolinking')?.useExpoVersionCatalog()"],
    ["expoAutolinking.reactNativeGradlePlugin", "extensions.findByName('expoAutolinking')?.reactNativeGradlePlugin"]
  ];

  for (const [from, to] of replacements) {
    if (text.includes(from)) {
      text = text.split(from).join(to);
      changed = true;
    }
  }

  return {
    text,
    changed
  };
}

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

// Ensure a minimal, well-formed Gradle plugin project exists at the
// original expo gradle plugin path so `includeBuild` and plugin
// resolution succeed during settings evaluation. This creates a tiny
// Java-based Gradle plugin that registers the id `expo-autolinking-settings`.
try {
  const placeholderDir = path.join(__dirname, '..', 'node_modules', 'expo-modules-autolinking', 'android', 'expo-gradle-plugin');
  if (!fs.existsSync(placeholderDir)) {
    fs.mkdirSync(placeholderDir, { recursive: true });

    // settings.gradle
    const settingsContent = "rootProject.name = 'expo-gradle-plugin'\n";
    fs.writeFileSync(path.join(placeholderDir, 'settings.gradle'), settingsContent, 'utf8');

    // build.gradle - minimal Java Gradle plugin that registers the expected plugin id
    const buildGradleContent = `plugins {
  id 'java-gradle-plugin'
  id 'java'
}

group = 'dev.expo'
version = '0.0.1'

gradlePlugin {
  plugins {
    expoAutolinkingSettings {
      id = 'expo-autolinking-settings'
      implementationClass = 'com.expo.autolinking.ExpoAutolinkingSettingsNoop'
    }
  }
}

repositories {
  mavenCentral()
  google()
}

dependencies {
  implementation gradleApi()
}
`;
    fs.writeFileSync(path.join(placeholderDir, 'build.gradle'), buildGradleContent, 'utf8');

    // Java no-op plugin implementation
    const javaDir = path.join(placeholderDir, 'src', 'main', 'java', 'com', 'expo', 'autolinking');
    fs.mkdirSync(javaDir, { recursive: true });
    const javaContent = `package com.expo.autolinking;

import org.gradle.api.Plugin;
import org.gradle.api.initialization.Settings;

public class ExpoAutolinkingSettingsNoop implements Plugin<Settings> {
  @Override
  public void apply(Settings settings) {
    // no-op settings plugin to satisfy plugin resolution during settings evaluation
  }
}
`;
    fs.writeFileSync(path.join(javaDir, 'ExpoAutolinkingSettingsNoop.java'), javaContent, 'utf8');

    console.log('Created expo gradle plugin placeholder with noop plugin at', placeholderDir);
  } else {
    console.log('Expo gradle plugin directory already present, no placeholder needed:', placeholderDir);
  }
} catch (error) {
  console.error('Failed to create expo gradle plugin placeholder:', error);
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
    let cleaned = settingsText;

    // Remove any line that references the legacy settings plugin id in any form
    cleaned = cleaned.replace(/.*com\.facebook\.react\.settings.*(?:\r?\n)?/g, function (m) {
      patchedAny = true;
      return '// Removed legacy com.facebook.react.settings reference\n';
    });

    // Replace legacy ReactSettingsExtension block that references `com.` directly,
    // which can fail during settings evaluation when the class isn't yet available.
    const reactSettingsPatch = replaceLegacyReactSettingsBlock(cleaned);
    if (reactSettingsPatch.replaced) {
      cleaned = reactSettingsPatch.text;
      patchedAny = true;
      console.log('Patched', settingsPath, 'to replace legacy ReactSettingsExtension block');
    }

    const expoRefsPatch = rewriteExpoAutolinkingReferences(cleaned);
    if (expoRefsPatch.changed) {
      cleaned = expoRefsPatch.text;
      patchedAny = true;
      console.log('Patched', settingsPath, 'to rewrite expoAutolinking references safely');
    }

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

  const buildGradlePath = path.join(androidDir, 'build.gradle');
  if (fs.existsSync(buildGradlePath)) {
    const buildGradleText = fs.readFileSync(buildGradlePath, 'utf8');
    let patchedBuildGradle = buildGradleText;
    let buildGradleChanged = false;

    const replacements = [
      [
        /^(\s*)apply plugin:\s*['"]expo-root-project['"]\s*$/gm,
        "$1try {\n$1  project.pluginManager.apply('expo-root-project')\n$1} catch (Exception e) {\n$1  println('DEBUG: expo-root-project not available: ' + e.toString())\n$1}"
      ],
      [
        /^(\s*)apply plugin:\s*['"]com\.facebook\.react\.rootproject['"]\s*$/gm,
        "$1try {\n$1  project.pluginManager.apply('com.facebook.react.rootproject')\n$1} catch (Exception e) {\n$1  println('DEBUG: com.facebook.react.rootproject not available: ' + e.toString())\n$1}"
      ],
      [
        /classpath\s*\(\s*(['"])com\.android\.tools\.build:gradle\1\s*\)/g,
        "classpath('com.android.tools.build:gradle:8.1.1')"
      ],
      [
        /classpath\s+(['"])com\.android\.tools\.build:gradle\1/g,
        "classpath 'com.android.tools.build:gradle:8.1.1'"
      ],
      [
        /classpath\s*\(\s*(['"])org\.jetbrains\.kotlin:kotlin-gradle-plugin\1\s*\)/g,
        "classpath('org.jetbrains.kotlin:kotlin-gradle-plugin:1.8.22')"
      ],
      [
        /classpath\s+(['"])org\.jetbrains\.kotlin:kotlin-gradle-plugin\1/g,
        "classpath 'org.jetbrains.kotlin:kotlin-gradle-plugin:1.8.22'"
      ],
      [
        /^(\s*)classpath\s*\(\s*(['"])com\.facebook\.react:react-native-gradle-plugin\2\s*\)\s*$/gm,
        "$1classpath('com.facebook.react:react-native-gradle-plugin:0.73.4')"
      ],
      [
        /^(\s*)classpath\s+(['"])com\.facebook\.react:react-native-gradle-plugin\2\s*$/gm,
        "$1classpath 'com.facebook.react:react-native-gradle-plugin:0.73.4'"
      ]
    ];

    for (const [pattern, replacement] of replacements) {
      const next = patchedBuildGradle.replace(pattern, replacement);
      if (next !== patchedBuildGradle) {
        patchedBuildGradle = next;
        buildGradleChanged = true;
      }
    }

    if (buildGradleChanged) {
      fs.writeFileSync(buildGradlePath, patchedBuildGradle, 'utf8');
      console.log('Patched', buildGradlePath, 'to add explicit classpath versions');
      patchedAny = true;
    }
  }
} catch (error) {
  console.error('Failed to patch android settings files:', error);
  process.exit(1);
}
