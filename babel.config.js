module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Required for Supabase to work properly with Hermes
    ['@babel/plugin-transform-flow-strip-types'],
    ['@babel/plugin-transform-class-properties', { loose: true }],
    ['@babel/plugin-transform-private-methods', { loose: true }],
  ],
};
