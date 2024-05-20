#!/bin/bash

# Define the necessary variables
REMOTE_USER="master_ahmuyjehsd"       # Replace with your remote username
REMOTE_HOST="146.190.32.7"   # Replace with your remote host address (e.g., example.com or 192.168.1.1)
REMOTE_DIR="applications/ygmjfjhjgn/public_html"
REMOTE_PWD="8HJ9gKwk"

echo "Password: $REMOTE_PWD"

# Function to execute commands on the remote server
execute_remote() {
    ssh -t "$REMOTE_USER@$REMOTE_HOST" "cd $REMOTE_DIR; bash"
}

# Run the function
execute_remote