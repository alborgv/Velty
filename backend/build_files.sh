#!/bin/bash
# Build script for Vercel
echo "Building project..."
pip3 install -r requirements.txt --break-system-packages
python3 manage.py collectstatic --noinput
echo "Build complete."
