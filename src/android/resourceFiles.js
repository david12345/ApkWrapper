export function generateStringsXml(cfg) {
  const escaped = cfg.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '\\"');
  return `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${escaped}</string>
</resources>
`;
}

export function generateThemesXml() {
  return `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.App" parent="Theme.AppCompat.Light.NoActionBar">
        <item name="android:windowFullscreen">true</item>
        <item name="android:windowContentOverlay">@null</item>
    </style>
</resources>
`;
}
