/**
 * Applies saved appearance tokens before first paint to avoid font/theme flash.
 * Must stay free of imports that pull in client bundles.
 */
export function ThemeInitScript() {
  const script = `
(function(){
  try {
    var key = "beartv-settings-v1";
    var raw = localStorage.getItem(key);
    var s = raw ? JSON.parse(raw) : {};
    var root = document.documentElement;
    var fontStyle = s.fontStyle || "default";
    var theme = s.theme || "dark";
    var density = s.density || "comfortable";
    var animationLevel = s.animationLevel || "system";
    var resolvedTheme = theme;
    if (theme === "system") {
      resolvedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    var osReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var animations = "full";
    if (animationLevel === "none") animations = "none";
    else if (animationLevel === "reduced") animations = "reduced";
    else if (animationLevel === "full") animations = "full";
    else animations = osReduced ? "reduced" : "full";

    root.dataset.fontStyle = fontStyle;
    root.dataset.theme = resolvedTheme;
    root.dataset.density = density;
    root.dataset.animations = animations;
    root.classList.toggle("dark", resolvedTheme === "dark");
    root.style.colorScheme = resolvedTheme;

    var fontMap = {
      default: "var(--font-default), ui-sans-serif, system-ui, sans-serif",
      modern: "var(--font-modern), ui-sans-serif, system-ui, sans-serif",
      friendly: "var(--font-friendly), ui-sans-serif, system-ui, sans-serif",
      clean: "Arial, Helvetica, ui-sans-serif, sans-serif",
      system: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    };
    root.style.setProperty("--app-font", fontMap[fontStyle] || fontMap.default);
  } catch (e) {}
})();
`;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      // Inline before paint; not a user-interactive script
    />
  );
}
