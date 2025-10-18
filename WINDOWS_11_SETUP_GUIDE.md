# Dr. Mays Nutrition Platform - Windows 11 Development Setup Guide

This guide will help you set up the Dr. Mays Nutrition Platform for development on Windows 11.

## Prerequisites

### Required Software

1. **Python 3.8 or higher**
   - Download from [python.org](https://www.python.org/downloads/)
   - Make sure to check "Add Python to PATH" during installation
   - Verify installation: `python --version`

2. **Node.js 16 or higher**
   - Download from [nodejs.org](https://nodejs.org/)
   - Choose the LTS version
   - Verify installation: `node --version`

3. **Git (Optional but recommended)**
   - Download from [git-scm.com](https://git-scm.com/download/win)

### Windows 11 Specific Requirements

- Windows 11 (Build 22000 or later)
- PowerShell 5.1 or later (included with Windows 11)
- At least 4GB RAM
- At least 2GB free disk space

## Quick Setup (Automated)

### Option 1: PowerShell Script (Recommended)

1. Open PowerShell as Administrator
2. Navigate to the project directory
3. Run the setup script:
   ```powershell
   .\setup_windows.ps1
   ```

### Option 2: Batch Script

1. Open Command Prompt as Administrator
2. Navigate to the project directory
3. Run the setup script:
   ```cmd
   setup_windows.bat
   ```

## Manual Setup

If you prefer to set up manually or if the automated scripts fail:

### 1. Create Virtual Environment

```cmd
python -m venv venv
venv\Scripts\activate
```

### 2. Install Python Dependencies

```cmd
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Install Node.js Dependencies

```cmd
npm install
```

### 4. Configure Environment

```cmd
copy env_windows_template.txt .env
```

### 5. Set Up Database

```cmd
set DJANGO_SETTINGS_MODULE=dr_mays_nutrition.settings_windows
python manage.py makemigrations
python manage.py migrate
```

### 6. Create Superuser (Optional)

```cmd
python manage.py createsuperuser
```

## Running the Application

### Start Development Servers

#### PowerShell (Recommended)
```powershell
.\start_dev.ps1
```

#### Batch Script
```cmd
start_dev.bat
```

#### Manual Start
1. **Backend (Django)**:
   ```cmd
   venv\Scripts\activate
   set DJANGO_SETTINGS_MODULE=dr_mays_nutrition.settings_windows
   python manage.py runserver 0.0.0.0:8000
   ```

2. **Frontend (React)**:
   ```cmd
   npm run dev
   ```

### Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin
- **API Documentation**: http://localhost:8000/api/

## Windows-Specific Configuration

### Django Settings

The project uses `dr_mays_nutrition/settings_windows.py` for Windows development, which includes:

- SQLite database (no additional setup required)
- Memory-based Celery broker (no Redis required)
- Console email backend
- Windows-optimized file handling
- Enhanced logging to files

### Environment Variables

Key environment variables in `.env`:

```env
DEBUG=True
SECRET_KEY=django-insecure-windows-development-key-change-in-production
DJANGO_SETTINGS_MODULE=dr_mays_nutrition.settings_windows
```

## Development Workflow

### Daily Development

1. **Start servers**:
   ```powershell
   .\start_dev.ps1
   ```

2. **Make changes** to your code

3. **Test changes** in the browser

4. **Stop servers**: Press `Ctrl+C` in the terminal

### Database Changes

1. **Create migrations**:
   ```cmd
   python manage.py makemigrations
   ```

2. **Apply migrations**:
   ```cmd
   python manage.py migrate
   ```

### Frontend Changes

The React development server supports hot reloading, so changes are automatically reflected in the browser.

### Backend Changes

Django's development server also supports auto-reload for Python changes.

## Testing

### Run Tests

```powershell
.\run_tests.ps1
```

Or manually:
```cmd
python manage.py test
```

## Building for Production

### Build Frontend

```powershell
.\build_production.ps1
```

Or manually:
```cmd
npm run build
python manage.py collectstatic --noinput
```

## Troubleshooting

### Common Issues

1. **Python not found**
   - Ensure Python is installed and added to PATH
   - Restart your terminal after installation

2. **Node.js not found**
   - Ensure Node.js is installed and added to PATH
   - Restart your terminal after installation

3. **Permission errors**
   - Run PowerShell/Command Prompt as Administrator
   - Check Windows Defender/antivirus settings

4. **Port already in use**
   - Kill processes using ports 3000 or 8000
   - Use Task Manager or: `netstat -ano | findstr :8000`

5. **Virtual environment issues**
   - Delete the `venv` folder and recreate it
   - Ensure you're using the correct Python version

### PowerShell Execution Policy

If you get execution policy errors:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Firewall Issues

Windows Defender Firewall might block the servers. Add exceptions for:
- Python (python.exe)
- Node.js (node.exe)
- Ports 3000 and 8000

## File Structure

```
dr_mays_nutrition/
├── accounts/                 # User management
├── bookings/                 # Appointment booking
├── meal_plans/              # Meal planning system
├── payments/                # Payment processing
├── reports/                 # Reporting system
├── notifications/           # Notification system
├── dr_mays_nutrition/       # Django project settings
│   ├── settings.py          # Production settings
│   └── settings_windows.py  # Windows development settings
├── src/                     # React frontend
├── static/                  # Static files
├── media/                   # User uploads
├── logs/                    # Application logs
├── venv/                    # Python virtual environment
├── node_modules/            # Node.js dependencies
├── dist/                    # Built frontend files
└── db.sqlite3              # SQLite database
```

## Scripts Reference

| Script | Purpose | Usage |
|--------|---------|-------|
| `setup_windows.ps1` | Initial setup | `.\setup_windows.ps1` |
| `setup_windows.bat` | Initial setup (CMD) | `setup_windows.bat` |
| `start_dev.ps1` | Start development servers | `.\start_dev.ps1` |
| `start_dev.bat` | Start development servers (CMD) | `start_dev.bat` |
| `create_superuser.ps1` | Create admin user | `.\create_superuser.ps1` |
| `create_superuser.bat` | Create admin user (CMD) | `create_superuser.bat` |
| `build_production.ps1` | Build for production | `.\build_production.ps1` |
| `build_production.bat` | Build for production (CMD) | `build_production.bat` |
| `run_tests.ps1` | Run tests | `.\run_tests.ps1` |
| `run_tests.bat` | Run tests (CMD) | `run_tests.bat` |

## Performance Tips

1. **Use SSD storage** for better performance
2. **Close unnecessary applications** to free up RAM
3. **Use PowerShell** instead of Command Prompt for better performance
4. **Enable Windows Developer Mode** for better development experience

## Security Notes

- The Windows development configuration is for local development only
- Never use development settings in production
- Change the SECRET_KEY in production
- Use proper database and Redis in production

## Support

If you encounter issues:

1. Check the logs in the `logs/` directory
2. Verify all prerequisites are installed
3. Try running the setup script again
4. Check Windows Event Viewer for system errors

## Next Steps

After successful setup:

1. Create a superuser account
2. Explore the admin panel
3. Test the API endpoints
4. Start developing your features
5. Refer to the main project documentation for feature-specific guides

---

**Happy coding!** 🚀
