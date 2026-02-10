#!/bin/bash
# Script para hacer push a GitHub

echo "🚀 PUSH A GITHUB - Fubba Bubba Dashboard"
echo "========================================="
echo ""

cd ~/Desktop/fubba-dashboard

# Verificar si ya está autenticado
if ! gh auth status &>/dev/null; then
    echo "📱 Necesitas autenticarte con GitHub (solo una vez)..."
    echo ""
    gh auth login --web
    echo ""
fi

# Hacer push
echo "📤 Haciendo push a GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ¡PUSH EXITOSO!"
    echo ""
    echo "🔗 Tu repositorio: https://github.com/oliverherrera784-design/fubbabubba"
    echo ""
else
    echo ""
    echo "❌ Error al hacer push. Revisa los errores arriba."
fi
