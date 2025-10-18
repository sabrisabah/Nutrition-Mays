# Dr. Mays Nutrition Platform - Windows 11 Quick Start

## 🚀 Quick Start

### Prerequisites
- Windows 11
- Python 3.8+ ([Download](https://python.org))
- Node.js 16+ ([Download](https://nodejs.org))

### One-Command Setup & Run

**PowerShell (Recommended):**
```powershell
.\quick_start_windows.ps1
```

**Command Prompt:**
```cmd
quick_start_windows.bat
```

That's it! The script will:
1. ✅ Install all dependencies
2. ✅ Set up the database
3. ✅ Start both servers
4. ✅ Open the application in your browser

## 📍 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin

## 🛠️ Manual Commands

If you prefer manual control:

```powershell
# Setup (first time only)
.\setup_windows.ps1

# Start development servers
.\start_dev.ps1

# Create admin user
.\create_superuser.ps1

# Run tests
.\run_tests.ps1

# Build for production
.\build_production.ps1
```

## 📚 Full Documentation

For detailed setup instructions and troubleshooting, see [WINDOWS_11_SETUP_GUIDE.md](WINDOWS_11_SETUP_GUIDE.md)

## 🆘 Need Help?

1. Check the [Windows Setup Guide](WINDOWS_11_SETUP_GUIDE.md)
2. Look at the logs in the `logs/` directory
3. Make sure Python and Node.js are installed and in your PATH

---

**Happy coding!** 🎉
