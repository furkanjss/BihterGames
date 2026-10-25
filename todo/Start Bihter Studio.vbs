Set sh = CreateObject("WScript.Shell")
todoDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
cmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & todoDir & "\start-studio.ps1"""
sh.Run cmd, 0, False
