#!/bin/bash
# Build script for Vercel
echo "Building project..."
python3.9 -m pip install -r requirements.txt
python3.9 manage.py collectstatic --noinput
echo "Build complete."
