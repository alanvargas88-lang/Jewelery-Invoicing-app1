#!/bin/bash

# Jewelry Invoice Pro - Desktop Installer
# ========================================

APP_NAME="Jewelry Invoice Pro"
APP_DIR="$(cd "$(dirname "$0")" && pwd)"
DESKTOP_FILE="jewelry-invoice-pro.desktop"
ICON_NAME="jewelry-invoice-pro.png"

echo "========================================"
echo "  Jewelry Invoice Pro - Installer"
echo "========================================"
echo ""

# Create icon (simple SVG converted to PNG would be ideal, but we'll use a data URI approach)
# For now, we'll create a simple icon placeholder
ICON_DIR="$HOME/.local/share/icons"
mkdir -p "$ICON_DIR"

# Create a simple SVG icon
cat > "$ICON_DIR/jewelry-invoice-pro.svg" << 'ICONEOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="20" fill="#6366f1"/>
  <path d="M64 20L30 40l34 17 34-17-34-20zM30 88l34 20 34-20M30 64l34 20 34-20"
        stroke="white" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
ICONEOF

echo "[1/3] Created application icon"

# Create the desktop entry
DESKTOP_DIR="$HOME/.local/share/applications"
mkdir -p "$DESKTOP_DIR"

cat > "$DESKTOP_DIR/$DESKTOP_FILE" << DESKTOPEOF
[Desktop Entry]
Version=1.0
Type=Application
Name=$APP_NAME
Comment=Professional jewelry invoicing and estimates
Exec=xdg-open "$APP_DIR/index.html"
Icon=$ICON_DIR/jewelry-invoice-pro.svg
Terminal=false
Categories=Office;Finance;
StartupNotify=true
DESKTOPEOF

echo "[2/3] Created application menu entry"

# Copy to Desktop if it exists
if [ -d "$HOME/Desktop" ]; then
    cp "$DESKTOP_DIR/$DESKTOP_FILE" "$HOME/Desktop/"
    chmod +x "$HOME/Desktop/$DESKTOP_FILE"
    echo "[3/3] Added shortcut to Desktop"
elif [ -d "$HOME/desktop" ]; then
    cp "$DESKTOP_DIR/$DESKTOP_FILE" "$HOME/desktop/"
    chmod +x "$HOME/desktop/$DESKTOP_FILE"
    echo "[3/3] Added shortcut to Desktop"
else
    echo "[3/3] Desktop folder not found, skipping desktop shortcut"
fi

# Update desktop database
if command -v update-desktop-database &> /dev/null; then
    update-desktop-database "$DESKTOP_DIR" 2>/dev/null
fi

echo ""
echo "========================================"
echo "  Installation Complete!"
echo "========================================"
echo ""
echo "You can now:"
echo "  1. Find '$APP_NAME' in your applications menu"
echo "  2. Double-click the desktop shortcut"
echo "  3. Run: xdg-open $APP_DIR/index.html"
echo ""
echo "To uninstall, run: ./uninstall.sh"
echo ""
