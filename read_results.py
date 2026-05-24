with open(r"c:\Users\ajsch\AppData\Roaming\Code\User\workspaceStorage\7800792b2b4eb4caa3e0b6d25bb88637\GitHub.copilot-chat\chat-session-resources\94f97c99-7a7d-426e-93f6-98c1eefab4e5\call_MHxLZ1FJZURqY1dnc25SM05ub2c__vscode-1779273478713\content.txt", "r", encoding="utf-8") as f:
    lines = f.readlines()
    for i in range(100, min(200, len(lines))):
        print(lines[i].strip())
