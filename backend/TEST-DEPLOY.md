# Deployment Troubleshooting Guide for Hostinger

## Changes Made

1. **Enhanced static file serving** with better path detection
2. **Added comprehensive logging** to track file paths in production
3. **Added `/debug-static` endpoint** for diagnostics

## What to Do Next

### Step 1: Deploy to Hostinger

Make sure to deploy the ENTIRE `backend` folder including:
```
backend/
  ├── frontend/
  │   ├── public/
  │   │   ├── css/
  │   │   ├── images/
  │   │   └── js/
  │   └── views/
  ├── server.js
  └── ... (all other files)
```

**CRITICAL**: The `frontend` folder MUST be inside the `backend` folder on the server!

### Step 2: Check Server Logs

After deployment, check your Hostinger logs. You should see:
```
=== Server Configuration ===
__dirname: /path/to/backend
Views path: /path/to/backend/frontend/views
Public path: /path/to/backend/frontend/public  
Views path exists: true
Public path exists: true
Public folder contents: [ 'css', 'images', 'js' ]
CSS file exists: true
NODE_ENV: production
===========================
```

### Step 3: Test the Debug Endpoint

Visit: `https://endlesscharms.store/debug-static`

This will show you:
- Where the server is looking for files
- Whether the files actually exist on the server
- What the directory structure looks like

### Step 4: Common Hostinger Issues

#### Problem: Files not uploaded
**Solution**: Make sure your deployment includes the `backend/frontend` folder. Check your `.gitignore` doesn't exclude it.

#### Problem: Wrong Node.js version
**Solution**: Hostinger requires Node.js 18+. Check your `engines` in package.json.

#### Problem: File permissions
**Solution**: SSH into your server and run:
```bash
chmod -R 755 backend/frontend/public
```

#### Problem: Wrong working directory
**Solution**: In Hostinger's Node.js settings, make sure:
- Application Root: `/domains/endlesscharms.store/public_html/backend` (or similar)
- Application Startup File: `server.js`

### Step 5: Verify Deployment Structure

SSH into your Hostinger server and run:
```bash
cd /path/to/your/backend
ls -la frontend/public/css/
```

You should see `style.css` file.

## If Still Not Working

1. Check that `backend/frontend/public/css/style.css` exists on server
2. Check file permissions (should be readable)
3. Review the output of `/debug-static`
4. Check Hostinger's error logs
5. Ensure no .htaccess file is interfering with static files
