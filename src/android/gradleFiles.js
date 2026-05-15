import path from 'path';
import os from 'os';

export function generateRootBuildGradle() {
  return `// Top-level build file
plugins {
    id 'com.android.application' version '8.2.2' apply false
    id 'org.jetbrains.kotlin.android' version '1.9.22' apply false
}
`;
}

export function generateSettingsGradle(cfg) {
  const safeName = cfg.name.replace(/[^a-zA-Z0-9_]/g, '_');
  return `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "${safeName}"
include ':app'
`;
}

export function generateGradleProperties() {
  return `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
kotlin.code.style=official
android.nonTransitiveRClass=true
`;
}

export function generateLocalProperties(androidHome) {
  return `sdk.dir=${androidHome.replace(/\\/g, '\\\\')}
`;
}

export function generateAppBuildGradle(cfg, keystorePath) {
  const safeKeystorePath = keystorePath.replace(/\\/g, '/');
  return `plugins {
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android'
}

android {
    namespace '${cfg.package}'
    compileSdk 34

    defaultConfig {
        applicationId '${cfg.package}'
        minSdk ${cfg.minSdk}
        targetSdk ${cfg.targetSdk}
        versionCode ${cfg.versionCode}
        versionName '${cfg.versionName}'
    }

    signingConfigs {
        debug {
            storeFile file('${safeKeystorePath}')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }

    buildTypes {
        release {
            minifyEnabled false
            signingConfig signingConfigs.debug
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
        debug {
            signingConfig signingConfigs.debug
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }

    kotlinOptions {
        jvmTarget = '1.8'
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'androidx.webkit:webkit:1.10.0'
}
`;
}

export function generateGradleWrapperProperties() {
  return `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.2-bin.zip
networkTimeout=10000
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`;
}

export function generateProguardRules() {
  return `-keep class * extends android.webkit.WebViewClient { *; }
-keepattributes JavascriptInterface
`;
}
