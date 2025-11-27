#!/bin/bash


poll_mode=$1


if [ "$poll_mode" = "--poll" ]; then
    echo "Polling mode enabled. Rebuilding docs every 100 seconds..."
    while true; do
        pkill -f "python3 -m http.server -b 127.0.0.1 8000"
        cd ../../../
        bash build-docs.sh
        cd docs/_build/html
        echo "Restarting the HTTP server..."
        python3 -m http.server -b 127.0.0.1 8000 &
        sleep 100
    done
else
    bash build-docs.sh
    echo "Starting a simple HTTP server to serve the documentation..."
    cd docs/_build/html
    python3 -m http.server -b 127.0.0.1 8000
fi