# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# ============================================================
# React Native - Keep all React Native classes
# ============================================================
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-dontwarn com.facebook.react.**
-dontwarn com.facebook.hermes.**

# ============================================================
# Hermes JS Engine
# ============================================================
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }

# ============================================================
# React Native Reanimated
# ============================================================
-keep class com.swmansion.reanimated.** { *; }
-keep class com.swmansion.gesturehandler.** { *; }
-dontwarn com.swmansion.reanimated.**

# ============================================================
# React Native Vision Camera
# ============================================================
-keep class com.mrousavy.camera.** { *; }
-dontwarn com.mrousavy.camera.**

# ============================================================
# React Native Screens
# ============================================================
-keep class com.swmansion.rnscreens.** { *; }
-dontwarn com.swmansion.rnscreens.**

# ============================================================
# React Native Safe Area Context
# ============================================================
-keep class com.th3rdwave.safeareacontext.** { *; }
-dontwarn com.th3rdwave.safeareacontext.**

# ============================================================
# React Native Image Crop Picker
# ============================================================
-keep class com.reactnative.imagepicker.** { *; }
-dontwarn com.reactnative.imagepicker.**

# ============================================================
# React Native WebView
# ============================================================
-keep class com.reactnativecommunity.webview.** { *; }
-dontwarn com.reactnativecommunity.webview.**

# ============================================================
# OkHttp (used by many networking libraries)
# ============================================================
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }

# ============================================================
# Retrofit / Gson (used by Supabase and other libs)
# ============================================================
-keepattributes Signature
-keepattributes *Annotation*
-keep class com.google.gson.** { *; }
-keep class sun.misc.Unsafe { *; }
-dontwarn sun.misc.**

# ============================================================
# Supabase / Ktor (networking)
# ============================================================
-keep class io.github.jan.supabase.** { *; }
-dontwarn io.github.jan.supabase.**
-keep class io.ktor.** { *; }
-dontwarn io.ktor.**

# ============================================================
# Socket.IO
# ============================================================
-keep class io.socket.** { *; }
-dontwarn io.socket.**

# ============================================================
# Kotlin Coroutines
# ============================================================
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}
-keepclassmembernames class kotlinx.** {
    volatile <fields>;
}
-dontwarn kotlinx.coroutines.**

# ============================================================
# Keep JavaScript interface methods (for WebView)
# ============================================================
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ============================================================
# Keep Parcelable implementations
# ============================================================
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# ============================================================
# Keep Serializable classes
# ============================================================
-keepnames class * implements java.io.Serializable
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    !static !transient <fields>;
    !private <fields>;
    !private <methods>;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# ============================================================
# Prevent stripping of BuildConfig
# ============================================================
-keep class com.thesisfinal.BuildConfig { *; }

# ============================================================
# Suppress common warnings
# ============================================================
-dontwarn java.lang.invoke.**
-dontwarn javax.annotation.**
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**
