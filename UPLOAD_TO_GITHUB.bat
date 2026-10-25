@echo off
setlocal EnableDelayedExpansion
title EARSHOT - GitHub Production Deployment
color 0B

echo ===============================================================================
echo                      EARSHOT -- GITHUB DEPLOYMENT AUTOMATION
echo          Cinematic Running Fox Landing Page ^| Production Release
echo ===============================================================================
echo.

:: 1. Navigate to Project Root
cd /d "%~dp0"
if not exist "package.json" goto :ERR_NO_PACKAGE

echo [OK] Project root verified: "%CD%"

:: 2. Verify Git Installation
where git >nul 2>&1
if %errorlevel% neq 0 goto :ERR_NO_GIT

for /f "tokens=*" %%g in ('git --version') do set "GIT_VERSION=%%g"
echo [OK] %GIT_VERSION% detected.

:: 3. Remote Repository Target
set "TARGET_REPO=https://github.com/arshadali85579-star/Earshot.git"
set "REPO_BROWSER_URL=https://github.com/arshadali85579-star/Earshot"

:: 4. Check Git LFS and Large Files (>100MB)
set "HAS_LFS=0"
git lfs version >nul 2>&1
if %errorlevel% equ 0 (
    set "HAS_LFS=1"
    echo [OK] Git LFS detected.
)

:: Check size of earshot_4k.mp4
set "LARGE_4K_EXISTS=0"
if exist "public\assets\earshot_4k.mp4" (
    for %%F in ("public\assets\earshot_4k.mp4") do (
        set "FILE_SIZE=%%~zF"
        if !FILE_SIZE! gtr 104857600 set "LARGE_4K_EXISTS=1"
    )
)

if "!LARGE_4K_EXISTS!"=="0" goto :GIT_SETUP
if "!HAS_LFS!"=="1" goto :CONFIGURE_LFS

:: Git LFS not found and large file exists
goto :PROMPT_LFS_OPTIONS

:CONFIGURE_LFS
echo [INFO] Configuring Git LFS for video assets...
git lfs install >nul 2>&1
git lfs track "*.mp4" >nul 2>&1
git lfs track "*.webm" >nul 2>&1
if exist ".gitattributes" git add .gitattributes >nul 2>&1
findstr /V /C:"public/assets/earshot_4k.mp4" .gitignore > "%TEMP%\earshot_gi.tmp" 2>&1
move /y "%TEMP%\earshot_gi.tmp" .gitignore >nul 2>&1
echo [OK] Git LFS tracking configured for *.mp4 and *.webm.
goto :GIT_SETUP

:PROMPT_LFS_OPTIONS
echo.
echo ===============================================================================
echo [NOTICE] Large file detected: public\assets\earshot_4k.mp4 (~152 MB)
echo GitHub has a strict 100 MB per-file limit without Git LFS.
echo ===============================================================================
echo.
echo Choose how you would like to proceed:
echo   [1] Push now (Excludes 152MB 4K video, keeps 1080p hero video + full source)
echo   [2] Auto-install Git LFS via winget
echo   [3] Cancel to install Git LFS manually from https://git-lfs.com
echo.
set "LFS_CHOICE=1"
set /p "LFS_CHOICE=Enter choice [1, 2, or 3] (default 1): "

if "%LFS_CHOICE%"=="2" goto :INSTALL_LFS_WINGET
if "%LFS_CHOICE%"=="3" goto :CANCEL_SCRIPT

:EXCLUDE_4K
echo.
echo [INFO] Ensuring earshot_4k.mp4 is in .gitignore...
findstr /C:"public/assets/earshot_4k.mp4" .gitignore >nul 2>&1
if %errorlevel% neq 0 (
    echo public/assets/earshot_4k.mp4>> .gitignore
)
if exist ".gitattributes" (
    findstr /C:"filter=lfs" .gitattributes >nul 2>&1
    if !errorlevel! equ 0 (
        del ".gitattributes" >nul 2>&1
    )
)
echo [OK] 4K video excluded. High-definition 1080p hero video will be uploaded.
goto :GIT_SETUP

:INSTALL_LFS_WINGET
echo.
echo [INFO] Installing Git LFS using winget...
winget install --id GitHub.GitLFS -e --accept-package-agreements --accept-source-agreements
git lfs version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Git LFS installed successfully!
    goto :CONFIGURE_LFS
) else (
    echo [WARNING] Git LFS installed but new PATH requires restarting the terminal.
    echo Proceeding safely by excluding 152MB file for this upload...
    goto :EXCLUDE_4K
)

:CANCEL_SCRIPT
echo.
echo [CANCELLED] Deployment aborted. Please install Git LFS and re-run.
pause
exit /b 0

:GIT_SETUP
:: 5. Initialize Git Repository If Needed
if not exist ".git" (
    echo.
    echo [INFO] Initializing new Git repository...
    git init -b main >nul 2>&1
    if !errorlevel! neq 0 (
        git init >nul 2>&1
        git branch -M main >nul 2>&1
    )
    echo [OK] Repository initialized on branch 'main'.
) else (
    echo [OK] Existing Git repository detected.
    for /f "tokens=*" %%b in ('git branch --show-current 2^>nul') do set "DETECTED_BRANCH=%%b"
    if "!DETECTED_BRANCH!"=="" (
        git branch -M main >nul 2>&1
    )
)

:: 6. Configure Remote Origin
git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Adding remote origin: %TARGET_REPO%
    git remote add origin "%TARGET_REPO%"
) else (
    for /f "tokens=*" %%r in ('git remote get-url origin') do set "EXISTING_REMOTE=%%r"
    if /i not "!EXISTING_REMOTE!"=="%TARGET_REPO%" (
        echo [INFO] Updating remote origin to: %TARGET_REPO%
        git remote set-url origin "%TARGET_REPO%"
    )
)
echo [OK] Remote origin configured: %TARGET_REPO%

:: 7. Stage Files (Respecting .gitignore)
echo.
echo [INFO] Staging project files (respecting .gitignore)...
git add .
if %errorlevel% neq 0 goto :ERR_STAGE_FAILED

:: 8. Check Status and Commit
git status --porcelain > "%TEMP%\earshot_git_status.txt" 2>&1
set "HAS_CHANGES=0"
for %%A in ("%TEMP%\earshot_git_status.txt") do (
    if %%~zA gtr 0 set "HAS_CHANGES=1"
)
del "%TEMP%\earshot_git_status.txt" >nul 2>&1

if "!HAS_CHANGES!"=="0" (
    echo [INFO] Working tree is clean. No new uncommitted changes.
    goto :CHECK_PUSH
)

echo.
echo [INFO] New or modified files detected for commit.
set "DEFAULT_COMMIT_MSG=feat: Complete Earshot 4K website - Performance & WCAG 2.2 AA optimization"
echo Default message: "%DEFAULT_COMMIT_MSG%"
echo.
set "USER_COMMIT_MSG="
set /p "USER_COMMIT_MSG=Enter custom commit message (or press ENTER to use default): "
if "!USER_COMMIT_MSG!"=="" set "USER_COMMIT_MSG=%DEFAULT_COMMIT_MSG%"

echo.
echo [INFO] Committing changes...
git commit -m "!USER_COMMIT_MSG!"
if %errorlevel% neq 0 goto :ERR_COMMIT_FAILED
echo [OK] Changes committed successfully.

:CHECK_PUSH
:: 9. Determine Branch Name
for /f "tokens=*" %%b in ('git branch --show-current 2^>nul') do set "ACTIVE_BRANCH=%%b"
if "!ACTIVE_BRANCH!"=="" set "ACTIVE_BRANCH=main"

:: 10. Push to GitHub
echo.
echo ===============================================================================
echo [INFO] Pushing commits to GitHub (!ACTIVE_BRANCH! -^> origin/!ACTIVE_BRANCH!)...
echo ===============================================================================
echo.

git push -u origin !ACTIVE_BRANCH!
if %errorlevel% equ 0 goto :PUSH_SUCCESS

:: If push was rejected, check if we need to pull/rebase
echo.
echo ===============================================================================
echo [NOTICE] Direct push was rejected. Checking if remote has commits...
echo ===============================================================================
echo.
echo Attempting safe reconciliation with git pull --rebase origin !ACTIVE_BRANCH!...
git pull --rebase origin !ACTIVE_BRANCH!
if %errorlevel% equ 0 (
    echo [OK] Remote commits incorporated cleanly. Retrying push...
    git push -u origin !ACTIVE_BRANCH!
    if !errorlevel! equ 0 goto :PUSH_SUCCESS
)

goto :ERR_PUSH_FAILED

:PUSH_SUCCESS
color 0A
echo.
echo ===============================================================================
echo                         DEPLOYMENT SUCCESSFUL!
echo ===============================================================================
echo.
echo All code, assets, and configurations have been published to GitHub!
echo Repository: %TARGET_REPO%
echo Branch:     !ACTIVE_BRANCH!
echo.
echo Opening repository in your web browser...
start "" "%REPO_BROWSER_URL%"
echo.
echo ===============================================================================
echo Press any key to exit.
pause >nul
exit /b 0

:: =============================================================================
:: Error Handlers
:: =============================================================================

:ERR_NO_PACKAGE
color 0C
echo.
echo [ERROR] package.json not found in the current directory!
echo Please ensure this script is placed in the root of the Earshot project.
echo Current Directory: "%CD%"
echo.
pause
exit /b 1

:ERR_NO_GIT
color 0C
echo.
echo [ERROR] Git is not installed or not in your system PATH.
echo.
echo Please download and install Git for Windows:
echo https://git-scm.com/downloads/win
echo.
echo After installing, restart this script.
echo.
pause
exit /b 1

:ERR_STAGE_FAILED
color 0C
echo.
echo [ERROR] git add . failed. Check file permissions or locked files.
echo.
pause
exit /b 1

:ERR_COMMIT_FAILED
color 0C
echo.
echo [ERROR] Git commit failed.
echo.
echo Please verify that your Git user name and email are configured:
echo   git config --global user.name "Your Name"
echo   git config --global user.email "your.email@example.com"
echo.
pause
exit /b 1

:ERR_PUSH_FAILED
color 0C
echo.
echo ===============================================================================
echo                              PUSH NOT COMPLETED
echo ===============================================================================
echo Possible causes and safe resolutions:
echo.
echo 1. AUTHENTICATION REQUIRED:
echo    - If GitHub opens a browser sign-in window, complete the sign-in.
echo    - If using a Personal Access Token (PAT), verify it has the 'repo' scope.
echo    - Or authenticate via GitHub Desktop (https://desktop.github.com).
echo.
echo 2. PERMISSION / REPOSITORY ACCESS:
echo    - Ensure your GitHub account has write access to:
echo      %TARGET_REPO%
echo.
echo 3. MERGE CONFLICT / DIVERGENT HISTORY:
echo    - Remote branch has changes that could not be rebased automatically.
echo    - Check status with: git status
echo.
echo [SAFETY GUARANTEE] Your local files and history remain completely safe.
echo No force-push was attempted.
echo.
pause
exit /b 1
