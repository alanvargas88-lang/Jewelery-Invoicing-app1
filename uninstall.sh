#!/bin/bash

# Jewelry Invoice Pro - Uninstaller
# ==================================

APP_NAME="Jewelry Invoice Pro"
DESKTOP_FILE="jewelry-invoice-pro.desktop"

echo "========================================"
echo "  Jewelry Invoice Pro - Uninstaller"
echo "========================================"
echo ""

# Remove desktop entry
rm -f "$HOME/.local/share/applications/$DESKTOP_FILE"
echo "[1/3] Removed application menu entry"

# Remove desktop shortcut
rm -f "$HOME/Desktop/$DESKTOP_FILE" 2>/dev/null
rm -f "$HOME/desktop/$DESKTOP_FILE" 2>/dev/null
echo "[2/3] Removed desktop shortcut"

# Remove icon
rm -f "$HOME/.local/share/icons/jewelry-invoice-pro.svg"
echo "[3/3] Removed application icon"

# Update desktop database
if command -v update-desktop-database &> /dev/null; then
    update-desktop-database "$HOME/.local/share/applications" 2>/dev/null
fi

echo ""
echo "========================================"
echo "  Uninstallation Complete!"
echo "========================================"
echo ""
echo "Note: Your app files and data are still in:"
echo "  $(cd "$(dirname "$0")" && pwd)"
echo ""
